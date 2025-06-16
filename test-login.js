import fetch from 'node-fetch';

// This script tests the player login functionality by:
// 1. Creating a new game
// 2. Creating a player with a specific secret word
// 3. Testing login using that secret word

async function main() {
  try {
    console.log('Creating a test game...');
    
    // 1. Create a new game
    const gameResponse = await fetch('http://localhost:5000/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secretWord: 'testgamesecret',
        adminSecretWord: 'testadminsecret'
      })
    });
    
    if (!gameResponse.ok) {
      throw new Error(`Failed to create game: ${gameResponse.statusText}`);
    }
    
    const gameData = await gameResponse.json();
    console.log('Game created with ID:', gameData.id);
    console.log('Game secret word:', gameData.secretWord);
    console.log('Admin secret word:', gameData.adminSecretWord);
    
    // 2. Create a test player
    const playerResponse = await fetch('http://localhost:5000/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: gameData.id,
        name: 'Test Player',
        secretWord: 'testplayersecret'
      })
    });
    
    if (!playerResponse.ok) {
      throw new Error(`Failed to create player: ${playerResponse.statusText}`);
    }
    
    const playerData = await playerResponse.json();
    console.log('Player created:');
    console.log('  ID:', playerData.id);
    console.log('  Name:', playerData.name);
    console.log('  Secret word:', playerData.secretWord);
    
    // 3. Try to log in with the player's secret word
    console.log('\nTesting login with player secret word...');
    const loginResponse = await fetch('http://localhost:5000/api/games/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: 'Test Player',
        secretWord: 'testplayersecret'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login test failed: ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful!');
    console.log('Player ID:', loginData.player.id);
    console.log('Player name:', loginData.player.name);
    console.log('Game ID:', loginData.game.id);
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();