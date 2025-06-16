import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGameState } from "@/lib/hooks";
import LoginScreen from "@/components/LoginScreen";

export default function Login() {
  const [, navigate] = useLocation();
  const { game, player, isAdmin } = useGameState();
  
  // Get parameters from the URL if present
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const secret = params.get("secret");
  const gameIdParam = params.get("gameId");

  useEffect(() => {
    // If user is already in a game, redirect to the appropriate page
    if (game) {
      if (isAdmin) {
        navigate(`/admin/${game.id}`);
      } else if (player) {
        navigate(`/game/${game.id}`);
      }
    }
  }, [game, player, isAdmin]);

  // Pre-fill the form with parameters if provided in URL
  useEffect(() => {
    // Handle secret word parameter (for player login)
    if (secret) {
      const secretInput = document.getElementById("secretWord") as HTMLInputElement;
      if (secretInput) {
        secretInput.value = secret;
      }
      
      // If we also have gameId, pre-fill that too
      if (gameIdParam) {
        const gameIdInput = document.getElementById("gameId") as HTMLInputElement;
        if (gameIdInput) {
          gameIdInput.value = gameIdParam;
        }
      }
    }
    
    // Legacy support for code parameter
    else if (code) {
      const codeInput = document.getElementById("secretWord") as HTMLInputElement;
      if (codeInput) {
        codeInput.value = code;
      }
    }
  }, [code, secret, gameIdParam]);

  return <LoginScreen />;
}
