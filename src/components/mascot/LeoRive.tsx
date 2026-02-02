import { useRive, useStateMachineInput, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ============================================
// LEO RIVE MASCOT - Premium Deformation Animation
// ============================================

export type LeoRiveState = "idle" | "thinking" | "success" | "failure" | "celebrate" | "urgent" | "wave";

interface LeoRiveProps {
  size?: number;
  state?: LeoRiveState;
  className?: string;
  onClick?: () => void;
}

/**
 * LeoRive - Premium animated mascot using Rive
 * 
 * This component loads a .riv file and controls Leo's animations
 * through a state machine with the following inputs:
 * 
 * BOOLEAN INPUTS (for persistent states):
 * - idle: default breathing/blinking state
 * - thinking: head tilt, eyes look up
 * - urgent: shake + bounce
 * 
 * TRIGGER INPUTS (for one-shot animations):
 * - success: jump celebration
 * - failure: sad droop
 * - celebrate: big celebration
 * - wave: friendly wave
 * 
 * To create the leo.riv file:
 * 1. Go to rive.app and create a new file
 * 2. Import your Leo artwork layers (PSD/SVG)
 * 3. Add deformation meshes to body, tail, ears, head
 * 4. Create state machine named "LeoSM"
 * 5. Add the inputs listed above
 * 6. Export as leo.riv and place in public/animations/
 */
export function LeoRive({
  size = 200,
  state = "idle",
  className,
  onClick,
}: LeoRiveProps) {
  const { rive, RiveComponent } = useRive({
    // Path to your .riv file - place it in public/animations/
    src: "/animations/leo.riv",
    // State machine name (must match what you create in Rive Editor)
    stateMachines: "LeoSM",
    // Layout configuration
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    // Auto-play the animation
    autoplay: true,
  });

  // Boolean state inputs (persistent states)
  const idleInput = useStateMachineInput(rive, "LeoSM", "idle");
  const thinkingInput = useStateMachineInput(rive, "LeoSM", "thinking");
  const urgentInput = useStateMachineInput(rive, "LeoSM", "urgent");

  // Trigger inputs (one-shot animations)
  const successTrigger = useStateMachineInput(rive, "LeoSM", "success");
  const failureTrigger = useStateMachineInput(rive, "LeoSM", "failure");
  const celebrateTrigger = useStateMachineInput(rive, "LeoSM", "celebrate");
  const waveTrigger = useStateMachineInput(rive, "LeoSM", "wave");

  // Reset all boolean states
  const resetStates = useCallback(() => {
    if (idleInput) idleInput.value = false;
    if (thinkingInput) thinkingInput.value = false;
    if (urgentInput) urgentInput.value = false;
  }, [idleInput, thinkingInput, urgentInput]);

  // Handle state changes
  useEffect(() => {
    if (!rive) return;

    resetStates();

    switch (state) {
      case "idle":
        if (idleInput) idleInput.value = true;
        break;
      case "thinking":
        if (thinkingInput) thinkingInput.value = true;
        break;
      case "urgent":
        if (urgentInput) urgentInput.value = true;
        break;
      case "success":
        if (successTrigger) successTrigger.fire();
        break;
      case "failure":
        if (failureTrigger) failureTrigger.fire();
        break;
      case "celebrate":
        if (celebrateTrigger) celebrateTrigger.fire();
        break;
      case "wave":
        if (waveTrigger) waveTrigger.fire();
        break;
    }
  }, [state, rive, resetStates, idleInput, thinkingInput, urgentInput, successTrigger, failureTrigger, celebrateTrigger, waveTrigger]);

  return (
    <div
      className={cn("relative cursor-pointer", className)}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <RiveComponent />
    </div>
  );
}

// ============================================
// HOOKS FOR STATE MACHINE CONTROL
// ============================================

interface UseLeoRiveReturn {
  triggerSuccess: () => void;
  triggerFailure: () => void;
  triggerCelebrate: () => void;
  triggerWave: () => void;
  setThinking: (value: boolean) => void;
  setUrgent: (value: boolean) => void;
  setIdle: () => void;
}

/**
 * Hook to control Leo's Rive animations imperatively
 * Use this when you need fine-grained control over animation triggers
 */
export function useLeoRiveControls(rive: any): UseLeoRiveReturn {
  const idleInput = useStateMachineInput(rive, "LeoSM", "idle");
  const thinkingInput = useStateMachineInput(rive, "LeoSM", "thinking");
  const urgentInput = useStateMachineInput(rive, "LeoSM", "urgent");
  const successTrigger = useStateMachineInput(rive, "LeoSM", "success");
  const failureTrigger = useStateMachineInput(rive, "LeoSM", "failure");
  const celebrateTrigger = useStateMachineInput(rive, "LeoSM", "celebrate");
  const waveTrigger = useStateMachineInput(rive, "LeoSM", "wave");

  const resetStates = useCallback(() => {
    if (idleInput) idleInput.value = false;
    if (thinkingInput) thinkingInput.value = false;
    if (urgentInput) urgentInput.value = false;
  }, [idleInput, thinkingInput, urgentInput]);

  return {
    triggerSuccess: () => successTrigger?.fire(),
    triggerFailure: () => failureTrigger?.fire(),
    triggerCelebrate: () => celebrateTrigger?.fire(),
    triggerWave: () => waveTrigger?.fire(),
    setThinking: (value: boolean) => {
      resetStates();
      if (thinkingInput) thinkingInput.value = value;
    },
    setUrgent: (value: boolean) => {
      resetStates();
      if (urgentInput) urgentInput.value = value;
    },
    setIdle: () => {
      resetStates();
      if (idleInput) idleInput.value = true;
    },
  };
}

// ============================================
// FALLBACK COMPONENT (uses existing puppet)
// ============================================

import { LeoPuppet, LeoAnim } from "./LeoStateMachine";

interface LeoRiveWithFallbackProps {
  size?: number;
  state?: LeoRiveState;
  className?: string;
  onClick?: () => void;
  useFallback?: boolean;
}

// Map Rive states to puppet animations
const riveToFallbackMap: Record<LeoRiveState, LeoAnim> = {
  idle: "idle",
  thinking: "thinking",
  success: "success",
  failure: "failure",
  celebrate: "celebrating",
  urgent: "urgent",
  wave: "waving",
};

/**
 * LeoRiveWithFallback - Tries to load Rive, falls back to puppet
 * 
 * Use this component during development before you have the .riv file.
 * It will gracefully fall back to the existing LeoPuppet animation system.
 */
export function LeoRiveWithFallback({
  size = 200,
  state = "idle",
  className,
  onClick,
  useFallback = true, // Set to false once you have leo.riv
}: LeoRiveWithFallbackProps) {
  // For now, always use fallback until leo.riv exists
  if (useFallback) {
    return (
      <LeoPuppet
        size={size}
        animation={riveToFallbackMap[state]}
        className={className}
      />
    );
  }

  return (
    <LeoRive
      size={size}
      state={state}
      className={className}
      onClick={onClick}
    />
  );
}

export default LeoRive;
