import { createContext, useContext, ReactNode } from "react";
import { useProPromotion } from "@/hooks/useProPromotion";
import { ProUpsellModal } from "./ProUpsellModal";

type PromoTrigger = 'lesson_complete' | 'feature_gate' | 'random' | 'low_engagement' | 'manual';

interface ProPromotionContextValue {
  triggerAfterLesson: (lessonCount: number) => void;
  triggerFeatureGate: (featureName: string) => boolean;
  checkLowEngagement: (lastActivityDate: Date | null) => boolean;
  showPromo: (trigger?: PromoTrigger) => void;
  isProUser: boolean;
}

const ProPromotionContext = createContext<ProPromotionContextValue | null>(null);

export function useProPromotionContext() {
  const context = useContext(ProPromotionContext);
  if (!context) {
    throw new Error("useProPromotionContext must be used within ProPromotionProvider");
  }
  return context;
}

interface ProPromotionProviderProps {
  children: ReactNode;
}

export function ProPromotionProvider({ children }: ProPromotionProviderProps) {
  const {
    shouldShowPromo,
    currentTrigger,
    isProUser,
    triggerAfterLesson,
    triggerFeatureGate,
    checkLowEngagement,
    showPromo,
    dismissPromo,
  } = useProPromotion();

  return (
    <ProPromotionContext.Provider
      value={{
        triggerAfterLesson,
        triggerFeatureGate,
        checkLowEngagement,
        showPromo,
        isProUser,
      }}
    >
      {children}
      
      {/* Global promo modal */}
      <ProUpsellModal
        isOpen={shouldShowPromo}
        onClose={dismissPromo}
        trigger={currentTrigger}
      />
    </ProPromotionContext.Provider>
  );
}
