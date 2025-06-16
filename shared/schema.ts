import { pgTable, text, serial, integer, boolean, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const games = pgTable("games", {
  id: text("id").primaryKey(),
  secretWord: text("secretWord").notNull(),
  adminSecretWord: text("adminSecretWord").notNull(),
  currentRound: integer("currentRound").notNull().default(1),
  isComplete: boolean("isComplete").notNull().default(false),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  photoUrl: text("photoUrl").notNull(),
  score: integer("score").notNull().default(0),
  gameId: text("gameId").notNull().references(() => games.id, { onDelete: 'cascade' }),
  secretWord: text("secretWord").notNull(),  // Unique secret word for each player
});

export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  gameId: text("gameId").notNull().references(() => games.id, { onDelete: 'cascade' }),
  roundNumber: integer("roundNumber").notNull(),
  correctAnswer: text("correctAnswer"),
  complete: boolean("complete").notNull().default(false),
});

export const guesses = pgTable("guesses", {
  id: serial("id").primaryKey(),
  playerId: integer("playerId").notNull().references(() => players.id, { onDelete: 'cascade' }),
  gameId: text("gameId").notNull().references(() => games.id, { onDelete: 'cascade' }),
  round: integer("round").notNull(),
  guess: text("guess").notNull(),
  isCorrect: boolean("isCorrect").default(false),
});

// Define relations between tables for better query capabilities
export const gamesRelations = relations(games, ({ many }) => ({
  players: many(players),
  rounds: many(rounds),
  guesses: many(guesses),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  game: one(games, {
    fields: [players.gameId],
    references: [games.id],
  }),
  guesses: many(guesses),
}));

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  game: one(games, {
    fields: [rounds.gameId],
    references: [games.id],
  }),
}));

export const guessesRelations = relations(guesses, ({ one }) => ({
  player: one(players, {
    fields: [guesses.playerId],
    references: [players.id],
  }),
  game: one(games, {
    fields: [guesses.gameId],
    references: [games.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  name: true,
  photoUrl: true,
  gameId: true,
  secretWord: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  id: true,
  secretWord: true,
  adminSecretWord: true,
});

export const insertGuessSchema = createInsertSchema(guesses).pick({
  playerId: true,
  gameId: true,
  round: true,
  guess: true,
  isCorrect: true,
});

export const insertRoundSchema = createInsertSchema(rounds).pick({
  gameId: true,
  roundNumber: true,
});

// Join schemas and validations
export const gameJoinSchema = z.object({
  playerName: z.string().min(1, "Name is required"),
  gameId: z.string().min(1, "Game ID is required"),
  photoUrl: z.string().optional(),
});

export const adminLoginSchema = z.object({
  adminSecretWord: z.string().min(1, "Admin secret word is required"),
});

export const submitGuessSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.number().int(),
  round: z.number().int(),
  guess: z.string().min(1, "Guess is required"),
});

export const submitAnswerSchema = z.object({
  gameId: z.string().min(1),
  round: z.number().int(),
  correctAnswer: z.string().min(1, "Answer is required"),
});

export const adminOverrideSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.number().int(),
  round: z.number().int(),
  isCorrect: z.boolean(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export type InsertGuess = z.infer<typeof insertGuessSchema>;
export type Guess = typeof guesses.$inferSelect;

export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Round = typeof rounds.$inferSelect;

export type GameJoin = z.infer<typeof gameJoinSchema>;
export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type SubmitGuess = z.infer<typeof submitGuessSchema>;
export type SubmitAnswer = z.infer<typeof submitAnswerSchema>;
export type AdminOverride = z.infer<typeof adminOverrideSchema>;

// Player with guess information
export type PlayerWithGuess = Player & {
  currentGuess?: Guess;
  isPotus?: boolean;
  isVicePotus?: boolean;
};

// Game with players
export type GameWithPlayers = Game & {
  players: PlayerWithGuess[];
  currentRound?: Round | undefined;
};

// Winner types
export type Winner = {
  player: Player;
  isPotus: boolean;
  isVicePotus: boolean;
};
