import { Game, Player, PlayerWithGuess, Round } from "@shared/schema";

// Generate a unique player color based on player name
export function getPlayerColor(playerName: string): string {
  // Simple hash function to get a consistent color
  const hash = playerName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Convert to HSL (hue between 0-360, saturation and lightness fixed)
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 60%)`;
}

// Format a round number with proper suffix
export function formatRound(round: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const mod100 = round % 100;
  const suffix = (mod100 >= 11 && mod100 <= 13) ? 'th' : suffixes[round % 10] || 'th';
  return `${round}${suffix}`;
}

// Check if a player has submitted a guess for the current round
export function hasSubmittedGuess(
  player: PlayerWithGuess | undefined, 
  game: Game | undefined
): boolean {
  if (!player || !game) return false;
  
  return Boolean(
    player.currentGuess && 
    player.currentGuess.round === game.currentRound
  );
}

// Sort players by score (highest first)
export function sortPlayersByScore(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.score - a.score);
}

// Check if all players have submitted guesses for the current round
export function allPlayersSubmitted(players: PlayerWithGuess[], currentRound: number): boolean {
  return players.every(player => 
    player.currentGuess && player.currentGuess.round === currentRound
  );
}

// Calculate accuracy statistics for a round
export function calculateRoundStats(players: PlayerWithGuess[], currentRound: number) {
  const guessesSubmitted = players.filter(
    p => p.currentGuess && p.currentGuess.round === currentRound
  ).length;
  
  const correctGuesses = players.filter(
    p => p.currentGuess && 
    p.currentGuess.round === currentRound && 
    p.currentGuess.isCorrect
  ).length;
  
  const accuracy = guessesSubmitted > 0 
    ? Math.round((correctGuesses / guessesSubmitted) * 100) 
    : 0;
  
  return {
    total: players.length,
    submitted: guessesSubmitted,
    correct: correctGuesses,
    accuracy
  };
}
