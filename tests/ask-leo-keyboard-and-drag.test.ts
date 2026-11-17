import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const leo = readFileSync('mobile/components/ai/AskLeoOverlay.tsx', 'utf8');
const sort = readFileSync('mobile/lesson-kit/modules/SortSignal.tsx', 'utf8');

// Max, Nov 17 (TestFlight screenshots).
describe('Ask Leo sheet and the keyboard', () => {
  it('sits on the measured keyboard instead of KeyboardAvoidingView, and never under the status bar', () => {
    expect(leo).not.toContain('<KeyboardAvoidingView');
    expect(leo).toContain('setKb(Math.max(0, winH - e.endCoordinates.screenY))');
    expect(leo).toContain('maxHeight: winH - kb - insets.top - 8');
  });
  it('puts the keyboard away once a question is sent', () => {
    expect(leo).toMatch(/if \(!question \|\| isLoading\) return;\s*\/\/[^\n]*\n\s*Keyboard\.dismiss\(\);/);
  });
  it("shows Leo's **bold** as bold, not asterisks", () => {
    expect(leo).toContain("{msg.role === 'user' ? body : withBold(body)}");
  });
});

describe('Sort the signal drop', () => {
  it('lands where the finger is, with a little slop around each bucket', () => {
    expect(sort).toContain('if (g.moveX || g.moveY) return { x: g.moveX, y: g.moveY };');
    expect(sort).toContain('const SLOP = 16;');
  });
});
