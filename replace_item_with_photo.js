const fs = require('fs');
const path = 'client/src/components/GameScreen.tsx';

// Read the file
let content = fs.readFileSync(path, 'utf8');

// Replace all occurrences of "Item #" with "Photo #"
content = content.replace(/Item #/g, 'Photo #');

// Replace all occurrences of "item #" with "photo #"
content = content.replace(/item #/g, 'photo #');

// Replace "Correct Answer for Item" with "Correct Answer for Photo"
content = content.replace(/Correct Answer for Item/g, 'Correct Answer for Photo');

// Replace "Your Guess for Item" with "Your Guess for Photo"
content = content.replace(/Your Guess for Item/g, 'Your Guess for Photo');

// Replace "Move to Item" with "Move to Photo"
content = content.replace(/Move to Item/g, 'Move to Photo');

// Write the file
fs.writeFileSync(path, content);
console.log('Successfully replaced "Item" with "Photo" in GameScreen.tsx');
