import { nanoid } from "nanoid";
import {
  Player, Game, InsertGame, InsertPlayer, Round, 
  Guess, InsertRound, InsertGuess, User, InsertUser,
  GameWithPlayers
} from "@shared/schema";
import { isCloseEnoughMatch } from "../client/src/lib/matchGuesses";
import { getRandomState } from "../client/src/lib/stateNames";

import session from "express-session";

// Storage interface for the application
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game methods
  createGame(gameData: Partial<InsertGame>): Promise<Game>;
  getGame(gameId: string): Promise<Game | undefined>;
  getAllGames(): Promise<Game[]>;
  getGameBySecretWord(secretWord: string): Promise<Game | undefined>;
  getGameByAdminSecretWord(adminSecretWord: string): Promise<Game | undefined>;
  updateGame(gameId: string, updates: Partial<Game>): Promise<Game | undefined>;
  completeGame(gameId: string): Promise<Game | undefined>;
  
  // Player methods
  createPlayer(playerData: InsertPlayer): Promise<Player>;
  getPlayer(playerId: number): Promise<Player | undefined>;
  getPlayersByGame(gameId: string): Promise<Player[]>;
  getPlayerBySecretWord(secretWord: string): Promise<Player | undefined>;
  updatePlayerScore(playerId: number, increment: number): Promise<Player | undefined>;
  
  // Round methods
  createRound(roundData: InsertRound): Promise<Round>;
  getRound(gameId: string, roundNumber: number): Promise<Round | undefined>;
  getCurrentRound(gameId: string): Promise<Round | undefined>;
  submitAnswer(gameId: string, roundNumber: number, correctAnswer: string): Promise<Round | undefined>;
  
  // Guess methods
  createGuess(guessData: InsertGuess): Promise<Guess>;
  updateGuess(guessId: number, newGuessText: string): Promise<Guess | undefined>;
  getPlayerGuessForRound(playerId: number, gameId: string, round: number): Promise<Guess | undefined>;
  getAllGuessesForRound(gameId: string, round: number): Promise<Guess[]>;
  evaluateGuesses(gameId: string, round: number): Promise<Guess[]>;
  
  // Admin override
  adminOverrideGuess(gameId: string, playerId: number, round: number, isCorrect: boolean): Promise<Guess | undefined>;
  
  // Game state methods
  getGameWithPlayers(gameId: string): Promise<GameWithPlayers | undefined>;
  getWinners(gameId: string): Promise<{ potus: Player | null, vicePotuses: Player[] }>;
}

// Import memory session store for the in-memory implementation
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

// In-memory implementation of IStorage - more reliable for testing
export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: User[] = [];
  private games: Game[] = [];
  private players: Player[] = [];
  private rounds: Round[] = [];
  private guesses: Guess[] = [];
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.users.length + 1;
    const user = { ...insertUser, id };
    this.users.push(user);
    return user;
  }

  // Game methods
  async createGame(gameData: Partial<InsertGame>): Promise<Game> {
    // Use a US state name as the game ID instead of a random string
    const id = gameData.id || getRandomState();
    const secretWord = gameData.secretWord || this.generateRandomWord();
    const adminSecretWord = gameData.adminSecretWord || this.generateRandomWord(true);
    
    const game: Game = {
      id,
      secretWord,
      adminSecretWord,
      currentRound: 1,
      isComplete: false
    };
    
    this.games.push(game);
    
    // Create initial round
    await this.createRound({
      gameId: id,
      roundNumber: 1
    });
    
    return game;
  }

  async getGame(gameId: string): Promise<Game | undefined> {
    return this.games.find(g => g.id === gameId);
  }
  
  async getAllGames(): Promise<Game[]> {
    return [...this.games];
  }

  async getGameBySecretWord(secretWord: string): Promise<Game | undefined> {
    return this.games.find(g => g.secretWord === secretWord);
  }

  async getGameByAdminSecretWord(adminSecretWord: string): Promise<Game | undefined> {
    return this.games.find(g => g.adminSecretWord === adminSecretWord);
  }

  async updateGame(gameId: string, updates: Partial<Game>): Promise<Game | undefined> {
    const index = this.games.findIndex(g => g.id === gameId);
    if (index === -1) return undefined;
    
    this.games[index] = { ...this.games[index], ...updates };
    return this.games[index];
  }

  async completeGame(gameId: string): Promise<Game | undefined> {
    return this.updateGame(gameId, { isComplete: true });
  }

  // Player methods
  async createPlayer(playerData: InsertPlayer): Promise<Player> {
    const id = this.players.length + 1;
    const player: Player = {
      ...playerData,
      id,
      score: 0,
      // Ensure we always have a secretWord
      secretWord: playerData.secretWord || `player-${Math.random().toString(36).substring(2, 8)}`
    };
    
    this.players.push(player);
    return player;
  }

  async getPlayer(playerId: number): Promise<Player | undefined> {
    return this.players.find(p => p.id === playerId);
  }

  async getPlayersByGame(gameId: string): Promise<Player[]> {
    return this.players.filter(p => p.gameId === gameId);
  }

  async getPlayerBySecretWord(secretWord: string): Promise<Player | undefined> {
    return this.players.find(p => p.secretWord === secretWord);
  }

  async updatePlayerScore(playerId: number, increment: number): Promise<Player | undefined> {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index === -1) return undefined;
    
    if (increment !== 0) {
      this.players[index].score += increment;
    }
    
    return this.players[index];
  }

  // Round methods
  async createRound(roundData: InsertRound): Promise<Round> {
    const id = this.rounds.length + 1;
    const round: Round = {
      ...roundData,
      id,
      correctAnswer: null,
      complete: false
    };
    
    this.rounds.push(round);
    return round;
  }

  async getRound(gameId: string, roundNumber: number): Promise<Round | undefined> {
    return this.rounds.find(r => r.gameId === gameId && r.roundNumber === roundNumber);
  }

  async getCurrentRound(gameId: string): Promise<Round | undefined> {
    const game = await this.getGame(gameId);
    if (!game) return undefined;
    
    return this.getRound(gameId, game.currentRound);
  }

  async submitAnswer(gameId: string, roundNumber: number, correctAnswer: string): Promise<Round | undefined> {
    const index = this.rounds.findIndex(r => r.gameId === gameId && r.roundNumber === roundNumber);
    if (index === -1) return undefined;
    
    this.rounds[index].correctAnswer = correctAnswer;
    this.rounds[index].complete = true;
    
    // Evaluate guesses
    await this.evaluateGuesses(gameId, roundNumber);
    
    return this.rounds[index];
  }

  // Guess methods
  async createGuess(guessData: InsertGuess): Promise<Guess> {
    const id = this.guesses.length + 1;
    const guess: Guess = {
      ...guessData,
      id,
      isCorrect: false
    };
    
    this.guesses.push(guess);
    return guess;
  }
  
  async updateGuess(guessId: number, newGuessText: string): Promise<Guess | undefined> {
    const index = this.guesses.findIndex(g => g.id === guessId);
    if (index === -1) return undefined;
    
    // Update the guess text
    this.guesses[index].guess = newGuessText;
    return this.guesses[index];
  }

  async getPlayerGuessForRound(playerId: number, gameId: string, round: number): Promise<Guess | undefined> {
    return this.guesses.find(g => 
      g.playerId === playerId && 
      g.gameId === gameId && 
      g.round === round
    );
  }

  async getAllGuessesForRound(gameId: string, round: number): Promise<Guess[]> {
    return this.guesses.filter(g => g.gameId === gameId && g.round === round);
  }

  async evaluateGuesses(gameId: string, round: number): Promise<Guess[]> {
    const roundData = await this.getRound(gameId, round);
    if (!roundData || !roundData.correctAnswer) return [];
    
    const correctAnswer = roundData.correctAnswer;
    const guesses = await this.getAllGuessesForRound(gameId, round);
    const updatedGuesses: Guess[] = [];
    
    for (const guess of guesses) {
      // Use our enhanced AI matching function instead of just string similarity
      const isCorrect = isCloseEnoughMatch(correctAnswer, guess.guess);
      
      if (isCorrect) {
        const index = this.guesses.findIndex(g => g.id === guess.id);
        if (index !== -1) {
          this.guesses[index].isCorrect = true;
          updatedGuesses.push(this.guesses[index]);
          
          // Increment player score
          await this.updatePlayerScore(guess.playerId, 1);
        }
      }
    }
    
    return updatedGuesses;
  }
  
  async adminOverrideGuess(gameId: string, playerId: number, round: number, isCorrect: boolean): Promise<Guess | undefined> {
    // Find the player's guess for this round
    let guess = await this.getPlayerGuessForRound(playerId, gameId, round);
    
    // If no guess exists for this player and round, create one
    if (!guess) {
      // Get round to check if it's complete
      const roundData = await this.getRound(gameId, round);
      if (!roundData || !roundData.complete) {
        return undefined; // Can't override for incomplete rounds
      }
      
      // Create a placeholder guess
      guess = await this.createGuess({
        playerId,
        gameId,
        round,
        guess: "(No guess submitted)",
        isCorrect: false // Default to incorrect
      });
    }
    
    // Find the index of the guess in our array
    const index = this.guesses.findIndex(g => g.id === guess.id);
    if (index === -1) {
      return undefined;
    }
    
    const wasCorrectBefore = this.guesses[index].isCorrect;
    
    // Update the correctness of the guess
    this.guesses[index].isCorrect = isCorrect;
    
    // Update the player's score based on the change
    if (wasCorrectBefore && !isCorrect) {
      // If it was correct before and now it's incorrect, decrement the score
      await this.updatePlayerScore(playerId, -1);
    } else if (!wasCorrectBefore && isCorrect) {
      // If it was incorrect before and now it's correct, increment the score
      await this.updatePlayerScore(playerId, 1);
    }
    
    return this.guesses[index];
  }

  // Game state methods
  async getGameWithPlayers(gameId: string): Promise<GameWithPlayers | undefined> {
    const game = await this.getGame(gameId);
    if (!game) return undefined;
    
    const players = await this.getPlayersByGame(gameId);
    const currentRound = await this.getRound(gameId, game.currentRound);
    
    // Get winners to assign isPotus and isVicePotus properties
    const winners = await this.getWinners(gameId);
    
    // Add current guesses to players
    const playersWithGuesses = await Promise.all(
      players.map(async (player) => {
        // Make sure we get guesses specific to this player, game, and round
        const currentGuess = await this.getPlayerGuessForRound(
          player.id,
          gameId,
          game.currentRound
        );
        
        // Check if this player is POTUS or Vice POTUS
        const isPotus = winners.potus?.id === player.id;
        const isVicePotus = winners.vicePotuses.some(vp => vp.id === player.id);
        
        return {
          ...player,
          currentGuess,
          isPotus,
          isVicePotus
        };
      })
    );
    
    // Create the game with players object with correct typing
    const gameWithPlayers: GameWithPlayers = {
      ...game,
      players: playersWithGuesses,
      // Set currentRound with a type assertion to any to work around type error
      currentRound: currentRound as any
    };
    
    return gameWithPlayers;
  }

  async getWinners(gameId: string): Promise<{ potus: Player | null, vicePotuses: Player[] }> {
    const players = await this.getPlayersByGame(gameId);
    if (players.length === 0) {
      return { potus: null, vicePotuses: [] };
    }
    
    // Sort players by score
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    if (sortedPlayers.length === 0) {
      return { potus: null, vicePotuses: [] };
    }
    
    const highestScore = sortedPlayers[0].score;
    
    // Find all players with highest score
    const highestScorePlayers = sortedPlayers.filter(
      player => player.score === highestScore
    );
    
    if (highestScorePlayers.length === 1) {
      // Clear winner
      return {
        potus: highestScorePlayers[0],
        vicePotuses: sortedPlayers.slice(1).filter(p => p.score > 0)
      };
    } else {
      // Randomly select one POTUS from tied highest scores
      const potusIndex = Math.floor(Math.random() * highestScorePlayers.length);
      const potus = highestScorePlayers[potusIndex];
      
      // All other high scorers become VPs
      const vicePotuses = highestScorePlayers.filter(p => p.id !== potus.id);
      
      return { potus, vicePotuses };
    }
  }
  
  // Helper methods
  private generateRandomWord(isAdmin = false): string {
    // Simple random word generation
    const words = isAdmin
      ? ['constitution', 'democracy', 'administration', 'government', 'presidential', 'executive']
      : ['freedom', 'liberty', 'justice', 'equality', 'independence', 'unity'];
    
    return words[Math.floor(Math.random() * words.length)];
  }
}

// Import the DatabaseStorage implementation
import { DatabaseStorage } from './database-storage';

// Use the PostgreSQL database storage instead of in-memory storage
export const storage = new DatabaseStorage();