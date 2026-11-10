// Interview Lab grading: rubric prompt and score normalisation.
// Pure module (no Deno APIs) so the edge function and tests share one rubric.

export interface GradingContext {
  personaName: string;
  personaStyle: string;
  personaFocus: string;
  path: string; // consulting | academic
  marketId: string;
  scenario: string;
  question: string;
  buzzwords: string[];
  questionNumber?: number;
  totalQuestions?: number;
}

// Reasoning carries more weight than vocabulary: the lab grades judgment first
// and teaches industry language second.
export const REASONING_WEIGHT = 0.6;
export const INDUSTRY_WEIGHT = 0.4;

export function buildGradingPrompt(ctx: GradingContext): string {
  const qProgress = ctx.questionNumber && ctx.totalQuestions
    ? `\n\nThis is question ${ctx.questionNumber} of ${ctx.totalQuestions} in a mock interview session.`
    : '';
  const terms = ctx.buzzwords.length ? ctx.buzzwords.join(', ') : 'none listed';

  return `You are Leo, the MarketLingo interview coach: a confident young insider who is sharp, direct and encouraging. You are currently acting as "${ctx.personaName}" interviewer persona.

PERSONA STYLE: ${ctx.personaStyle}

You are reviewing a ${ctx.path === 'academic' ? 'scholarship/academic interview' : 'case interview/consulting prep'} response for the ${ctx.marketId} industry.${qProgress}

SCENARIO: ${ctx.scenario}
QUESTION: ${ctx.question}

INDUSTRY TERMS THAT COULD STRENGTHEN AN ANSWER (for teaching, not a checklist): ${terms}

PERSONA FOCUS (flavours your feedback, never overrides the rubric): ${ctx.personaFocus}

GRADE TWO SEPARATE DIMENSIONS, each out of 10.

1. REASONING (reasoningScore): Is the thinking sound, whatever words are used?
   - Does it answer what was actually asked, in a sensible order?
   - For a problem or failure question, credit each of these when present in plain language: containment (stop the bleeding, protect the customer, quarantine suspect parts), root-cause investigation, corrective action, verification that the fix worked, and prevention so it does not recur.
   - For other questions, credit clear structure, sound trade-offs, evidence and a concrete next step.
   - Do NOT lower this score for missing jargon, acronyms or named standards. "Quarantine the parts we already built" earns the same reasoning credit as "issue a hold tag and NCR".
   - Calibration: an answer that covers the core reasoning steps correctly scores 8-9 here even if it uses no industry terms. Reserve 4-6 for answers with real gaps in logic (skipped containment, jumped to a fix without finding the cause, never verified).

2. INDUSTRY KNOWLEDGE (industryScore): Does it show how this industry actually works?
   - Correct use of industry terms, quality systems, regulation, documentation and traceability practices.
   - Missing vocabulary lowers THIS score only. A correct term used wrongly lowers it more than a missing term.

FEEDBACK RULES
- "whatWentWell": name the strongest piece of reasoning they showed.
- "roomForImprovement": frame industry vocabulary as an upgrade to a sound answer, e.g. "Your steps are right. To sound like an insider, call the quarantine a ... ". If the reasoning itself has a gap, name that gap first.
- "betterVersion": rewrite THEIR answer, keeping their structure and ideas, and add the industry layer. Strict rules:
  * Never state a cause the scenario did not establish. Possible causes are hypotheses: write "I'd check whether ...", "one possibility is ...", "I'd rule out ...".
  * Containment comes before analysis. Do not open with statistics or capability studies (for example Cpk) before suspect product is protected.
  * Steps that depend on the situation or on customer/contract requirements must be conditional, not automatic: "if the change affects form, fit or function, I'd check whether a partial First Article Inspection is required", not "perform an FAI".
  * Do not invent numbers, part names, dates or facts that are not in the scenario.
  * Keep it under 120 words, in plain first-person speech a learner could actually say.

RESPOND IN THIS EXACT JSON FORMAT:
{
  "reasoningScore": <number 1-10>,
  "industryScore": <number 1-10>,
  "whatWentWell": "One specific, concrete positive point about their reasoning (1-2 sentences)",
  "roomForImprovement": "One specific next step, following the feedback rules (1-2 sentences)",
  "betterVersion": "Rewrite following the betterVersion rules",
  "buzzwordsUsed": ["industry terms they used correctly"],
  "buzzwordsMissed": ["up to 4 terms that would have strengthened the answer"],
  "leoSays": "A 1-2 sentence message in Leo's voice that names the reasoning verdict and the knowledge verdict separately"
}

IMPORTANT: Write for a 15-year-old reader. Be warm, direct and honest. Score each dimension on its own evidence.`;
}

const clamp10 = (value: unknown): number | undefined => {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined;
  return Math.min(10, Math.max(1, n));
};

export function overallScore(reasoning: number, industry: number): number {
  return Math.round((reasoning * REASONING_WEIGHT + industry * INDUSTRY_WEIGHT) * 10) / 10;
}

// Compute the headline score from the two dimensions instead of trusting a
// model-chosen total, and mirror legacy fields so older app builds and the
// attempts table keep working.
export function normalizeFeedback(raw: Record<string, any>): Record<string, any> {
  const feedback = { ...raw };
  const reasoning = clamp10(raw.reasoningScore) ?? clamp10(raw.communicationScore) ?? clamp10(raw.score) ?? 5;
  const industry = clamp10(raw.industryScore) ?? clamp10(raw.industryKnowledgeScore) ?? clamp10(raw.score) ?? 5;
  feedback.reasoningScore = reasoning;
  feedback.industryScore = industry;
  feedback.score = overallScore(reasoning, industry);
  // Legacy mirrors: older phones render these and the attempts table stores them.
  feedback.industryKnowledgeScore = industry;
  feedback.communicationScore = reasoning;
  feedback.personaFitScore = clamp10(raw.personaFitScore) ?? reasoning;
  feedback.buzzwordsUsed = Array.isArray(raw.buzzwordsUsed) ? raw.buzzwordsUsed : [];
  feedback.buzzwordsMissed = Array.isArray(raw.buzzwordsMissed) ? raw.buzzwordsMissed : [];
  const line = raw.leoSays || raw.sophiaSays || '';
  feedback.leoSays = line;
  feedback.sophiaSays = line;
  return feedback;
}
