const TEMPLATES = {
  career: {
    goal: "career",
    title: "Interview Brief",
    subtitle: "The document you read on the train to the interview.",
    payoff: "Finish it and you can talk about this industry for twenty minutes without notes.",
    sections: [
      { key: "how_money_moves", title: "How money moves here", prompt: "In one line: who pays whom, and for what?" },
      { key: "players", title: "The players that matter", prompt: "Name a company and why it holds power." },
      { key: "numbers", title: "Numbers I can quote", prompt: "One figure you would say out loud, and what it proves." },
      { key: "risk", title: "What keeps them awake", prompt: "The risk or rule that decides who wins." },
      { key: "my_view", title: "My own view", prompt: "Something you believe about this industry that others miss." },
      { key: "questions", title: "Questions I would ask them", prompt: "A question only an insider would think to ask." }
    ]
  },
  build_startup: {
    goal: "build_startup",
    title: "Idea Dossier",
    subtitle: "The file where industry gaps become a defensible plan.",
    payoff: "Finish it and you have a real, named gap with evidence behind it.",
    sections: [
      { key: "gap", title: "The gap", prompt: "What is broken or missing here, in one line?" },
      { key: "who_hurts", title: "Who feels it", prompt: "Who loses money or time because of that gap?" },
      { key: "why_now", title: "Why now", prompt: "What changed recently that makes this possible today?" },
      { key: "money", title: "Where the money is", prompt: "Who would pay, and roughly how much?" },
      { key: "incumbents", title: "Why the big players have not fixed it", prompt: "What stops them?" },
      { key: "first_test", title: "My first test", prompt: "The cheapest way to test whether this gap is real." }
    ]
  },
  invest: {
    goal: "invest",
    title: "Thesis Sheet",
    subtitle: "What you believe, and what would change your mind.",
    payoff: "Finish it and you hold a thesis you can defend or kill on evidence.",
    sections: [
      { key: "thesis", title: "My thesis", prompt: "In one line: what do you believe will happen here?" },
      { key: "drivers", title: "What drives it", prompt: "The mechanism that would make you right." },
      { key: "numbers", title: "Numbers behind it", prompt: "A figure that supports the thesis, and its source." },
      { key: "risk", title: "What kills it", prompt: "The thing that would prove you wrong." },
      { key: "watchlist", title: "Who I am watching", prompt: "A company or player, and what you are waiting to see." },
      { key: "review", title: "When I check back", prompt: "What must be true by when?" }
    ]
  },
  curiosity: {
    goal: "curiosity",
    title: "Market Map",
    subtitle: "Your own map of the industry, drawn as you learn it.",
    payoff: "Finish it and you can explain this whole industry to a friend.",
    sections: [
      { key: "basics", title: "What this industry actually does", prompt: "Explain it in one line, no jargon." },
      { key: "chain", title: "The chain", prompt: "How does value get from start to finish here?" },
      { key: "players", title: "Who holds power", prompt: "Name a player and the reason they matter." },
      { key: "numbers", title: "Scale", prompt: "One number that shows how big or small this is." },
      { key: "rules", title: "The rules", prompt: "A regulation or constraint that shapes everything." },
      { key: "frontier", title: "What is next", prompt: "The thing you find most interesting about its future." }
    ]
  }
};
function deliverableFor(goal) {
  switch (goal) {
    case "join_industry":
    case "career":
      return TEMPLATES.career;
    case "build_startup":
      return TEMPLATES.build_startup;
    case "invest":
      return TEMPLATES.invest;
    default:
      return TEMPLATES.curiosity;
  }
}
function consolidationSection(template, day) {
  const week = Math.max(1, Math.round(day / 7));
  return template.sections[(week - 1) % template.sections.length];
}
function isConsolidationDay(day) {
  return day > 0 && day % 7 === 0;
}
const RANKS = [
  { at: 0, title: "Observer", blurb: "Nothing written yet. One line starts the document." },
  { at: 17, title: "Analyst", blurb: "You have your first position on this industry in writing." },
  { at: 34, title: "Market Reader", blurb: "Enough to hold a real conversation about how this industry works." },
  { at: 50, title: "Insider", blurb: "Half the document stands. It already reads like someone who works here." },
  { at: 67, title: "Operator", blurb: "You can defend most of this without notes." },
  { at: 84, title: "Authority", blurb: "One section from a document you would put your name on." },
  { at: 100, title: "Principal", blurb: "Complete, in your own words, and ready to send." }
];
function dossierRank(completion) {
  const pct = Math.max(0, Math.min(100, Math.round(completion)));
  let index = 0;
  for (let i = 0; i < RANKS.length; i += 1) {
    if (pct >= RANKS[i].at) index = i;
  }
  const current = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  return {
    title: current.title,
    blurb: current.blurb,
    nextAt: next ? next.at : null,
    nextTitle: next ? next.title : null
  };
}
function slotStatus(lineCount) {
  if (lineCount <= 0) return "empty";
  return lineCount >= 2 ? "strong" : "filled";
}
export {
  consolidationSection,
  deliverableFor,
  dossierRank,
  isConsolidationDay,
  slotStatus
};
