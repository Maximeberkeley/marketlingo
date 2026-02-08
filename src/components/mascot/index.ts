// Mascot System Exports
// ============================================

// Core mascot components
export { MascotReaction } from "./MascotReaction";
export type { MascotState } from "./MascotReaction";

export { LessonMascot } from "./LessonMascot";
export { LeoRive, LeoRiveWithFallback, useLeoRiveControls } from "./LeoRive";
export type { LeoRiveState } from "./LeoRive";

// Legacy components (for backwards compatibility)
export { Leo2D } from "./Leo2D";
export { LeoCelebration } from "./LeoCelebration";
export { LeoMascot } from "./LeoMascot";
export { LeoQuiz } from "./LeoQuiz";
export { LeoPuppet, LeoProvider, useLeo, LeoCharacter } from "./LeoStateMachine";
export type { LeoAnim } from "./LeoStateMachine";
