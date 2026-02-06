import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to determine the correct route based on user's onboarding state.
 * 
 * Flow:
 * 1. No market selected -> /select-market
 * 2. Market selected but no familiarity level -> /select-familiarity
 * 3. Both set -> /home
 */
export function useOnboardingRouter() {
  const navigate = useNavigate();

  /**
   * Check user profile and navigate to the appropriate screen
   */
  const routeToCorrectScreen = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market, familiarity_level")
        .eq("id", userId)
        .single();

      if (profile?.selected_market && profile?.familiarity_level) {
        // User has completed onboarding
        navigate("/home");
        return "home";
      } else if (profile?.selected_market) {
        // Market selected but no familiarity level
        navigate("/select-familiarity");
        return "familiarity";
      } else {
        // New user or no market selected
        navigate("/select-market");
        return "market";
      }
    } catch (error) {
      console.error("Error checking user state:", error);
      navigate("/select-market");
      return "market";
    }
  };

  return { routeToCorrectScreen };
}
