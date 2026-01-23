import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import SelectMarket from "./pages/SelectMarket";
import Home from "./pages/Home";
import Roadmap from "./pages/Roadmap";
import Notebook from "./pages/Notebook";
import Profile from "./pages/Profile";
import Trainer from "./pages/Trainer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/select-market" element={<SelectMarket />} />
          <Route path="/home" element={<Home />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/notebook" element={<Notebook />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/trainer" element={<Trainer />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
