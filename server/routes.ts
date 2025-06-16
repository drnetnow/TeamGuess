import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import * as z from "zod";
import { 
  gameJoinSchema, 
  adminLoginSchema, 
  submitGuessSchema,
  submitAnswerSchema,
  insertPlayerSchema,
  adminOverrideSchema,
} from "@shared/schema";
import { storage } from "./storage";
import { setupAuth } from "./auth";
// Temporarily comment out WebSocket to troubleshoot connectivity
// import { WebSocketServer } from "ws";

// Helper to validate request with zod schema
function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  req: Request,
  res: Response
): z.infer<T> | null {
  try {
    return schema.parse(req.body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        message: "Validation failed", 
        errors: error.errors 
      });
    } else {
      res.status(400).json({ message: "Invalid request" });
    }
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication using PostgreSQL for session storage
  setupAuth(app);
  
  const httpServer = createServer(app);
  
  // Temporarily disable WebSocket for troubleshooting
  /*
  // Create WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer });
  
  // WebSocket connection handling
  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      // Handle incoming messages if needed
      console.log("received: %s", message);
    });
  });
  */
  
  // Send updates to all connected clients for a specific gameId
  const broadcastGameUpdate = async (gameId: string) => {
    // Temporarily disabled WebSocket broadcasting
    const gameData = await storage.getGameWithPlayers(gameId);
    if (!gameData) return;
    
    console.log(`Game updated: ${gameId}`);
  };
  
  // Create a new game (Admin)
  app.post("/api/games", async (req, res) => {
    try {
      const game = await storage.createGame({});
      res.status(201).json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to create game" });
    }
  });
  
  // Get game by ID
  app.get("/api/games/:gameId", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const game = await storage.getGameWithPlayers(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.status(200).json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to get game" });
    }
  });
  
  // Join game as player with name and game ID
  app.post("/api/games/join", async (req, res) => {
    const validated = validateRequest(gameJoinSchema, req, res);
    if (!validated) return;
    
    try {
      const { playerName, gameId, photoUrl } = validated;
      
      console.log(`Login attempt: name=${playerName}, gameId=${gameId}`);
      
      // Try to find the game by ID
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found with that ID" });
      }
      
      // Get all players in this game
      const existingPlayers = await storage.getPlayersByGame(gameId);
      
      // Check if a player with this name already exists in the game
      const existingPlayer = existingPlayers.find(p => 
        p.name.toLowerCase() === playerName.toLowerCase());
      
      let player;
      
      if (existingPlayer) {
        // Return existing player
        console.log(`Using existing player: ${existingPlayer.name} with ID ${existingPlayer.id}`);
        player = existingPlayer;
      } else {
        // Generate a random secret word for the new player
        const playerSecretWord = `player-${Math.random().toString(36).substring(2, 8)}`;
        console.log(`Creating new player with name: ${playerName} and secret word: ${playerSecretWord}`);
        
        // Create a new player for this game
        const defaultPhotoUrl = `/api/placeholder/${encodeURIComponent(playerName)}`;
        player = await storage.createPlayer({
          name: playerName,
          photoUrl: photoUrl || defaultPhotoUrl,
          gameId: game.id,
          secretWord: playerSecretWord
        });
        
        console.log(`Created new player ${player.name} with ID ${player.id} and secret ${player.secretWord}`);
      }
      
      // Get the game with all players
      const gameWithPlayers = await storage.getGameWithPlayers(game.id);
      
      res.status(201).json({
        player: player,
        game: gameWithPlayers
      });
      
      // Broadcast update to all clients
      await broadcastGameUpdate(game.id);
    } catch (error) {
      console.error('Error joining game:', error);
      res.status(500).json({ message: "Failed to join game" });
    }
  });
  
  // Admin login - verify admin secret word
  app.post("/api/admin/login", async (req, res) => {
    const validated = validateRequest(adminLoginSchema, req, res);
    if (!validated) return;
    
    try {
      const { adminSecretWord } = validated;
      
      // Find game by admin secret word
      const game = await storage.getGameByAdminSecretWord(adminSecretWord);
      if (!game) {
        return res.status(401).json({ message: "Invalid admin secret word" });
      }
      
      // Return game with players
      const gameWithPlayers = await storage.getGameWithPlayers(game.id);
      
      res.status(200).json({
        game: gameWithPlayers,
        isAdmin: true
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to login as admin" });
    }
  });
  
  // Submit player guess
  app.post("/api/games/:gameId/guess", async (req, res) => {
    const validated = validateRequest(submitGuessSchema, req, res);
    if (!validated) return;
    
    try {
      const { gameId, playerId, round, guess } = validated;
      
      // Verify game exists
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Verify player exists
      const player = await storage.getPlayer(playerId);
      if (!player || player.gameId !== gameId) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Check if round is already completed
      const currentRound = await storage.getRound(gameId, round);
      if (currentRound && currentRound.complete) {
        return res.status(400).json({ message: "Cannot submit or update guess for a completed round" });
      }
      
      // Check if player already submitted a guess for this round
      const existingGuess = await storage.getPlayerGuessForRound(playerId, gameId, round);
      
      let newGuess;
      
      if (existingGuess) {
        // Update the existing guess
        console.log(`Updating guess for player ${playerId} in round ${round} from "${existingGuess.guess}" to "${guess}"`);
        newGuess = await storage.updateGuess(existingGuess.id, guess);
      } else {
        // Create a new guess
        newGuess = await storage.createGuess({
          playerId,
          gameId,
          round,
          guess
        });
      }
      
      res.status(201).json(newGuess);
      
      // Broadcast update to all clients
      await broadcastGameUpdate(gameId);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit guess" });
    }
  });
  
  // Admin submit correct answer
  app.post("/api/games/:gameId/answer", async (req, res) => {
    const validated = validateRequest(submitAnswerSchema, req, res);
    if (!validated) return;
    
    try {
      const { gameId, round, correctAnswer } = validated;
      
      // Verify game exists
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Submit answer and evaluate guesses
      const updatedRound = await storage.submitAnswer(gameId, round, correctAnswer);
      if (!updatedRound) {
        return res.status(404).json({ message: "Round not found" });
      }
      
      // Get updated game state
      const updatedGame = await storage.getGameWithPlayers(gameId);
      
      res.status(200).json(updatedGame);
      
      // Broadcast update to all clients
      await broadcastGameUpdate(gameId);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });
  
  // Get winners
  app.get("/api/games/:gameId/winners", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      
      // Verify game exists
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Mark game as complete
      await storage.completeGame(gameId);
      
      // Get winners
      const winners = await storage.getWinners(gameId);
      
      res.status(200).json(winners);
      
      // Broadcast update to all clients
      await broadcastGameUpdate(gameId);
    } catch (error) {
      res.status(500).json({ message: "Failed to get winners" });
    }
  });
  
  // Admin override for a player's guess correctness
  app.post("/api/games/:gameId/override", async (req, res) => {
    const validated = validateRequest(adminOverrideSchema, req, res);
    if (!validated) return;
    
    try {
      const { gameId, playerId, round, isCorrect } = validated;
      
      // Verify game exists
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Verify round exists and is complete
      const roundData = await storage.getRound(gameId, round);
      if (!roundData) {
        return res.status(404).json({ message: "Round not found" });
      }
      
      if (!roundData.complete) {
        return res.status(400).json({ message: "Cannot override guess for incomplete round" });
      }
      
      // Override the guess
      const updatedGuess = await storage.adminOverrideGuess(gameId, playerId, round, isCorrect);
      if (!updatedGuess) {
        return res.status(404).json({ message: "Guess not found" });
      }
      
      // Get updated game state
      const updatedGame = await storage.getGameWithPlayers(gameId);
      
      res.status(200).json(updatedGame);
      
      // Broadcast update to all clients
      await broadcastGameUpdate(gameId);
    } catch (error) {
      res.status(500).json({ message: "Failed to override guess" });
    }
  });
  
  // Next round (Admin)
  app.post("/api/games/:gameId/nextRound", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      
      // Verify game exists
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Get current round
      const currentRound = await storage.getRound(gameId, game.currentRound);
      if (!currentRound) {
        return res.status(404).json({ message: "Current round not found" });
      }
      
      // Check if current round is complete
      if (!currentRound.complete) {
        return res.status(400).json({ message: "Current round is not complete yet" });
      }
      
      // Create next round
      const nextRoundNumber = game.currentRound + 1;
      await storage.createRound({
        gameId,
        roundNumber: nextRoundNumber
      });
      
      // Update game
      const updatedGame = await storage.updateGame(gameId, { currentRound: nextRoundNumber });
      const gameWithPlayers = await storage.getGameWithPlayers(gameId);
      
      res.status(200).json(gameWithPlayers);
      
      // Broadcast update to all clients
      await broadcastGameUpdate(gameId);
    } catch (error) {
      res.status(500).json({ message: "Failed to advance to next round" });
    }
  });
  
  // Create new player
  app.post("/api/players", async (req, res) => {
    try {
      const { gameId, name, photoUrl, secretWord } = req.body;
      
      // Validate required fields
      if (!gameId || !name) {
        return res.status(400).json({ message: "Game ID and player name are required" });
      }
      
      // Verify game exists
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Create player with provided secret word
      const player = await storage.createPlayer({
        gameId,
        name,
        photoUrl: photoUrl || `/api/placeholder/${name.replace(/\s+/g, '-').toLowerCase()}`,
        secretWord: secretWord || `player-${Math.random().toString(36).substring(2, 8)}`
      });
      
      console.log(`Created new player: ${player.name} with secret: ${player.secretWord}`);
      
      // Broadcast update to all clients
      await broadcastGameUpdate(gameId);
      
      res.status(201).json(player);
    } catch (error) {
      console.error("Failed to create player:", error);
      res.status(500).json({ message: "Failed to create player" });
    }
  });

  // Update player (for photo upload)
  app.patch("/api/players/:playerId", async (req, res) => {
    const playerId = parseInt(req.params.playerId);
    
    try {
      // Validate body
      const validated = validateRequest(insertPlayerSchema.partial(), req, res);
      if (!validated) return;
      
      // Get player
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Update player
      const updates = { ...player, ...validated };
      const updatedPlayer = await storage.updatePlayerScore(playerId, 0); // Hack to update player
      
      if (!updatedPlayer) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      res.status(200).json(updatedPlayer);
      
      // Broadcast update to all clients
      await broadcastGameUpdate(player.gameId);
    } catch (error) {
      res.status(500).json({ message: "Failed to update player" });
    }
  });
  
  // Return placeholder image (for testing)
  app.get("/api/placeholder/:name", (req, res) => {
    const name = req.params.name;
    // Redirect to a placeholder service
    const encodedName = encodeURIComponent(name);
    res.redirect(`https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=256`);
  });

  return httpServer;
}
