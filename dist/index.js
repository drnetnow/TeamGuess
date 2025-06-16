var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import * as z2 from "zod";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminLoginSchema: () => adminLoginSchema,
  adminOverrideSchema: () => adminOverrideSchema,
  gameJoinSchema: () => gameJoinSchema,
  games: () => games,
  gamesRelations: () => gamesRelations,
  guesses: () => guesses,
  guessesRelations: () => guessesRelations,
  insertGameSchema: () => insertGameSchema,
  insertGuessSchema: () => insertGuessSchema,
  insertPlayerSchema: () => insertPlayerSchema,
  insertRoundSchema: () => insertRoundSchema,
  insertUserSchema: () => insertUserSchema,
  players: () => players,
  playersRelations: () => playersRelations,
  rounds: () => rounds,
  roundsRelations: () => roundsRelations,
  submitAnswerSchema: () => submitAnswerSchema,
  submitGuessSchema: () => submitGuessSchema,
  users: () => users
});
import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var games = pgTable("games", {
  id: text("id").primaryKey(),
  secretWord: text("secretWord").notNull(),
  adminSecretWord: text("adminSecretWord").notNull(),
  currentRound: integer("currentRound").notNull().default(1),
  isComplete: boolean("isComplete").notNull().default(false)
});
var players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  photoUrl: text("photoUrl").notNull(),
  score: integer("score").notNull().default(0),
  gameId: text("gameId").notNull().references(() => games.id, { onDelete: "cascade" }),
  secretWord: text("secretWord").notNull()
  // Unique secret word for each player
});
var rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  gameId: text("gameId").notNull().references(() => games.id, { onDelete: "cascade" }),
  roundNumber: integer("roundNumber").notNull(),
  correctAnswer: text("correctAnswer"),
  complete: boolean("complete").notNull().default(false)
});
var guesses = pgTable("guesses", {
  id: serial("id").primaryKey(),
  playerId: integer("playerId").notNull().references(() => players.id, { onDelete: "cascade" }),
  gameId: text("gameId").notNull().references(() => games.id, { onDelete: "cascade" }),
  round: integer("round").notNull(),
  guess: text("guess").notNull(),
  isCorrect: boolean("isCorrect").default(false)
});
var gamesRelations = relations(games, ({ many }) => ({
  players: many(players),
  rounds: many(rounds),
  guesses: many(guesses)
}));
var playersRelations = relations(players, ({ one, many }) => ({
  game: one(games, {
    fields: [players.gameId],
    references: [games.id]
  }),
  guesses: many(guesses)
}));
var roundsRelations = relations(rounds, ({ one, many }) => ({
  game: one(games, {
    fields: [rounds.gameId],
    references: [games.id]
  })
}));
var guessesRelations = relations(guesses, ({ one }) => ({
  player: one(players, {
    fields: [guesses.playerId],
    references: [players.id]
  }),
  game: one(games, {
    fields: [guesses.gameId],
    references: [games.id]
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertPlayerSchema = createInsertSchema(players).pick({
  name: true,
  photoUrl: true,
  gameId: true,
  secretWord: true
});
var insertGameSchema = createInsertSchema(games).pick({
  id: true,
  secretWord: true,
  adminSecretWord: true
});
var insertGuessSchema = createInsertSchema(guesses).pick({
  playerId: true,
  gameId: true,
  round: true,
  guess: true,
  isCorrect: true
});
var insertRoundSchema = createInsertSchema(rounds).pick({
  gameId: true,
  roundNumber: true
});
var gameJoinSchema = z.object({
  playerName: z.string().min(1, "Name is required"),
  gameId: z.string().min(1, "Game ID is required"),
  photoUrl: z.string().optional()
});
var adminLoginSchema = z.object({
  adminSecretWord: z.string().min(1, "Admin secret word is required")
});
var submitGuessSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.number().int(),
  round: z.number().int(),
  guess: z.string().min(1, "Guess is required")
});
var submitAnswerSchema = z.object({
  gameId: z.string().min(1),
  round: z.number().int(),
  correctAnswer: z.string().min(1, "Answer is required")
});
var adminOverrideSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.number().int(),
  round: z.number().int(),
  isCorrect: z.boolean()
});

// client/src/lib/matchGuesses.ts
import { stringSimilarity } from "string-similarity-js";
function isCloseEnoughMatch(correctAnswer, playerGuess) {
  if (!correctAnswer || !playerGuess) return false;
  const normalizedAnswer = correctAnswer.toLowerCase().trim();
  const normalizedGuess = playerGuess.toLowerCase().trim();
  if (normalizedGuess === normalizedAnswer) return true;
  if (normalizedGuess.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedGuess)) {
    return true;
  }
  const similarityScore = stringSimilarity(normalizedAnswer, normalizedGuess);
  const SIMILARITY_THRESHOLD = 0.75;
  if (similarityScore >= SIMILARITY_THRESHOLD) {
    return true;
  }
  if (normalizedAnswer + "s" === normalizedGuess || normalizedGuess + "s" === normalizedAnswer) {
    return true;
  }
  const answerWords = normalizedAnswer.split(/\s+/);
  const guessWords = normalizedGuess.split(/\s+/);
  if (answerWords.length > 1) {
    const importantAnswerWords = answerWords.filter((word) => word.length > 3);
    for (const word of importantAnswerWords) {
      if (guessWords.some((guessWord) => {
        const wordSimilarity = stringSimilarity(word, guessWord);
        return wordSimilarity > 0.8;
      })) {
        return true;
      }
    }
  }
  return false;
}

// client/src/lib/stateNames.ts
var US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming"
];
function getRandomState() {
  return US_STATES[Math.floor(Math.random() * US_STATES.length)];
}

// server/storage.ts
import session2 from "express-session";
import createMemoryStore from "memorystore";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/database-storage.ts
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    const PostgresSessionStore2 = connectPg(session);
    this.sessionStore = new PostgresSessionStore2({
      pool,
      createTableIfMissing: true
    });
  }
  // User methods
  async getUser(id) {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }
  async getUserByUsername(username) {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }
  async createUser(insertUser) {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  // Game methods
  async createGame(gameData) {
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
    await this.createRound({
      gameId: id,
      roundNumber: 1
    });
    return game;
  }
  async getGame(gameId) {
    const results = await db.select().from(games).where(eq(games.id, gameId));
    return results[0];
  }
  async getAllGames() {
    return await db.select().from(games);
  }
  async getGameBySecretWord(secretWord) {
    const results = await db.select().from(games).where(eq(games.secretWord, secretWord));
    return results[0];
  }
  async getGameByAdminSecretWord(adminSecretWord) {
    const results = await db.select().from(games).where(eq(games.adminSecretWord, adminSecretWord));
    return results[0];
  }
  async updateGame(gameId, updates) {
    const result = await db.update(games).set(updates).where(eq(games.id, gameId)).returning();
    return result[0];
  }
  async completeGame(gameId) {
    return this.updateGame(gameId, { isComplete: true });
  }
  // Player methods
  async createPlayer(playerData) {
    const values = {
      ...playerData,
      score: 0,
      secretWord: playerData.secretWord || `player-${Math.random().toString(36).substring(2, 8)}`
    };
    const [player] = await db.insert(players).values(values).returning();
    return player;
  }
  async getPlayer(playerId) {
    const results = await db.select().from(players).where(eq(players.id, playerId));
    return results[0];
  }
  async getPlayersByGame(gameId) {
    return await db.select().from(players).where(eq(players.gameId, gameId));
  }
  async getPlayerBySecretWord(secretWord) {
    const results = await db.select().from(players).where(eq(players.secretWord, secretWord));
    return results[0];
  }
  async updatePlayerScore(playerId, increment) {
    const currentPlayer = await this.getPlayer(playerId);
    if (!currentPlayer) return void 0;
    const newScore = currentPlayer.score + increment;
    const result = await db.update(players).set({ score: newScore }).where(eq(players.id, playerId)).returning();
    return result[0];
  }
  // Round methods
  async createRound(roundData) {
    const roundValues = {
      ...roundData,
      correctAnswer: null,
      complete: false
    };
    const [round] = await db.insert(rounds).values(roundValues).returning();
    return round;
  }
  async getRound(gameId, roundNumber) {
    const results = await db.select().from(rounds).where(and(
      eq(rounds.gameId, gameId),
      eq(rounds.roundNumber, roundNumber)
    ));
    return results[0];
  }
  async getCurrentRound(gameId) {
    const game = await this.getGame(gameId);
    if (!game) return void 0;
    return this.getRound(gameId, game.currentRound);
  }
  async submitAnswer(gameId, roundNumber, correctAnswer) {
    const result = await db.update(rounds).set({
      correctAnswer,
      complete: true
    }).where(and(
      eq(rounds.gameId, gameId),
      eq(rounds.roundNumber, roundNumber)
    )).returning();
    if (!result[0]) return void 0;
    await this.evaluateGuesses(gameId, roundNumber);
    return result[0];
  }
  // Guess methods
  async createGuess(guessData) {
    const guessValues = {
      ...guessData,
      isCorrect: guessData.isCorrect ?? false
    };
    const [guess] = await db.insert(guesses).values(guessValues).returning();
    return guess;
  }
  async updateGuess(guessId, newGuessText) {
    const result = await db.update(guesses).set({ guess: newGuessText }).where(eq(guesses.id, guessId)).returning();
    return result[0];
  }
  async getPlayerGuessForRound(playerId, gameId, round) {
    const results = await db.select().from(guesses).where(and(
      eq(guesses.playerId, playerId),
      eq(guesses.gameId, gameId),
      eq(guesses.round, round)
    ));
    return results[0];
  }
  async getAllGuessesForRound(gameId, round) {
    return await db.select().from(guesses).where(and(
      eq(guesses.gameId, gameId),
      eq(guesses.round, round)
    ));
  }
  async evaluateGuesses(gameId, round) {
    const roundData = await this.getRound(gameId, round);
    if (!roundData || !roundData.correctAnswer) return [];
    const correctAnswer = roundData.correctAnswer;
    const allGuesses = await this.getAllGuessesForRound(gameId, round);
    const updatedGuesses = [];
    for (const guess of allGuesses) {
      const isCorrect = isCloseEnoughMatch(correctAnswer, guess.guess);
      if (isCorrect) {
        const result = await db.update(guesses).set({ isCorrect: true }).where(eq(guesses.id, guess.id)).returning();
        if (result[0]) {
          updatedGuesses.push(result[0]);
          await this.updatePlayerScore(guess.playerId, 1);
        }
      }
    }
    return updatedGuesses;
  }
  async adminOverrideGuess(gameId, playerId, round, isCorrect) {
    let guess = await this.getPlayerGuessForRound(playerId, gameId, round);
    if (!guess) {
      const roundData = await this.getRound(gameId, round);
      if (!roundData || !roundData.complete) {
        return void 0;
      }
      guess = await this.createGuess({
        playerId,
        gameId,
        round,
        guess: "(No guess submitted)",
        isCorrect: false
        // Default to incorrect
      });
    }
    const wasCorrectBefore = guess.isCorrect;
    const result = await db.update(guesses).set({ isCorrect }).where(eq(guesses.id, guess.id)).returning();
    if (!result[0]) return void 0;
    if (wasCorrectBefore && !isCorrect) {
      await this.updatePlayerScore(playerId, -1);
    } else if (!wasCorrectBefore && isCorrect) {
      await this.updatePlayerScore(playerId, 1);
    }
    return result[0];
  }
  // Game state methods
  async getGameWithPlayers(gameId) {
    const game = await this.getGame(gameId);
    if (!game) return void 0;
    const allPlayers = await this.getPlayersByGame(gameId);
    const currentRound = await this.getRound(gameId, game.currentRound);
    const winners = await this.getWinners(gameId);
    const playersWithGuesses = await Promise.all(
      allPlayers.map(async (player) => {
        const currentGuess = await this.getPlayerGuessForRound(
          player.id,
          gameId,
          game.currentRound
        );
        const isPotus = winners.potus?.id === player.id;
        const isVicePotus = winners.vicePotuses.some((vp) => vp.id === player.id);
        return {
          ...player,
          currentGuess,
          isPotus,
          isVicePotus
        };
      })
    );
    const gameWithPlayers = {
      ...game,
      players: playersWithGuesses,
      currentRound
    };
    return gameWithPlayers;
  }
  async getWinners(gameId) {
    const allPlayers = await this.getPlayersByGame(gameId);
    if (allPlayers.length === 0) {
      return { potus: null, vicePotuses: [] };
    }
    const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score);
    if (sortedPlayers.length === 0) {
      return { potus: null, vicePotuses: [] };
    }
    const highestScore = sortedPlayers[0].score;
    const highestScorePlayers = sortedPlayers.filter(
      (player) => player.score === highestScore
    );
    if (highestScorePlayers.length === 1) {
      return {
        potus: highestScorePlayers[0],
        vicePotuses: sortedPlayers.slice(1).filter((p) => p.score > 0)
      };
    } else {
      const potusIndex = Math.floor(Math.random() * highestScorePlayers.length);
      const potus = highestScorePlayers[potusIndex];
      const vicePotuses = highestScorePlayers.filter((p) => p.id !== potus.id);
      return { potus, vicePotuses };
    }
  }
  // Helper methods
  generateRandomWord(isAdmin = false) {
    const words = isAdmin ? ["constitution", "democracy", "administration", "government", "presidential", "executive"] : ["freedom", "liberty", "justice", "equality", "independence", "unity"];
    return words[Math.floor(Math.random() * words.length)];
  }
};

// server/storage.ts
var MemoryStore = createMemoryStore(session2);
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session3 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg2 from "connect-pg-simple";
var PostgresSessionStore = connectPg2(session3);
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionStore = new PostgresSessionStore({
    pool,
    createTableIfMissing: true
  });
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required for production");
  }
  const sessionSettings = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session3(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password)
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/routes.ts
function validateRequest(schema, req, res) {
  try {
    return schema.parse(req.body);
  } catch (error) {
    if (error instanceof z2.ZodError) {
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
async function registerRoutes(app2) {
  setupAuth(app2);
  const httpServer = createServer(app2);
  const broadcastGameUpdate = async (gameId) => {
    const gameData = await storage.getGameWithPlayers(gameId);
    if (!gameData) return;
    console.log(`Game updated: ${gameId}`);
  };
  app2.post("/api/games", async (req, res) => {
    try {
      const game = await storage.createGame({});
      res.status(201).json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to create game" });
    }
  });
  app2.get("/api/games/:gameId", async (req, res) => {
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
  app2.post("/api/games/join", async (req, res) => {
    const validated = validateRequest(gameJoinSchema, req, res);
    if (!validated) return;
    try {
      const { playerName, gameId, photoUrl } = validated;
      console.log(`Login attempt: name=${playerName}, gameId=${gameId}`);
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found with that ID" });
      }
      const existingPlayers = await storage.getPlayersByGame(gameId);
      const existingPlayer = existingPlayers.find((p) => p.name.toLowerCase() === playerName.toLowerCase());
      let player;
      if (existingPlayer) {
        console.log(`Using existing player: ${existingPlayer.name} with ID ${existingPlayer.id}`);
        player = existingPlayer;
      } else {
        const playerSecretWord = `player-${Math.random().toString(36).substring(2, 8)}`;
        console.log(`Creating new player with name: ${playerName} and secret word: ${playerSecretWord}`);
        const defaultPhotoUrl = `/api/placeholder/${encodeURIComponent(playerName)}`;
        player = await storage.createPlayer({
          name: playerName,
          photoUrl: photoUrl || defaultPhotoUrl,
          gameId: game.id,
          secretWord: playerSecretWord
        });
        console.log(`Created new player ${player.name} with ID ${player.id} and secret ${player.secretWord}`);
      }
      const gameWithPlayers = await storage.getGameWithPlayers(game.id);
      res.status(201).json({
        player,
        game: gameWithPlayers
      });
      await broadcastGameUpdate(game.id);
    } catch (error) {
      console.error("Error joining game:", error);
      res.status(500).json({ message: "Failed to join game" });
    }
  });
  app2.post("/api/admin/login", async (req, res) => {
    const validated = validateRequest(adminLoginSchema, req, res);
    if (!validated) return;
    try {
      const { adminSecretWord } = validated;
      const game = await storage.getGameByAdminSecretWord(adminSecretWord);
      if (!game) {
        return res.status(401).json({ message: "Invalid admin secret word" });
      }
      const gameWithPlayers = await storage.getGameWithPlayers(game.id);
      res.status(200).json({
        game: gameWithPlayers,
        isAdmin: true
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to login as admin" });
    }
  });
  app2.post("/api/games/:gameId/guess", async (req, res) => {
    const validated = validateRequest(submitGuessSchema, req, res);
    if (!validated) return;
    try {
      const { gameId, playerId, round, guess } = validated;
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      const player = await storage.getPlayer(playerId);
      if (!player || player.gameId !== gameId) {
        return res.status(404).json({ message: "Player not found" });
      }
      const currentRound = await storage.getRound(gameId, round);
      if (currentRound && currentRound.complete) {
        return res.status(400).json({ message: "Cannot submit or update guess for a completed round" });
      }
      const existingGuess = await storage.getPlayerGuessForRound(playerId, gameId, round);
      let newGuess;
      if (existingGuess) {
        console.log(`Updating guess for player ${playerId} in round ${round} from "${existingGuess.guess}" to "${guess}"`);
        newGuess = await storage.updateGuess(existingGuess.id, guess);
      } else {
        newGuess = await storage.createGuess({
          playerId,
          gameId,
          round,
          guess
        });
      }
      res.status(201).json(newGuess);
      await broadcastGameUpdate(gameId);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit guess" });
    }
  });
  app2.post("/api/games/:gameId/answer", async (req, res) => {
    const validated = validateRequest(submitAnswerSchema, req, res);
    if (!validated) return;
    try {
      const { gameId, round, correctAnswer } = validated;
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      const updatedRound = await storage.submitAnswer(gameId, round, correctAnswer);
      if (!updatedRound) {
        return res.status(404).json({ message: "Round not found" });
      }
      const updatedGame = await storage.getGameWithPlayers(gameId);
      res.status(200).json(updatedGame);
      await broadcastGameUpdate(gameId);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });
  app2.get("/api/games/:gameId/winners", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      await storage.completeGame(gameId);
      const winners = await storage.getWinners(gameId);
      res.status(200).json(winners);
      await broadcastGameUpdate(gameId);
    } catch (error) {
      res.status(500).json({ message: "Failed to get winners" });
    }
  });
  app2.post("/api/games/:gameId/override", async (req, res) => {
    const validated = validateRequest(adminOverrideSchema, req, res);
    if (!validated) return;
    try {
      const { gameId, playerId, round, isCorrect } = validated;
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      const roundData = await storage.getRound(gameId, round);
      if (!roundData) {
        return res.status(404).json({ message: "Round not found" });
      }
      if (!roundData.complete) {
        return res.status(400).json({ message: "Cannot override guess for incomplete round" });
      }
      const updatedGuess = await storage.adminOverrideGuess(gameId, playerId, round, isCorrect);
      if (!updatedGuess) {
        return res.status(404).json({ message: "Guess not found" });
      }
      const updatedGame = await storage.getGameWithPlayers(gameId);
      res.status(200).json(updatedGame);
      await broadcastGameUpdate(gameId);
    } catch (error) {
      res.status(500).json({ message: "Failed to override guess" });
    }
  });
  app2.post("/api/games/:gameId/nextRound", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      const currentRound = await storage.getRound(gameId, game.currentRound);
      if (!currentRound) {
        return res.status(404).json({ message: "Current round not found" });
      }
      if (!currentRound.complete) {
        return res.status(400).json({ message: "Current round is not complete yet" });
      }
      const nextRoundNumber = game.currentRound + 1;
      await storage.createRound({
        gameId,
        roundNumber: nextRoundNumber
      });
      const updatedGame = await storage.updateGame(gameId, { currentRound: nextRoundNumber });
      const gameWithPlayers = await storage.getGameWithPlayers(gameId);
      res.status(200).json(gameWithPlayers);
      await broadcastGameUpdate(gameId);
    } catch (error) {
      res.status(500).json({ message: "Failed to advance to next round" });
    }
  });
  app2.post("/api/players", async (req, res) => {
    try {
      const { gameId, name, photoUrl, secretWord } = req.body;
      if (!gameId || !name) {
        return res.status(400).json({ message: "Game ID and player name are required" });
      }
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      const player = await storage.createPlayer({
        gameId,
        name,
        photoUrl: photoUrl || `/api/placeholder/${name.replace(/\s+/g, "-").toLowerCase()}`,
        secretWord: secretWord || `player-${Math.random().toString(36).substring(2, 8)}`
      });
      console.log(`Created new player: ${player.name} with secret: ${player.secretWord}`);
      await broadcastGameUpdate(gameId);
      res.status(201).json(player);
    } catch (error) {
      console.error("Failed to create player:", error);
      res.status(500).json({ message: "Failed to create player" });
    }
  });
  app2.patch("/api/players/:playerId", async (req, res) => {
    const playerId = parseInt(req.params.playerId);
    try {
      const validated = validateRequest(insertPlayerSchema.partial(), req, res);
      if (!validated) return;
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      const updates = { ...player, ...validated };
      const updatedPlayer = await storage.updatePlayerScore(playerId, 0);
      if (!updatedPlayer) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.status(200).json(updatedPlayer);
      await broadcastGameUpdate(player.gameId);
    } catch (error) {
      res.status(500).json({ message: "Failed to update player" });
    }
  });
  app2.get("/api/placeholder/:name", (req, res) => {
    const name = req.params.name;
    const encodedName = encodeURIComponent(name);
    res.redirect(`https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=256`);
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Server error:", err);
    res.status(status).json({ message });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = process.env.PORT || 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
