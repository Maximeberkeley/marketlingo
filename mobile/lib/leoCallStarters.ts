/**
 * First things to say in a Leo call. A tester invited to "talk about anything"
 * did not know where to start; one tap sends a starter as the first message.
 */
export function leoCallStarters(input: { company?: string | null; lessonTitle?: string | null }): string[] {
  const company = input.company?.trim();
  const lesson = input.lessonTitle?.trim();
  return [
    company ? `Help me practice for my ${company} interview` : 'Help me prepare for an interview',
    "Explain today's lesson more simply",
    lesson ? `Quiz me on ${lesson}` : "Quiz me on today's lesson",
  ];
}
