import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Player } from "@shared/schema";
import AmericanFlag from "./AmericanFlag";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { clearGameData } from "@/lib/clearGameData";
import { HomeIcon } from "lucide-react";

interface WinnerScreenProps {
  potus: Player | null;
  vicePotuses: Player[];
  onPlayAgain?: () => void;
}

export default function WinnerScreen({ potus, vicePotuses, onPlayAgain }: WinnerScreenProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [newGameInfo, setNewGameInfo] = useState<{ secretWord: string; adminSecretWord: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Check if user is admin when component mounts
  useEffect(() => {
    const adminValue = localStorage.getItem("isAdmin");
    setIsAdmin(adminValue === "true");
  }, []);

  const createNewGame = async () => {
    setIsCreatingGame(true);
    try {
      // Clear all previous game data first
      clearGameData();
      
      const response = await apiRequest("POST", "/api/games", {});
      const game = await response.json();
      
      if (game) {
        setNewGameInfo({
          secretWord: game.secretWord,
          adminSecretWord: game.adminSecretWord
        });
      }
    } catch (error) {
      let message = "Failed to create new game";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      // Redirect to home
      navigate("/");
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handlePlayAgain = () => {
    if (onPlayAgain) {
      onPlayAgain();
    } else {
      // Create a new game instead of just redirecting
      createNewGame();
    }
  };
  
  // Admin-specific function to redirect to admin page to continue setting up the same game
  const continueAsAdmin = () => {
    // Get current game data from local storage
    const gameData = localStorage.getItem("currentGame");
    if (gameData) {
      const game = JSON.parse(gameData);
      if (game && game.adminSecretWord) {
        // Keep the admin flag but remove player info
        localStorage.removeItem("player");
        
        // Redirect to admin page with admin secret
        window.location.href = `/admin?adminSecret=${encodeURIComponent(game.adminSecretWord)}`;
      }
    }
  };
  
  const closeNewGameDialog = () => {
    setNewGameInfo(null);
    
    // If admin was playing, send them to the admin page
    if (isAdmin) {
      loginAsAdmin();
    } else {
      navigate("/");
    }
  };
  
  const loginAsAdmin = () => {
    if (newGameInfo?.adminSecretWord) {
      localStorage.setItem("isAdmin", "true");
      localStorage.removeItem("player");
      
      // Redirect to admin login with admin secret word
      window.location.href = `/admin?adminSecret=${encodeURIComponent(newGameInfo.adminSecretWord)}`;
    }
  };

  return (
    <>
      <div className="bg-blue-50 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Game Complete!</h1>
          <p className="text-lg text-gray-700">The results are in...</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* POTUS Winner */}
          {potus && (
            <div className="col-span-1 md:col-span-3 mx-auto relative">
              <div className="text-center mb-4">
                <span className="bg-blue-600 text-white font-bold py-1 px-6 rounded-full text-lg">
                  PRESIDENT OF THE UNITED STATES
                </span>
              </div>
              <div className="flex items-start mx-auto justify-center">
                <div className="flag-container mr-4 mt-8">
                  <AmericanFlag size="extra-large" />
                </div>
                <div className="relative bg-white rounded-lg shadow-lg p-4 w-64">
                  <img 
                    src={potus.photoUrl} 
                    alt={potus.name} 
                    className="w-full h-56 object-cover rounded-lg mb-4"
                  />
                  <h3 className="font-bold text-xl text-gray-800 mb-1">
                    {potus.name}
                  </h3>
                  <div className="flex items-center justify-center">
                    <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold text-lg">
                      Score: {potus.score}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Vice POTUS Winners */}
          {vicePotuses.length > 0 && (
            <div className="col-span-1 md:col-span-3">
              <div className="text-center mb-4">
                <span className="bg-blue-500 text-white font-bold py-1 px-4 rounded-full">
                  VICE PRESIDENT
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-8">
                {vicePotuses.map(vp => (
                  <div key={vp.id} className="flex items-start">
                    <div className="flag-container mr-2 mt-4">
                      <AmericanFlag size="large" />
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-3 w-48">
                      <img 
                        src={vp.photoUrl} 
                        alt={vp.name} 
                        className="w-full h-40 object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-bold text-lg text-gray-800 mb-1">
                        {vp.name}
                      </h3>
                      <div className="flex justify-center">
                        <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold">
                          Score: {vp.score}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Add a home button to clear data and redirect */}
        <div className="flex flex-col items-center mt-10">
          <Button
            onClick={() => {
              clearGameData();
              window.location.href = '/';
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold shadow-md flex items-center space-x-2"
          >
            <HomeIcon className="w-5 h-5" />
            <span>Return to Home</span>
          </Button>
        </div>
      </div>
      
      {/* New Game Dialog */}
      <Dialog open={newGameInfo !== null} onOpenChange={closeNewGameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Game Created!</DialogTitle>
            <DialogDescription>
              Share the secret word with players to join this game.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Player Secret Word:</h3>
              <div className="font-bold text-lg bg-blue-50 p-3 rounded text-center">
                {newGameInfo?.secretWord}
              </div>
              <p className="text-sm text-muted-foreground">Share this with players to join the game.</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Admin Secret Word:</h3>
              <div className="font-bold text-lg bg-amber-50 p-3 rounded text-center">
                {newGameInfo?.adminSecretWord}
              </div>
              <p className="text-sm text-muted-foreground">Use this to login as the game admin.</p>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button 
                onClick={loginAsAdmin}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Login as Admin Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
