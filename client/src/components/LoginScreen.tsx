import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Create a schema for joining a game by ID and player name
const gameJoinSchema = z.object({
  playerName: z.string().min(1, "Name is required"),
  gameId: z.string().min(1, "Game ID is required"),
  photoUrl: z.string().optional() // Optional player photo URL
});
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AdminLoginModal from "./AdminLoginModal";

export default function LoginScreen() {
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [newGameInfo, setNewGameInfo] = useState<{ id: string; adminSecretWord: string } | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Get URL parameters
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      gameId: params.get('gameId') || ""
    };
  };

  // Get URL parameters
  const urlParams = getUrlParams();
  
  const form = useForm<z.infer<typeof gameJoinSchema>>({
    resolver: zodResolver(gameJoinSchema),
    defaultValues: {
      playerName: "",
      gameId: urlParams.gameId || "", // Pre-fill with gameId from URL if available
      photoUrl: ""
    },
  });
  
  // Update form if URL changes
  useEffect(() => {
    const { gameId } = getUrlParams();
    
    if (gameId) {
      form.setValue('gameId', gameId);
      
      // Auto-focus the name field
      setTimeout(() => {
        const nameInput = document.querySelector('input[name="playerName"]') as HTMLInputElement;
        if (nameInput) {
          nameInput.focus();
        }
      }, 100);
    }
  }, [form, window.location.search]);

  async function onSubmit(values: z.infer<typeof gameJoinSchema>) {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/games/join", values);
      const data = await response.json();
      
      if (data.player && data.game) {
        localStorage.setItem("player", JSON.stringify(data.player));
        localStorage.setItem("currentGame", JSON.stringify(data.game));
        localStorage.setItem("isAdmin", "false"); // Ensure isAdmin is properly set
        
        // Use window.location.href instead of navigate to force a full page reload
        window.location.href = `/game/${data.game.id}`;
      }
    } catch (error) {
      let message = "Failed to join game";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function createNewGame() {
    setIsCreatingGame(true);
    try {
      const response = await apiRequest("POST", "/api/games", {});
      const game = await response.json();
      
      if (game) {
        setNewGameInfo({
          id: game.id,
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
    } finally {
      setIsCreatingGame(false);
    }
  }

  function closeNewGameDialog() {
    setNewGameInfo(null);
  }

  function adminLogin() {
    closeNewGameDialog();
    setAdminModalOpen(true);
  }
  
  function loginAsAdmin(adminSecretWord: string) {
    form.reset();
    setAdminModalOpen(true);
    // Pre-fill the admin secret word
    setTimeout(() => {
      const adminInput = document.querySelector('input[name="adminSecretWord"]') as HTMLInputElement;
      if (adminInput) {
        adminInput.value = adminSecretWord;
      }
    }, 100);
  }

  return (
    <>
      <Card className="max-w-md mx-auto bg-white rounded-lg shadow-md">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
            Team Guessing Game
          </h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="playerName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your name"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gameId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Game ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter game ID"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Hidden photoUrl field */}
              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />
              
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Joining..." : "Join Game"}
                </Button>
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={createNewGame}
                  disabled={isCreatingGame}
                >
                  {isCreatingGame ? "Creating..." : "Create New Game"}
                </Button>
              </div>

              <div className="text-center mt-4">
                <Button
                  type="button"
                  variant="link"
                  className="text-blue-600 text-sm"
                  onClick={() => setAdminModalOpen(true)}
                >
                  Admin Login
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={newGameInfo !== null} onOpenChange={closeNewGameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Game Created!</DialogTitle>
            <DialogDescription>
              Share the Game ID with players so they can join this game.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Game ID:</h3>
              <div 
                className="font-bold text-lg bg-blue-50 p-3 rounded text-center cursor-pointer"
                onClick={() => {
                  if (newGameInfo?.id) {
                    navigator.clipboard.writeText(newGameInfo.id);
                    toast({
                      title: "Copied!",
                      description: "Game ID copied to clipboard",
                      duration: 2000,
                    });
                  }
                }}
                title="Click to copy"
              >
                {newGameInfo?.id}
              </div>
              <p className="text-sm text-muted-foreground">Click to copy. Share this ID with players to join the game.</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Admin Secret Word:</h3>
              <div 
                className="font-bold text-lg bg-amber-50 p-3 rounded text-center cursor-pointer"
                onClick={() => {
                  if (newGameInfo?.adminSecretWord) {
                    navigator.clipboard.writeText(newGameInfo.adminSecretWord);
                    toast({
                      title: "Copied!",
                      description: "Admin secret word copied to clipboard",
                      duration: 2000,
                    });
                  }
                }}
                title="Click to copy"
              >
                {newGameInfo?.adminSecretWord}
              </div>
              <p className="text-sm text-muted-foreground">Click to copy. Use this to login as the game admin.</p>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button 
                onClick={() => loginAsAdmin(newGameInfo?.adminSecretWord || '')}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Login as Admin Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AdminLoginModal 
        isOpen={adminModalOpen} 
        onClose={() => setAdminModalOpen(false)} 
      />
    </>
  );
}
