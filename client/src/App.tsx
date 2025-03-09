import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/home-page";
import AdminPage from "@/pages/admin-page";
import NotFound from "@/pages/not-found";
import { IntroAnimation } from "@/components/ui/intro-animation";
import { CarnavalTheme } from "@/components/ui/carnaval-theme";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;