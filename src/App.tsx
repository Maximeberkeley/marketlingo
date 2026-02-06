import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProPromotionProvider } from "@/components/subscription/ProPromotionProvider";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import Auth from "./pages/Auth";
import SelectMarket from "./pages/SelectMarket";
import Home from "./pages/Home";
import SelectFamiliarity from "./pages/SelectFamiliarity";
import Roadmap from "./pages/Roadmap";
import Notebook from "./pages/Notebook";
import Profile from "./pages/Profile";
import Trainer from "./pages/Trainer";
import Games from "./pages/Games";
import Drills from "./pages/Drills";
import Summaries from "./pages/Summaries";
import Settings from "./pages/Settings";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import AdminContent from "./pages/AdminContent";
import RegulatoryHub from "./pages/RegulatoryHub";
import InvestmentLab from "./pages/InvestmentLab";
import InvestmentModule from "./pages/InvestmentModule";
import InvestmentCertificatePage from "./pages/InvestmentCertificatePage";
import InvestmentWatchlist from "./pages/InvestmentWatchlist";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Global unhandled rejection handler to prevent app crashes
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.error("Unhandled error:", event.error);
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'hsl(218 52% 13%)',
              border: '1px solid hsl(220 25% 18%)',
              color: 'hsl(220 20% 97%)',
            },
          }}
        />
        <BrowserRouter>
          <ScrollToTop />
          <ProPromotionProvider>
            <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/select-market" element={<SelectMarket />} />
              <Route path="/select-familiarity" element={<SelectFamiliarity />} />
              <Route path="/home" element={<Home />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/notebook" element={<Notebook />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/trainer" element={<Trainer />} />
              <Route path="/games" element={<Games />} />
              <Route path="/drills" element={<Drills />} />
              <Route path="/summaries" element={<Summaries />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/admin/content" element={<AdminGuard><AdminContent /></AdminGuard>} />
              <Route path="/regulatory-hub" element={<RegulatoryHub />} />
              <Route path="/investment-lab" element={<InvestmentLab />} />
              <Route path="/investment-lab/watchlist" element={<InvestmentWatchlist />} />
              <Route path="/investment-lab/certificate" element={<InvestmentCertificatePage />} />
              <Route path="/investment-lab/:moduleId" element={<InvestmentModule />} />
              <Route path="/subscription" element={<Subscription />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProPromotionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
