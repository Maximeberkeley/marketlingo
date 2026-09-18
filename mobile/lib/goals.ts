/**
 * Learning goals: what the app stores vs. how content is tagged.
 *
 * Onboarding stores 'join_industry', but the curriculum was authored with the
 * tag `goal:career`. Without this mapping the largest group of learners never
 * matched their own goal's lessons and silently fell back to generic content.
 */
export type LearningGoal = 'join_industry' | 'invest' | 'build_startup' | 'curiosity';

const CONTENT_TAG: Record<string, string> = {
  join_industry: 'career',
  career: 'career',
  invest: 'invest',
  build_startup: 'build_startup',
  curiosity: 'curiosity',
};

/** The `goal:` tag used on authored content for a stored learning goal. */
export function goalContentTag(goal?: string | null): string {
  return `goal:${CONTENT_TAG[goal || 'curiosity'] || 'curiosity'}`;
}
