// Test script for database functionality
import { storage } from './server/storage.ts';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Create a new game
    const newGame = await storage.createGame({
      secretWord: 'freedom',
      adminSecretWord: 'democracy'
    });
    
    console.log('New game created:', newGame);
    
    // Retrieve the game
    const game = await storage.getGame(newGame.id);
    console.log('Retrieved game:', game);
    
    // Create a player
    const player = await storage.createPlayer({
      name: 'Test Player',
      photoUrl: 'https://example.com/photo.jpg',
      gameId: newGame.id
    });
    
    console.log('New player created:', player);
    
    // Get players by game
    const players = await storage.getPlayersByGame(newGame.id);
    console.log('Players:', players);
    
    // Get game with players
    const gameWithPlayers = await storage.getGameWithPlayers(newGame.id);
    console.log('Game with players:', gameWithPlayers);
    
    console.log('Database test completed successfully!');
  } catch (error) {
    console.error('Error testing database:', error);
  }
}

testDatabase();