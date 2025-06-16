import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGameState, useGameData, useGameWinners } from "@/lib/hooks";
import GameScreen from "@/components/GameScreen";
import WinnerScreen from "@/components/WinnerScreen";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@shared/schema";

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const { player, isAdmin } = useGameState();
  const { game, isLoading, error } = useGameData(gameId);
  const [showWinners, setShowWinners] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch winners when game is complete
  const { data: winnersData } = useGameWinners(gameId, game?.isComplete || showWinners);

  useEffect(() => {
    // Check if there's a game ID in the URL for direct access
    const params = new URLSearchParams(window.location.search);
    
    if (gameId && !player && !isAdmin) {
      // Clean up URL by removing query params
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Redirect to login page with the gameId pre-filled
      window.location.href = `/?gameId=${gameId}`;
      return;
    }
    
    // Check if game ID is invalid or game not found
    if (error && !isLoading) {
      // Clear local storage if the game isn't found
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('404') || errMsg.includes('not found')) {
        // Game data is stale, clear it
        localStorage.removeItem('currentGame');
        localStorage.removeItem('player');
        localStorage.removeItem('isAdmin');
        
        toast({
          title: "Game not found",
          description: "The game may have expired. Please create a new game or join an existing one.",
          variant: "destructive"
        });
        
        // Redirect to login after a short delay
        setTimeout(() => navigate('/'), 1500);
      }
    }

    // Redirect to login if no player is set
    if (!player && !isAdmin && !isLoading && !error) {
      toast({
        title: "Not logged in",
        description: "You need to join the game first",
      });
      navigate("/");
      return;
    }

    // Check if game is complete
    if (game?.isComplete) {
      setShowWinners(true);
    }
  }, [player, isAdmin, game, isLoading, error, navigate, toast]);

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-red-600">Error Loading Game</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-2">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
            <p className="text-sm text-gray-500">
              The game may have expired or been deleted. In-memory games are not preserved between server restarts.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => navigate("/")}
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show winners screen if game is complete
  if (showWinners && winnersData) {
    const winners = winnersData as { potus: Player | null, vicePotuses: Player[] };
    return (
      <WinnerScreen 
        potus={winners.potus} 
        vicePotuses={winners.vicePotuses} 
        onPlayAgain={() => navigate("/")}
      />
    );
  }

  // Show game screen (either admin or player view)
  return <GameScreen isAdmin={isAdmin} />;
}
