import { DAILY_CASES, casesDoneToday } from "./homeSteps";
const UNLOCK = "Finish Day 1 to unlock";
function practiceOrder(goal) {
  if (goal === "career") return ["interview", "deep-case", "arena"];
  if (goal === "invest") return ["investment", "deep-case", "arena", "interview"];
  return ["arena", "deep-case", "interview"];
}
function weeklyCard(info) {
  return {
    id: "weekly-case",
    eyebrow: "Weekly Case",
    title: info.title,
    byline: info.byline,
    path: info.path,
    locked: false,
    done: info.kind === "submitted",
    state: info.state,
    button: info.button,
    tile: info.tile,
    extra: info.extra
  };
}
function practiceCards(input) {
  const unlocked = input.lessonsStudied > 0;
  const cases = casesDoneToday(input.gamesCompleted);
  const arenaDone = (input.drillsCompleted || 0) > 0;
  const scored = input.mocks.filter((m) => typeof m.score === "number");
  const cards = {
    interview: {
      id: "interview",
      eyebrow: "Interview prep",
      title: "Mock interview",
      path: "/interview-lab",
      locked: false,
      done: false,
      state: input.mocks.length === 0 ? { before: "Practice answering out loud. No lessons needed." } : scored.length ? { before: "Last mock ", bold: `${Math.round(scored[0].score)} / 100`, after: ` \xB7 ${input.mocks.length} ${input.mocks.length === 1 ? "question" : "questions"} answered` } : { before: `${input.mocks.length} ${input.mocks.length === 1 ? "question" : "questions"} answered` },
      button: input.mocks.length === 0 ? "Start your first mock" : "Start a new mock"
    },
    investment: {
      id: "investment",
      eyebrow: "Investment Lab",
      title: "Would you invest?",
      path: "/investment-lab",
      locked: false,
      done: false,
      state: { before: "Weigh a real company and make the call." },
      button: "Open the lab"
    },
    "deep-case": {
      id: "deep-case",
      eyebrow: "Deep Case",
      path: "/deep-case",
      locked: !unlocked,
      done: unlocked && cases >= DAILY_CASES,
      title: !unlocked ? `${DAILY_CASES} cases a day` : cases >= DAILY_CASES ? `All ${DAILY_CASES} solved` : `Case ${cases + 1} of ${DAILY_CASES} today`,
      state: !unlocked ? { before: "Real situations built from your lessons." } : cases >= DAILY_CASES ? { before: "New cases tomorrow." } : cases === 0 ? { before: "A real situation. What would you do?" } : { bold: `${cases} of ${DAILY_CASES}`, after: " solved today" },
      button: !unlocked || cases >= DAILY_CASES ? null : cases === 0 ? "Start case 1" : `Start case ${cases + 1}`
    },
    arena: {
      id: "arena",
      eyebrow: "Daily Arena",
      title: "Three rounds",
      path: "/arena",
      locked: !unlocked,
      done: unlocked && arenaDone,
      state: !unlocked ? { before: "Quick calls on what you studied." } : arenaDone ? { before: "Done today" } : { before: "Quick calls on what you studied." },
      button: !unlocked ? null : arenaDone ? "Play again" : "Start the Arena"
    }
  };
  const ordered = practiceOrder(input.goal).map((id) => cards[id]);
  if (!input.weekly) return ordered;
  const weekly = weeklyCard(input.weekly);
  return input.weekly.kind === "open" || input.weekly.kind === "results" ? [weekly, ...ordered] : [...ordered, weekly];
}
const UNLOCK_LINE = UNLOCK;
export {
  UNLOCK_LINE,
  practiceCards,
  practiceOrder
};
