import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProPromotionProvider } from "@/components/subscription/ProPromotionProvider";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import Auth from "./pages/Auth";
import SelectMarket from "./pages/SelectMarket";
import Home from "./pages/Home";
import SelectFamiliarity from "./pages/SelectFamiliarity";
import SelectGoal from "./pages/SelectGoal";
import Passport from "./pages/Passport";
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
import Practice from "./pages/Practice";
import NotFound from "./pages/NotFound";
import { PageTransition } from "@/components/layout/PageTransition";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/select-market" element={<PageTransition><SelectMarket /></PageTransition>} />
        <Route path="/select-goal" element={<PageTransition><SelectGoal /></PageTransition>} />
        <Route path="/select-familiarity" element={<PageTransition><SelectFamiliarity /></PageTransition>} />
        <Route path="/passport" element={<PageTransition><Passport /></PageTransition>} />
        <Route path="/home" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/roadmap" element={<PageTransition><Roadmap /></PageTransition>} />
        <Route path="/notebook" element={<PageTransition><Notebook /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/practice" element={<PageTransition><Practice /></PageTransition>} />
        <Route path="/trainer" element={<PageTransition><Trainer /></PageTransition>} />
        <Route path="/games" element={<PageTransition><Games /></PageTransition>} />
        <Route path="/drills" element={<PageTransition><Drills /></PageTransition>} />
        <Route path="/summaries" element={<PageTransition><Summaries /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        <Route path="/achievements" element={<PageTransition><Achievements /></PageTransition>} />
        <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
        <Route path="/admin/content" element={<AdminGuard><AdminContent /></AdminGuard>} />
        <Route path="/regulatory-hub" element={<PageTransition><RegulatoryHub /></PageTransition>} />
        <Route path="/investment-lab" element={<PageTransition><InvestmentLab /></PageTransition>} />
        <Route path="/investment-lab/watchlist" element={<PageTransition><InvestmentWatchlist /></PageTransition>} />
        <Route path="/investment-lab/certificate" element={<PageTransition><InvestmentCertificatePage /></PageTransition>} />
        <Route path="/investment-lab/:moduleId" element={<PageTransition><InvestmentModule /></PageTransition>} />
        <Route path="/subscription" element={<PageTransition><Subscription /></PageTransition>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => {
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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" />
            <BrowserRouter>
              <ScrollToTop />
              <ProPromotionProvider>
                <AnimatedRoutes />
              </ProPromotionProvider>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
