import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to determine the correct route based on user's onboarding state.
 * 
 * Flow:
 * 1. No market selected -> /select-market
 * 2. Market selected but no learning goal -> /select-goal
 * 3. Goal set but no familiarity level FOR THAT MARKET -> /select-familiarity
 * 4. All set -> /home
 * 
 * IMPORTANT: Familiarity and learning_goal are stored per-market in user_progress.
 */
export function useOnboardingRouter() {
  const navigate = useNavigate();

  /**
   * Check user profile and navigate to the appropriate screen
   */
  const routeToCorrectScreen = async (userId: string) => {
    try {
      // First get the selected market
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", userId)
        .single();

      if (!profile?.selected_market) {
        // New user or no market selected
        navigate("/select-market");
        return "market";
      }

      // Check if user has familiarity set for THIS market
      const { data: progress } = await supabase
        .from("user_progress")
        .select("familiarity_level")
        .eq("user_id", userId)
        .eq("market_id", profile.selected_market)
        .single();

      if (progress?.familiarity_level) {
        // User has completed onboarding for this market
        navigate("/home");
        return "home";
      } else {
        // Market selected but no familiarity level for this market
        navigate("/select-familiarity");
        return "familiarity";
      }
    } catch (error) {
      console.error("Error checking user state:", error);
      navigate("/select-market");
      return "market";
    }
  };

  return { routeToCorrectScreen };
}
