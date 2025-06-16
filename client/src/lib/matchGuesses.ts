import { stringSimilarity } from 'string-similarity-js';

/**
 * This function uses string similarity algorithms to determine if a player's guess
 * is sufficiently close to the correct answer to be considered correct
 * 
 * @param correctAnswer - The answer provided by the admin
 * @param playerGuess - The guess provided by the player
 * @returns boolean indicating if the answer is a match
 */
export function isCloseEnoughMatch(correctAnswer: string, playerGuess: string): boolean {
  if (!correctAnswer || !playerGuess) return false;
  
  // Convert both strings to lowercase for case-insensitive comparison
  const normalizedAnswer = correctAnswer.toLowerCase().trim();
  const normalizedGuess = playerGuess.toLowerCase().trim();
  
  // Exact match
  if (normalizedGuess === normalizedAnswer) return true;
  
  // Check if the answer is contained within the guess or vice versa
  // This handles cases like "birthday cake" matching "cake"
  if (normalizedGuess.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedGuess)) {
    return true;
  }
  
  // Calculate similarity score - values close to 1 indicate high similarity
  const similarityScore = stringSimilarity(normalizedAnswer, normalizedGuess);
  
  // Threshold for accepting a match - can be adjusted
  const SIMILARITY_THRESHOLD = 0.75;
  
  // Check if words are a close match
  if (similarityScore >= SIMILARITY_THRESHOLD) {
    return true;
  }
  
  // Check for plural forms
  if (normalizedAnswer + 's' === normalizedGuess || normalizedGuess + 's' === normalizedAnswer) {
    return true;
  }
  
  // If normalized answer has multiple words, check if any key word matches
  const answerWords = normalizedAnswer.split(/\s+/);
  const guessWords = normalizedGuess.split(/\s+/);
  
  // If answer is multi-word, check if a primary word matches
  if (answerWords.length > 1) {
    // Consider matches of important words (usually nouns that are longer)
    const importantAnswerWords = answerWords.filter(word => word.length > 3);
    
    for (const word of importantAnswerWords) {
      if (guessWords.some(guessWord => {
        const wordSimilarity = stringSimilarity(word, guessWord);
        return wordSimilarity > 0.8;
      })) {
        return true;
      }
    }
  }
  
  // Default to no match
  return false;
}