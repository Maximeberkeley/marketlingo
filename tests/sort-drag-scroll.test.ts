import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

// Max, Nov 16: dragging a Sort the signal card in the Arena scrolled the page under his finger.
describe('Sort the signal never scrolls the page while dragging', () => {
  it('in lessons', () => {
    expect(readFileSync('mobile/lesson-kit/screens/LessonScreen.tsx', 'utf8')).toContain("scrollEnabled={exercise.kind !== 'sortSignal'}");
  });
  it('in the Arena, starting from the top', () => {
    const arena = readFileSync('mobile/lesson-kit/arena/ArenaScreen.tsx', 'utf8');
    expect(arena).toContain("const dragKind = exercise?.kind === 'sortSignal';");
    expect(arena).toContain('scrollEnabled={!dragKind}');
    expect(arena).toContain('if (dragKind) scrollRef.current?.scrollTo({ y: 0, animated: false });');
  });
  it('in Deep Cases', () => {
    expect(readFileSync('mobile/lesson-kit/case/CaseScreen.tsx', 'utf8')).toContain("scrollEnabled={stage?.exercise?.kind !== 'sortSignal'}");
  });
});
