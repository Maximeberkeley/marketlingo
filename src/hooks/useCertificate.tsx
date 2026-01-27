import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface CertificateData {
  userName: string;
  completionDate: string;
  marketName: string;
  totalXP: number;
  lessonsCompleted: number;
  trainersCompleted: number;
  longestStreak: number;
  skillAreas: string[];
}

export function useCertificate(marketId?: string) {
  const { user } = useAuth();
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [isEligible, setIsEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 180 });

  useEffect(() => {
    if (!user || !marketId) {
      setLoading(false);
      return;
    }

    fetchCertificateData();
  }, [user, marketId]);

  const fetchCertificateData = async () => {
    if (!user || !marketId) return;

    try {
      // Fetch user progress
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("market_id", marketId)
        .maybeSingle();

      // Fetch user XP
      const { data: xpData } = await supabase
        .from("user_xp")
        .select("*")
        .eq("user_id", user.id)
        .eq("market_id", marketId)
        .maybeSingle();

      // Fetch trainer attempts count
      const { count: trainerCount } = await supabase
        .from("trainer_attempts")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("is_correct", true);

      // Fetch profile for username
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      // Fetch market info
      const { data: market } = await supabase
        .from("markets")
        .select("name")
        .eq("id", marketId)
        .maybeSingle();

      const completedStacks = progressData?.completed_stacks?.length || 0;
      const currentDay = progressData?.current_day || 1;
      
      // Update progress tracking
      setProgress({ current: Math.min(currentDay, 180), total: 180 });

      // Check eligibility (completed 180 days)
      const eligible = currentDay >= 180 || completedStacks >= 180;
      setIsEligible(eligible);

      // Determine skill areas based on progression
      const skillAreas = determineSkillAreas(currentDay);

      const data: CertificateData = {
        userName: profile?.username || user.email?.split('@')[0] || 'Aerospace Professional',
        completionDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        marketName: market?.name || 'Aerospace',
        totalXP: xpData?.total_xp || 0,
        lessonsCompleted: completedStacks,
        trainersCompleted: trainerCount || 0,
        longestStreak: progressData?.longest_streak || 0,
        skillAreas,
      };

      setCertificateData(data);
    } catch (error) {
      console.error('Error fetching certificate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineSkillAreas = (currentDay: number): string[] => {
    const skills: string[] = [];
    
    // Month 1: Foundations (Days 1-30)
    if (currentDay >= 30) {
      skills.push('Industry Fundamentals');
      skills.push('Supply Chain Dynamics');
    }
    
    // Month 2: Commercial Aviation (Days 31-60)
    if (currentDay >= 60) {
      skills.push('Commercial Aviation');
      skills.push('Airline Economics');
    }
    
    // Month 3: Defense & Government (Days 61-90)
    if (currentDay >= 90) {
      skills.push('Defense Procurement');
      skills.push('Government Contracting');
    }
    
    // Month 4: Space Economy (Days 91-120)
    if (currentDay >= 120) {
      skills.push('Space Commerce');
      skills.push('Satellite Systems');
    }
    
    // Month 5: Emerging Tech (Days 121-150)
    if (currentDay >= 150) {
      skills.push('Emerging Technologies');
      skills.push('Sustainable Aviation');
    }
    
    // Month 6: Business Strategy (Days 151-180)
    if (currentDay >= 180) {
      skills.push('Aerospace Business Strategy');
      skills.push('Investment Analysis');
    }

    return skills.slice(0, 6); // Max 6 skills
  };

  return {
    certificateData,
    isEligible,
    loading,
    progress,
    refetch: fetchCertificateData,
  };
}
