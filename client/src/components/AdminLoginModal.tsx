import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { adminLoginSchema } from "@shared/schema";
import { useGameState } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { updateGame, setAdminMode } = useGameState();

  const form = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      adminSecretWord: "",
    },
  });

  async function onSubmit(values: z.infer<typeof adminLoginSchema>) {
    setIsLoading(true);
    try {
      console.log("Attempting admin login with:", values.adminSecretWord);
      const response = await apiRequest("POST", "/api/admin/login", values);
      const data = await response.json();
      
      if (data.game && data.isAdmin) {
        console.log("Admin login successful:", data);
        
        // First, update the local state
        localStorage.setItem("isAdmin", "true");
        localStorage.removeItem("player"); // Clear player data
        localStorage.setItem("currentGame", JSON.stringify(data.game));
        
        // Then update the application state
        setAdminMode(true);
        updateGame(data.game);
        
        // Close the modal
        onClose();
        
        // Show success toast
        toast({
          title: "Admin login successful",
          description: `You are now managing game #${data.game.id.slice(0, 5)}`,
        });
        
        // Navigate to admin page with a longer delay to ensure state updates
        setTimeout(() => {
          console.log("Navigating to admin page with ID:", data.game.id);
          window.location.href = `/admin/${data.game.id}`;
        }, 1000);
      }
    } catch (error) {
      console.error("Admin login error:", error);
      let message = "Failed to login as admin";
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">Admin Login</DialogTitle>
          <DialogDescription>
            Enter the admin secret word to manage the game
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adminSecretWord"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Admin Secret Word</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter admin secret word"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
