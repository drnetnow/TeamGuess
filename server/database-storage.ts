import { 
  User, InsertUser, 
  Player, InsertPlayer,
  Game, InsertGame,
  Guess, InsertGuess,
  Round, InsertRound,
  GameWithPlayers,
  users,
  players,
  games,
  rounds,
  guesses
} from "@shared/schema";
import { isCloseEnoughMatch } from "@/lib/matchGuesses";
import { getRandomState } from "@/lib/stateNames";
import { db } from "./db";
import { eq, and, asc, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { IStorage } from "./storage";

// PostgreSQL implementation of IStorage
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Game methods
  async createGame(gameData: Partial<InsertGame>): Promise<Game> {
    // Use a US state name as the game ID instead of a random string
    const id = gameData.id || getRandomState();
    const secretWord = gameData.secretWord || this.generateRandomWord();
    const adminSecretWord = gameData.adminSecretWord || this.generateRandomWord(true);
    
    const gameValues = {
      id,
      secretWord,
      adminSecretWord,
      currentRound: 1,
      isComplete: false
    };
    
    const [game] = await db.insert(games).values(gameValues).returning();
    
    // Create initial round
    await this.createRound({
      gameId: id,
      roundNumber: 1
    });
    
    return game;
  }

  async getGame(gameId: string): Promise<Game | undefined> {
    const results = await db.select().from(games).where(eq(games.id, gameId));
    return results[0];
  }
  
  async getAllGames(): Promise<Game[]> {
    return await db.select().from(games);
  }

  async getGameBySecretWord(secretWord: string): Promise<Game | undefined> {
    const results = await db.select().from(games).where(eq(games.secretWord, secretWord));
    return results[0];
  }

  async getGameByAdminSecretWord(adminSecretWord: string): Promise<Game | undefined> {
    const results = await db.select().from(games).where(eq(games.adminSecretWord, adminSecretWord));
    return results[0];
  }

  async updateGame(gameId: string, updates: Partial<Game>): Promise<Game | undefined> {
    const result = await db.update(games)
      .set(updates)
      .where(eq(games.id, gameId))
      .returning();
    
    return result[0];
  }

  async completeGame(gameId: string): Promise<Game | undefined> {
    return this.updateGame(gameId, { isComplete: true });
  }

  // Player methods
  async createPlayer(playerData: InsertPlayer): Promise<Player> {
    // Ensure we always have a secretWord
    const values = {
      ...playerData,
      score: 0,
      secretWord: playerData.secretWord || `player-${Math.random().toString(36).substring(2, 8)}`
    };
    
    const [player] = await db.insert(players).values(values).returning();
    return player;
  }

  async getPlayer(playerId: number): Promise<Player | undefined> {
    const results = await db.select().from(players).where(eq(players.id, playerId));
    return results[0];
  }

  async getPlayersByGame(gameId: string): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.gameId, gameId));
  }

  async getPlayerBySecretWord(secretWord: string): Promise<Player | undefined> {
    const results = await db.select().from(players).where(eq(players.secretWord, secretWord));
    return results[0];
  }

  async updatePlayerScore(playerId: number, increment: number): Promise<Player | undefined> {
    // First get the current player to get the score
    const currentPlayer = await this.getPlayer(playerId);
    if (!currentPlayer) return undefined;
    
    const newScore = currentPlayer.score + increment;
    
    const result = await db.update(players)
      .set({ score: newScore })
      .where(eq(players.id, playerId))
      .returning();
    
    return result[0];
  }

  // Round methods
  async createRound(roundData: InsertRound): Promise<Round> {
    const roundValues = {
      ...roundData,
      correctAnswer: null,
      complete: false
    };
    
    const [round] = await db.insert(rounds).values(roundValues).returning();
    return round;
  }

  async getRound(gameId: string, roundNumber: number): Promise<Round | undefined> {
    const results = await db.select()
      .from(rounds)
      .where(and(
        eq(rounds.gameId, gameId),
        eq(rounds.roundNumber, roundNumber)
      ));
    
    return results[0];
  }

  async getCurrentRound(gameId: string): Promise<Round | undefined> {
    const game = await this.getGame(gameId);
    if (!game) return undefined;
    
    return this.getRound(gameId, game.currentRound);
  }

  async submitAnswer(gameId: string, roundNumber: number, correctAnswer: string): Promise<Round | undefined> {
    const result = await db.update(rounds)
      .set({ 
        correctAnswer,
        complete: true
      })
      .where(and(
        eq(rounds.gameId, gameId),
        eq(rounds.roundNumber, roundNumber)
      ))
      .returning();
    
    if (!result[0]) return undefined;
    
    // Evaluate guesses
    await this.evaluateGuesses(gameId, roundNumber);
    
    return result[0];
  }

  // Guess methods
  async createGuess(guessData: InsertGuess): Promise<Guess> {
    const guessValues = {
      ...guessData,
      isCorrect: guessData.isCorrect ?? false
    };
    
    const [guess] = await db.insert(guesses).values(guessValues).returning();
    return guess;
  }
  
  async updateGuess(guessId: number, newGuessText: string): Promise<Guess | undefined> {
    const result = await db.update(guesses)
      .set({ guess: newGuessText })
      .where(eq(guesses.id, guessId))
      .returning();
    
    return result[0];
  }

  async getPlayerGuessForRound(playerId: number, gameId: string, round: number): Promise<Guess | undefined> {
    const results = await db.select()
      .from(guesses)
      .where(and(
        eq(guesses.playerId, playerId),
        eq(guesses.gameId, gameId),
        eq(guesses.round, round)
      ));
    
    return results[0];
  }

  async getAllGuessesForRound(gameId: string, round: number): Promise<Guess[]> {
    return await db.select()
      .from(guesses)
      .where(and(
        eq(guesses.gameId, gameId),
        eq(guesses.round, round)
      ));
  }

  async evaluateGuesses(gameId: string, round: number): Promise<Guess[]> {
    const roundData = await this.getRound(gameId, round);
    if (!roundData || !roundData.correctAnswer) return [];
    
    const correctAnswer = roundData.correctAnswer;
    const allGuesses = await this.getAllGuessesForRound(gameId, round);
    const updatedGuesses: Guess[] = [];
    
    for (const guess of allGuesses) {
      // Use our enhanced AI matching function instead of just string similarity
      const isCorrect = isCloseEnoughMatch(correctAnswer, guess.guess);
      
      if (isCorrect) {
        const result = await db.update(guesses)
          .set({ isCorrect: true })
          .where(eq(guesses.id, guess.id))
          .returning();
        
        if (result[0]) {
          updatedGuesses.push(result[0]);
          
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
    
    const wasCorrectBefore = guess.isCorrect;
    
    // Update the correctness of the guess
    const result = await db.update(guesses)
      .set({ isCorrect })
      .where(eq(guesses.id, guess.id))
      .returning();
    
    if (!result[0]) return undefined;
    
    // Update the player's score based on the change
    if (wasCorrectBefore && !isCorrect) {
      // If it was correct before and now it's incorrect, decrement the score
      await this.updatePlayerScore(playerId, -1);
    } else if (!wasCorrectBefore && isCorrect) {
      // If it was incorrect before and now it's correct, increment the score
      await this.updatePlayerScore(playerId, 1);
    }
    
    return result[0];
  }

  // Game state methods
  async getGameWithPlayers(gameId: string): Promise<GameWithPlayers | undefined> {
    const game = await this.getGame(gameId);
    if (!game) return undefined;
    
    const allPlayers = await this.getPlayersByGame(gameId);
    const currentRound = await this.getRound(gameId, game.currentRound);
    
    // Get winners to assign isPotus and isVicePotus properties
    const winners = await this.getWinners(gameId);
    
    // Add current guesses to players
    const playersWithGuesses = await Promise.all(
      allPlayers.map(async (player) => {
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
      currentRound: currentRound as any
    };
    
    return gameWithPlayers;
  }

  async getWinners(gameId: string): Promise<{ potus: Player | null, vicePotuses: Player[] }> {
    const allPlayers = await this.getPlayersByGame(gameId);
    if (allPlayers.length === 0) {
      return { potus: null, vicePotuses: [] };
    }
    
    // Sort players by score
    const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score);
    
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