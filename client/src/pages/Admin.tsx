import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGameState, useGameData, useGameWinners } from "@/lib/hooks";
import GameSetupScreen from "@/components/GameSetupScreen";
import GameScreen from "@/components/GameScreen";
import WinnerScreen from "@/components/WinnerScreen";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Player } from "@shared/schema";

export default function Admin() {
  const { gameId } = useParams<{ gameId: string }>();
  const { isAdmin } = useGameState();
  const { game, isLoading, error } = useGameData(gameId);
  const [setupComplete, setSetupComplete] = useState(false);
  const [showWinners, setShowWinners] = useState(false);
  const [showPlayerSetup, setShowPlayerSetup] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch winners when game is complete
  const { data: winnersData } = useGameWinners(gameId, game?.isComplete || showWinners);
  const winners = winnersData as { potus: Player | null, vicePotuses: Player[] } | undefined;

  useEffect(() => {
    // Redirect if not an admin
    if (!isAdmin && !isLoading) {
      toast({
        title: "Not authorized",
        description: "You need admin access to view this page",
      });
      navigate("/");
      return;
    }

    // Check if game is complete
    if (game?.isComplete) {
      setShowWinners(true);
    }

    // Set setup complete if players exist
    if (game?.players && game.players.length > 0) {
      console.log("Admin screen detected players:", game.players.length);
      setSetupComplete(true);
    }
  }, [isAdmin, game, isLoading, navigate, toast]);

  const endGameAndShowWinners = async () => {
    try {
      await apiRequest("GET", `/api/games/${gameId}/winners`, undefined);
      setShowWinners(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end game",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center my-12">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Game</h2>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
          onClick={() => navigate("/")}
        >
          Back to Login
        </button>
      </div>
    );
  }

  // Show winners screen if game is complete
  if (showWinners && winners) {
    return (
      <WinnerScreen 
        potus={winners.potus} 
        vicePotuses={winners.vicePotuses} 
        onPlayAgain={() => navigate("/")}
      />
    );
  }

  // Debug game state
  console.log("Admin component state:", {
    gameId,
    gameLoaded: !!game,
    setupComplete,
    playerCount: game?.players?.length || 0,
    showWinners
  });

  return (
    <div>
      {showPlayerSetup && setupComplete ? (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-blue-600">
              Player Setup: {game?.id}
            </h2>
            <Button 
              variant="secondary" 
              onClick={() => setShowPlayerSetup(false)}
            >
              Back to Game
            </Button>
          </div>
          <GameSetupScreen gameIdProp={gameId} existingGame={game || undefined} readOnly={true} />
        </>
      ) : setupComplete ? (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-blue-600">
              Game Admin: {game?.id}
            </h2>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPlayerSetup(true)}
              >
                View Player Setup
              </Button>
              <Button 
                variant="destructive" 
                onClick={endGameAndShowWinners}
              >
                End Game & Show Winners
              </Button>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-md mb-4">
            <p className="text-sm">
              Player URL: <span className="font-mono bg-white px-2 py-1 rounded">{window.location.origin}/game/{gameId}</span>
              <Button
                size="sm"
                variant="outline"
                className="ml-2"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/game/${gameId}`);
                  toast({ title: "URL copied", description: "Player game URL copied to clipboard" });
                }}
              >
                Copy
              </Button>
            </p>
            <p className="text-xs text-gray-500 mt-1">Share this link with players. They will need their secret words to login.</p>
          </div>
          <GameScreen isAdmin={true} />
        </>
      ) : (
        <GameSetupScreen />
      )}
    </div>
  );
}
