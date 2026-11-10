import { describe, expect, it } from 'vitest';
import { buildGradingPrompt, normalizeFeedback, overallScore } from '../supabase/functions/_shared/interview-grading';

const ctx = {
  personaName: 'The Tech Lead', personaStyle: 'Technical.', personaFocus: 'specs',
  path: 'consulting', marketId: 'aerospace',
  scenario: 'Drilled holes on a wing assembly are coming out oversized.',
  question: 'How would you stop this defect?',
  buzzwords: ['first article inspection', 'process capability', 'nonconformance'],
};

describe('Interview Lab grading', () => {
  it('grades reasoning separately and does not penalise missing jargon there', () => {
    const prompt = buildGradingPrompt(ctx);
    expect(prompt).toMatch(/reasoningScore/);
    expect(prompt).toMatch(/industryScore/);
    expect(prompt).toMatch(/Do NOT lower this score for missing jargon/);
    for (const step of ['containment', 'root-cause', 'corrective action', 'verification', 'prevention']) expect(prompt).toContain(step);
    expect(prompt).not.toMatch(/most first attempts should be 4-6/i);
  });

  it('keeps the sharper version from asserting causes or automatic steps', () => {
    const prompt = buildGradingPrompt(ctx);
    expect(prompt).toMatch(/Never state a cause the scenario did not establish/);
    expect(prompt).toMatch(/I'd check whether/);
    expect(prompt).toMatch(/Containment comes before analysis/);
    expect(prompt).toMatch(/conditional, not automatic/);
  });

  it('computes the headline from the two dimensions, weighted toward reasoning', () => {
    expect(overallScore(8.5, 6.5)).toBe(7.7);
    const fb = normalizeFeedback({ reasoningScore: 8.5, industryScore: 6.5, score: 6, leoSays: 'Nice.' });
    expect(fb.score).toBe(7.7);
    expect(fb.communicationScore).toBe(8.5);
    expect(fb.industryKnowledgeScore).toBe(6.5);
    expect(fb.sophiaSays).toBe('Nice.');
  });

  it('clamps bad values and falls back to legacy fields', () => {
    const fb = normalizeFeedback({ reasoningScore: 14, industryKnowledgeScore: '3' });
    expect(fb.reasoningScore).toBe(10);
    expect(fb.industryScore).toBe(3);
    expect(normalizeFeedback({}).score).toBe(5);
  });
});
