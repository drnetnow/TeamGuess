import { useState, useEffect } from "react";
import { useGameState } from "@/lib/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRound, allPlayersSubmitted } from "@/lib/gameUtils";
import PlayerCard from "./PlayerCard";
import { Round } from "@shared/schema";

interface GameScreenProps {
  isAdmin?: boolean;
}

export default function GameScreen({ isAdmin = false }: GameScreenProps) {
  const { game, player } = useGameState();
  const [guess, setGuess] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
  const [roundComplete, setRoundComplete] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Update round information when game data changes
  useEffect(() => {
    if (game) {
      let newRoundNumber = 1; // Default to 1
      
      // Get current round number from the game object
      if (typeof game.currentRound === 'number') {
        // If it's directly a number, use it
        newRoundNumber = game.currentRound;
      } else if (game.currentRound && typeof game.currentRound === 'object') {
        // It's a Round object, get roundNumber from it
        const roundObj = game.currentRound as unknown as { roundNumber?: number };
        if (roundObj && typeof roundObj.roundNumber === 'number') {
          newRoundNumber = roundObj.roundNumber;
        }
      }
      
      // Set the round number
      setCurrentRoundNumber(newRoundNumber);
      
      // For the round object, we need to check if it exists and has the complete property
      const roundObject = typeof game.currentRound === 'object' ? game.currentRound as unknown as { complete?: boolean } : null;
      setRoundComplete(!!roundObject?.complete);
      
      console.log("Current round updated:", {
        gameCurrentRound: game.currentRound,
        newRoundNumber
      });
    }
  }, [game]);

  // Submit player's guess
  const submitGuessMutation = useMutation({
    mutationFn: async () => {
      if (!game || !player) return;
      
      await apiRequest("POST", `/api/games/${game.id}/guess`, {
        gameId: game.id,
        playerId: player.id,
        round: currentRoundNumber,
        guess: guess
      });
    },
    onSuccess: () => {
      toast({
        title: "Guess submitted",
        description: "Your guess has been submitted successfully",
      });
      setGuess("");
      queryClient.invalidateQueries({ queryKey: [`/api/games/${game?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit guess",
        variant: "destructive",
      });
    }
  });

  // Submit admin's correct answer
  const submitAnswerMutation = useMutation({
    mutationFn: async () => {
      if (!game) return;
      
      await apiRequest("POST", `/api/games/${game.id}/answer`, {
        gameId: game.id,
        round: currentRoundNumber,
        correctAnswer: correctAnswer
      });
    },
    onSuccess: () => {
      toast({
        title: "Answer submitted",
        description: "The correct answer has been submitted and guesses evaluated",
      });
      setCorrectAnswer("");
      queryClient.invalidateQueries({ queryKey: [`/api/games/${game?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit answer",
        variant: "destructive",
      });
    }
  });

  // Move to next round
  const nextRoundMutation = useMutation({
    mutationFn: async () => {
      if (!game) return;
      
      await apiRequest("POST", `/api/games/${game.id}/nextRound`, {});
    },
    onSuccess: () => {
      toast({
        title: "Next round",
        description: "Moved to the next round",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${game?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to advance to next round",
        variant: "destructive",
      });
    }
  });

  // Check if current player has submitted a guess
  const hasSubmittedGuess = () => {
    if (!game || !player) return false;
    
    return game.players.some(p => 
      p.id === player.id && 
      p.currentGuess && 
      p.currentGuess.round === currentRoundNumber
    );
  };

  // Check if all players have submitted their guesses
  const allSubmitted = game ? allPlayersSubmitted(game.players, currentRoundNumber) : false;

  if (!game) return null;

  // Find current player's guess if it exists
  const currentPlayerWithGuess = player 
    ? game.players.find(p => p.id === player.id)
    : undefined;
  const currentPlayerGuess = currentPlayerWithGuess?.currentGuess?.guess;
  
  // When component mounts or when we get a new player guess, update the guess input
  useEffect(() => {
    if (currentPlayerGuess && !roundComplete) {
      setGuess(currentPlayerGuess);
    }
  }, [currentPlayerGuess, roundComplete]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">Team Guessing Game</h1>
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-blue-500 text-white rounded-lg text-base font-bold shadow-md">
            Photo #{currentRoundNumber}
          </div>
          {isAdmin && (
            <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
              Admin Mode
            </div>
          )}
        </div>
      </div>

      <Card className="max-w-4xl mx-auto bg-white rounded-lg shadow-md mb-8">
        <CardContent className="p-6">
          {isAdmin ? (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold text-gray-800">Admin Controls</h2>
                  <div className="text-xl font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                    Current: Photo #{currentRoundNumber}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Show photo #{currentRoundNumber} to your team on Zoom, then enter the correct answer below.
                </p>
                
                {roundComplete ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
                    <p className="text-green-700 font-medium">Photo #{currentRoundNumber} is complete!</p>
                    <p className="text-green-600">Correct answer: <span className="font-bold">{game.currentRound?.correctAnswer}</span></p>
                  </div>
                ) : (
                  allSubmitted ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
                      <p className="text-blue-700 font-medium">All players have submitted their guesses for photo #{currentRoundNumber}.</p>
                      <p className="text-blue-600">You can now submit the correct answer below.</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-4">
                      <p className="text-amber-700 font-medium">Photo #{currentRoundNumber} in progress</p>
                      <p className="text-amber-600">
                        {game.players.filter(p => p.currentGuess && p.currentGuess.round === currentRoundNumber).length} 
                        /{game.players.length} players have submitted guesses.
                      </p>
                    </div>
                  )
                )}
              </div>
              
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label htmlFor="correctAnswer" className="block text-base font-medium text-gray-700">
                  Correct Answer for Photo #{currentRoundNumber}
                </label>
                <div className="flex space-x-2">
                  <Input
                    id="correctAnswer"
                    type="text"
                    placeholder="Enter the correct answer"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    disabled={roundComplete || submitAnswerMutation.isPending}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => submitAnswerMutation.mutate()}
                    disabled={submitAnswerMutation.isPending || !correctAnswer || roundComplete}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitAnswerMutation.isPending ? "Submitting..." : "Submit Answer"}
                  </Button>
                </div>
                
                {roundComplete && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 mt-4"
                    onClick={() => nextRoundMutation.mutate()}
                    disabled={nextRoundMutation.isPending}
                  >
                    Move to Photo #{currentRoundNumber + 1}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">What Are You Seeing?</h2>
                <div className="text-xl font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  Photo #{currentRoundNumber}
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">
                Look at photo #{currentRoundNumber} being shown on Zoom and enter your guess below.
              </p>
              
              {roundComplete ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
                  <p className="text-blue-700 font-medium">Photo #{currentRoundNumber} is complete!</p>
                  <p className="text-blue-600">
                    Correct answer: <span className="font-bold">{game.currentRound?.correctAnswer}</span>
                  </p>
                  <p className="text-blue-600">
                    Your guess: <span className="font-bold">{currentPlayerGuess}</span>
                  </p>
                </div>
              ) : hasSubmittedGuess() ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
                  <p className="text-green-700 font-medium">Your guess for photo #{currentRoundNumber} has been submitted!</p>
                  <p className="text-green-600">You guessed: <span className="font-bold">{currentPlayerGuess}</span></p>
                  <p className="text-green-600 mt-1">You can change your answer until the admin reveals the correct answer.</p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-4">
                  <p className="text-amber-700 font-medium">Please submit your guess for photo #{currentRoundNumber}</p>
                  <p className="text-amber-600">Look at what's being shown on Zoom and make your best guess below.</p>
                </div>
              )}

              <form 
                className="space-y-4 mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200" 
                onSubmit={(e) => {
                  e.preventDefault();
                  submitGuessMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <label htmlFor="guess" className="block text-base font-medium text-gray-700">
                    Your Guess for Photo #{currentRoundNumber}
                  </label>
                  <Input
                    id="guess"
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    className="w-full"
                    disabled={submitGuessMutation.isPending || roundComplete}
                    placeholder="Enter your guess here"
                  />
                </div>
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={submitGuessMutation.isPending || !guess || roundComplete}
                  >
                    {hasSubmittedGuess() 
                      ? "Update Guess" 
                      : submitGuessMutation.isPending 
                        ? "Submitting..." 
                        : "Submit Guess"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold text-gray-800 mb-4">Players</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {game.players.map(player => (
          <PlayerCard key={player.id} player={player} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}
