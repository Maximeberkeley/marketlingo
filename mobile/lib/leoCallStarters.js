function leoCallStarters(input) {
  const company = input.company?.trim();
  const lesson = input.lessonTitle?.trim();
  return [
    company ? `Help me practice for my ${company} interview` : "Help me prepare for an interview",
    "Explain today's lesson more simply",
    lesson ? `Quiz me on ${lesson}` : "Quiz me on today's lesson"
  ];
}
export {
  leoCallStarters
};
