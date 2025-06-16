/**
 * Clears all game-related data from browser storage
 * This includes localStorage, sessionStorage, and cookies related to the game
 */
export function clearGameData() {
  // Clear localStorage items
  localStorage.removeItem('player');
  localStorage.removeItem('currentGame');
  localStorage.removeItem('isAdmin');
  
  // Clear any cookies related to the game
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    
    // Clear game-related cookies - we're using a pattern match to catch all game cookies
    if (name.includes('game') || name.includes('player') || name.includes('admin')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }
  
  // Clear session storage as well
  sessionStorage.clear();
}