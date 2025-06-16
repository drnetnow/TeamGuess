import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerWithGuess } from "@shared/schema";
import { useGameState } from "@/lib/hooks";
import { getPlayerColor } from "@/lib/gameUtils";
import AmericanFlag from "./AmericanFlag";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";

interface PlayerCardProps {
  player: PlayerWithGuess;
  isAdmin?: boolean;
}

export default function PlayerCard({ player, isAdmin = false }: PlayerCardProps) {
  const { game } = useGameState();
  const { toast } = useToast();
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [showFlag, setShowFlag] = useState(false);
  
  // Get player-specific background color
  const bgColor = getPlayerColor(player.name);
  
  useEffect(() => {
    if (game) {
      // Extract current round number
      const roundNum = typeof game.currentRound === 'object'
        ? (game.currentRound as any)?.roundNumber || 1
        : (typeof game.currentRound === 'number' ? game.currentRound : 1);
      
      setCurrentRoundNumber(roundNum);
      
      // Check if round is complete
      const complete = typeof game.currentRound === 'object' 
        ? (game.currentRound as any)?.complete === true
        : false;
      setIsRoundComplete(complete);
      
      // Show flag for POTUS or Vice POTUS winners when game is complete
      const isPotus = Boolean(player.isPotus);
      const isVicePotus = Boolean(player.isVicePotus);
      setShowFlag(game.isComplete && (isPotus || isVicePotus));
    }
  }, [game, player]);
  
  // Determine if the guess is correct for the current round
  const isCorrect = player.currentGuess?.isCorrect;
  
  // Determine if there is a guess for the current round
  const hasGuessedThisRound = player.currentGuess && 
    player.currentGuess.round === currentRoundNumber;
  
  // Get the guess text if available
  const guessText = hasGuessedThisRound ? player.currentGuess?.guess : null;
  
  // Admin override mutation - mark as correct
  const markCorrectMutation = useMutation({
    mutationFn: async () => {
      if (!game) return;
      
      return await apiRequest("POST", `/api/games/${game.id}/override`, {
        gameId: game.id,
        playerId: player.id,
        round: currentRoundNumber,
        isCorrect: true
      });
    },
    onSuccess: () => {
      toast({
        title: "Override successful",
        description: `${player.name}'s answer has been marked as correct`,
        variant: "default",
      });
      if (game) {
        queryClient.invalidateQueries({ queryKey: [`/api/games/${game.id}`] });
      }
    },
    onError: (error) => {
      toast({
        title: "Override failed",
        description: error instanceof Error ? error.message : "Failed to mark as correct",
        variant: "destructive",
      });
    }
  });
  
  // Admin override mutation - mark as incorrect
  const markIncorrectMutation = useMutation({
    mutationFn: async () => {
      if (!game) return;
      
      return await apiRequest("POST", `/api/games/${game.id}/override`, {
        gameId: game.id,
        playerId: player.id,
        round: currentRoundNumber,
        isCorrect: false
      });
    },
    onSuccess: () => {
      toast({
        title: "Override successful",
        description: `${player.name}'s answer has been marked as incorrect`,
        variant: "default",
      });
      if (game) {
        queryClient.invalidateQueries({ queryKey: [`/api/games/${game.id}`] });
      }
    },
    onError: (error) => {
      toast({
        title: "Override failed",
        description: error instanceof Error ? error.message : "Failed to mark as incorrect",
        variant: "destructive",
      });
    }
  });

  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden relative">
      {/* Flag overlay for winners */}
      {showFlag && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-20">
          <div className="relative">
            <AmericanFlag size={Boolean(player.isPotus) ? 'large' : 'small'} />
          </div>
        </div>
      )}
      
      {/* Player image with score badge */}
      <div className="relative">
        <img 
          src={player.photoUrl} 
          alt={player.name} 
          className="w-full h-48 object-cover"
        />
        
        {/* Score badge */}
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center">
          {player.score}
        </div>
        
        {/* "Correct!!" banner when player gets the right answer */}
        {isRoundComplete && isCorrect && (
          <div className="absolute inset-x-0 top-20 flex justify-center">
            <div className="bg-green-600 text-white text-xl font-bold px-4 py-2 rounded-md shadow-lg animate-bounce">
              Correct!!
            </div>
          </div>
        )}
        
        {Boolean(player.isPotus) && (
          <div className="absolute bottom-2 left-2 bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            POTUS
          </div>
        )}
        
        {Boolean(player.isVicePotus) && (
          <div className="absolute bottom-2 left-2 bg-blue-800 text-white text-xs font-bold px-2 py-1 rounded-full">
            Vice President
          </div>
        )}
      </div>
      
      {/* Player info */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg text-gray-800">{player.name}</h3>
          {hasGuessedThisRound && isRoundComplete && (
            isCorrect ? (
              <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                +1
              </span>
            ) : null
          )}
        </div>
        
        {/* Guess info */}
        {guessText ? (
          <div className="mt-2 space-y-1">
            <div className="text-sm flex justify-between">
              <span className="text-gray-500">Guess:</span>
              <span className="font-medium">{guessText}</span>
            </div>
            
            {isRoundComplete && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Result:</span>
                {isCorrect ? (
                  <span className="text-sm text-green-600 font-medium flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                    Correct
                  </span>
                ) : (
                  <span className="text-sm text-red-600 font-medium flex items-center">
                    <div className="h-2 w-2 bg-red-500 rounded-full mr-1"></div>
                    Incorrect
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-6 flex items-center">
            <span className="text-sm text-gray-500 italic">
              {isRoundComplete ? "No guess submitted" : "Waiting for guess..."}
            </span>
          </div>
        )}
        
        {/* Status indicator */}
        <div className="mt-3 w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#e5e7eb' }}>
          {hasGuessedThisRound ? (
            <div 
              className="h-full rounded-full" 
              style={{ 
                width: '100%', 
                backgroundColor: isRoundComplete 
                  ? (isCorrect ? '#10b981' : '#ef4444') 
                  : bgColor
              }}
            ></div>
          ) : (
            <div 
              className="h-full rounded-full" 
              style={{ width: '0%' }}
            ></div>
          )}
        </div>
        
        {/* Admin override buttons */}
        {isAdmin && isRoundComplete && (
          <div className="mt-4 border-t pt-3 border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">Admin Override:</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isCorrect ? "default" : "outline"}
                className={isCorrect ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => markCorrectMutation.mutate()}
                disabled={markCorrectMutation.isPending || (isCorrect === true)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Correct
              </Button>
              <Button
                size="sm"
                variant={isCorrect === false ? "default" : "outline"}
                className={isCorrect === false ? "bg-red-600 hover:bg-red-700" : ""}
                onClick={() => markIncorrectMutation.mutate()}
                disabled={markIncorrectMutation.isPending || (isCorrect === false)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Mark Incorrect
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
