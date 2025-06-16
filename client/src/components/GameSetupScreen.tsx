import { useState } from "react";
import { useGameState } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GameWithPlayers } from "@shared/schema";

interface GameSetupScreenProps {
  gameIdProp?: string;
  existingGame?: GameWithPlayers;
  readOnly?: boolean;
}

export default function GameSetupScreen({ 
  gameIdProp, 
  existingGame,
  readOnly = false 
}: GameSetupScreenProps) {
  const { game: contextGame } = useGameState();
  const { toast } = useToast();
  
  // Use either the existing game passed as prop or from context
  const game = existingGame || contextGame;
  
  if (!game) {
    return <div>Loading game...</div>;
  }
  
  const copyGameId = () => {
    navigator.clipboard.writeText(game.id)
      .then(() => {
        toast({
          title: "Game ID copied",
          description: "Share this ID with players to join",
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Could not copy Game ID to clipboard",
          variant: "destructive",
        });
      });
  };

  const copyAdminWord = () => {
    navigator.clipboard.writeText(game.adminSecretWord)
      .then(() => {
        toast({
          title: "Admin secret copied",
          description: "Admin secret word has been copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Could not copy admin secret to clipboard",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Game Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="font-medium">Game ID</div>
                <div className="flex items-center space-x-2">
                  <div 
                    className="text-lg font-medium bg-blue-50 p-3 rounded flex-1 cursor-pointer"
                    onClick={copyGameId}
                    title="Click to copy"
                  >
                    {game.id}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyGameId}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share this ID with players so they can join the game
                </p>
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="font-medium text-green-700 mb-1">Player Join Link:</p>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="text-sm font-mono bg-white p-2 rounded flex-1 truncate cursor-pointer"
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/`)}
                      title="Click to copy"
                    >
                      {window.location.origin}/
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/`);
                        toast({
                          title: "Join link copied",
                          description: "Link has been copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Players can visit this URL and enter the Game ID: <span className="font-bold">{game.id}</span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="font-medium">Admin Secret Word</div>
                <div className="flex items-center space-x-2">
                  <div 
                    className="text-lg font-medium bg-amber-50 p-3 rounded flex-1 cursor-pointer"
                    onClick={copyAdminWord}
                    title="Click to copy"
                  >
                    {game.adminSecretWord}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyAdminWord}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep this secure. Use it to login as the admin.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>How to Play</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">For Admin:</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Share the Game ID with players</li>
                <li>Players will join automatically using the Game ID and their name</li>
                <li>Present images to your players via screen share</li>
                <li>Submit the correct answer after each round</li>
                <li>The system will evaluate players' guesses</li>
                <li>The highest scorer becomes the POTUS!</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">For Players:</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Join using the Game ID and your name</li>
                <li>Look for images shared by the admin</li>
                <li>Submit your guesses for each round</li>
                <li>Earn points for correct answers</li>
                <li>The player with the most points becomes President!</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
