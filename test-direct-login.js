import fetch from 'node-fetch';

// This script tests logging in directly with a player's secret word
// using the player that was created in test-login.js

async function main() {
  try {
    console.log('Testing direct login with player secret word...');
    
    // Try to log in with the player's secret word
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
    
    console.log('\nDirect login test passed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();