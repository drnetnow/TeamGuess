import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Game from "@/pages/Game";
import Admin from "@/pages/Admin";
import { GameProvider } from "@/lib/hooks";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/game/:gameId" component={Game} />
      <Route path="/admin/:gameId" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GameProvider>
          <div className="container mx-auto px-4 py-8">
            <Toaster />
            <Router />
          </div>
        </GameProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
