/**
 * This function verifies that player guesses are correctly being associated 
 * with players in the getGameWithPlayers method of the MemStorage class.
 */
import { storage } from './server/storage.js';

async function main() {
  try {
    // Create a test game
    console.log('Creating test game...');
    const game = await storage.createGame({
      name: 'Test Game',
      maxRounds: 3
    });
    console.log(`Created game with ID: ${game.id}`);
    
    // Create test players
    console.log('Creating test players...');
    const player1 = await storage.createPlayer({
      name: 'Player 1',
      gameId: game.id,
      photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg'
    });
    
    const player2 = await storage.createPlayer({
      name: 'Player 2',
      gameId: game.id,
      photoUrl: 'https://randomuser.me/api/portraits/women/1.jpg'
    });
    
    console.log(`Created players: ${player1.name} (ID: ${player1.id}) and ${player2.name} (ID: ${player2.id})`);
    
    // Start round 1
    console.log('Starting round 1...');
    const round = await storage.createRound({
      gameId: game.id,
      roundNumber: 1
    });
    console.log(`Started round ${round.roundNumber}`);
    
    // Submit guesses from both players
    console.log('Submitting guesses...');
    await storage.createGuess({
      gameId: game.id,
      playerId: player1.id,
      round: 1,
      guess: 'Apple',
      isCorrect: null
    });
    
    await storage.createGuess({
      gameId: game.id,
      playerId: player2.id,
      round: 1,
      guess: 'Banana',
      isCorrect: null
    });
    
    console.log('Guesses submitted successfully');
    
    // Admin submits the answer
    console.log('Admin submitting answer...');
    await storage.submitAnswer(game.id, 1, 'Apple');
    console.log('Answer submitted and guesses evaluated');
    
    // Check game state to ensure guesses are correctly associated
    console.log('Checking game state...');
    const gameState = await storage.getGameWithPlayers(game.id);
    
    // Verify player guesses are correctly associated
    const player1WithGuess = gameState.players.find(p => p.id === player1.id);
    const player2WithGuess = gameState.players.find(p => p.id === player2.id);
    
    if (!player1WithGuess || !player2WithGuess) {
      console.error('Error: Player not found in game state');
      return;
    }
    
    console.log(`Player 1 guess: ${player1WithGuess.currentGuess?.guess}`);
    console.log(`Player 1 correct: ${player1WithGuess.currentGuess?.isCorrect}`);
    console.log(`Player 2 guess: ${player2WithGuess.currentGuess?.guess}`);
    console.log(`Player 2 correct: ${player2WithGuess.currentGuess?.isCorrect}`);
    
    if (player1WithGuess.currentGuess?.guess === 'Apple' && player2WithGuess.currentGuess?.guess === 'Banana') {
      console.log('✅ SUCCESS: Player guesses are correctly associated');
    } else {
      console.error('❌ ERROR: Player guesses are incorrectly associated');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();