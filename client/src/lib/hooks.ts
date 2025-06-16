import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect 
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Player, GameWithPlayers } from "@shared/schema";

// Game context type
interface GameContextType {
  game: GameWithPlayers | null;
  player: Player | null;
  isAdmin: boolean;
  updateGame: (game: GameWithPlayers) => void;
  updatePlayer: (player: Player) => void;
  setAdminMode: (isAdmin: boolean) => void;
}

// Create context with default values
const GameContext = createContext<GameContextType>({
  game: null,
  player: null,
  isAdmin: false,
  updateGame: () => {},
  updatePlayer: () => {},
  setAdminMode: () => {},
});

// Provider component
export function GameProvider(props: { children: React.ReactNode }) {
  const [game, setGame] = useState<GameWithPlayers | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize state from localStorage
  useEffect(() => {
    try {
      const storedGame = localStorage.getItem("currentGame");
      const storedPlayer = localStorage.getItem("player");
      const storedIsAdmin = localStorage.getItem("isAdmin");

      if (storedGame) {
        setGame(JSON.parse(storedGame));
      }

      if (storedPlayer) {
        setPlayer(JSON.parse(storedPlayer));
      }

      if (storedIsAdmin === "true") {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  // Setup data polling when game ID changes
  useEffect(() => {
    if (!game) return;
    
    // Add any game state initialization if needed
    console.log(`Game loaded: ${game.id}, Round: ${game.currentRound}, Players: ${game.players.length}`);
    
  }, [game?.id]);

  // Update game state and store in localStorage
  const updateGame = (newGame: GameWithPlayers) => {
    setGame(newGame);
    localStorage.setItem("currentGame", JSON.stringify(newGame));
  };

  // Update player state and store in localStorage
  const updatePlayer = (newPlayer: Player) => {
    setPlayer(newPlayer);
    localStorage.setItem("player", JSON.stringify(newPlayer));
  };
  
  // Update admin state and store in localStorage
  const setAdminMode = (adminState: boolean) => {
    setIsAdmin(adminState);
    localStorage.setItem("isAdmin", adminState ? "true" : "false");
  };

  const contextValue: GameContextType = {
    game,
    player, 
    isAdmin, 
    updateGame, 
    updatePlayer,
    setAdminMode
  };

  return React.createElement(
    GameContext.Provider,
    { value: contextValue },
    props.children
  );
}

// Hook to access game state
export function useGameState() {
  return useContext(GameContext);
}

// Hook to fetch and sync game data
export function useGameData(gameId: string) {
  const { game, updateGame, isAdmin } = useGameState();
  
  const { data, isLoading, error } = useQuery<GameWithPlayers>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
    refetchInterval: 3000, // Poll every 3 seconds to keep game state updated
    retry: 1, // Only retry once to avoid too many API calls for 404s
    retryDelay: 2000, // Wait 2 seconds before retry
  });
  
  // Update context if we get new data from the query
  useEffect(() => {
    if (data && (!game || JSON.stringify(data) !== JSON.stringify(game))) {
      console.log(`Game updated via polling: ${gameId}`);
      updateGame(data);
    }
  }, [data, game, gameId, updateGame]);
  
  return {
    game: data || game, // Return data from query first, fallback to context
    isLoading,
    error
  };
}

// Hook to fetch winners
export function useGameWinners(gameId: string | undefined, enabled: boolean = false) {
  return useQuery({
    queryKey: [`/api/games/${gameId}/winners`],
    enabled: !!gameId && enabled,
    staleTime: Infinity, // Once winners are determined, they don't change
  });
}
