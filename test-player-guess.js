// Test script to verify player guess association is working correctly
import fetch from 'node-fetch';

// Add this for ES Modules
export {};

async function main() {
  try {
    // Create a test game
    console.log('Creating test game...');
    const gameResponse = await fetch('http://localhost:5000/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Game',
        maxRounds: 3
      })
    });
    
    if (!gameResponse.ok) {
      throw new Error(`Failed to create game: ${gameResponse.statusText}`);
    }
    
    const game = await gameResponse.json();
    console.log(`Created game with ID: ${game.id} and secret: ${game.secretWord}`);
    
    // Create test players
    console.log('Creating test players...');
    const player1Response = await fetch('http://localhost:5000/api/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Player 1',
        gameId: game.id,
        photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg'
      })
    });
    
    const player2Response = await fetch('http://localhost:5000/api/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Player 2',
        gameId: game.id,
        photoUrl: 'https://randomuser.me/api/portraits/women/1.jpg'
      })
    });
    
    const player1 = await player1Response.json();
    const player2 = await player2Response.json();
    
    console.log(`Created players: ${player1.name} (ID: ${player1.id}) and ${player2.name} (ID: ${player2.id})`);
    
    // Start round 1
    console.log('Starting round 1...');
    const startRoundResponse = await fetch(`http://localhost:5000/api/games/${game.id}/rounds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameId: game.id,
        roundNumber: 1
      })
    });
    
    if (!startRoundResponse.ok) {
      throw new Error(`Failed to start round: ${startRoundResponse.statusText}`);
    }
    
    const round = await startRoundResponse.json();
    console.log(`Started round ${round.roundNumber}`);
    
    // Submit guesses from both players
    console.log('Submitting guesses...');
    const guess1Response = await fetch(`http://localhost:5000/api/games/${game.id}/guess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameId: game.id,
        playerId: player1.id,
        round: 1,
        guess: 'Apple'
      })
    });
    
    const guess2Response = await fetch(`http://localhost:5000/api/games/${game.id}/guess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameId: game.id,
        playerId: player2.id,
        round: 1,
        guess: 'Banana'
      })
    });
    
    if (!guess1Response.ok || !guess2Response.ok) {
      throw new Error('Failed to submit guesses');
    }
    
    console.log('Guesses submitted successfully');
    
    // Admin submits the answer
    console.log('Admin submitting answer...');
    const answerResponse = await fetch(`http://localhost:5000/api/games/${game.id}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameId: game.id,
        roundNumber: 1,
        correctAnswer: 'Apple'
      })
    });
    
    if (!answerResponse.ok) {
      throw new Error(`Failed to submit answer: ${answerResponse.statusText}`);
    }
    
    console.log('Answer submitted successfully');
    
    // Check game state to ensure guesses are correctly associated
    console.log('Checking game state...');
    const gameStateResponse = await fetch(`http://localhost:5000/api/games/${game.id}`);
    const gameState = await gameStateResponse.json();
    
    console.log('Game state:');
    console.log(JSON.stringify(gameState, null, 2));
    
    // Verify player guesses are correctly associated
    const player1WithGuess = gameState.players.find(p => p.id === player1.id);
    const player2WithGuess = gameState.players.find(p => p.id === player2.id);
    
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
    console.error('Error:', error.message);
  }
}

main();