import React from 'react';
import { LessonScreen } from './screens/LessonScreen';
import { Lesson } from './types';

const demoLesson: Lesson = {
  id: 'demo',
  title: 'Demo lesson',
  exercises: [
    {
      kind: 'info',
      id: 'i1',
      title: 'Unit economics',
      body: 'Unit economics measure the profit or loss a company makes on a single unit — one customer, one flight, one subscription.',
      bullets: ['Revenue per unit', 'Cost to serve that unit', 'Contribution margin'],
    },
    {
      kind: 'multipleChoice',
      id: 'q1',
      prompt: 'What do unit economics measure?',
      options: [
        'Profit or loss on a single unit',
        'Total company revenue for the year',
        'The number of employees per office',
        'The share price at market close',
      ],
      correctIndex: 0,
      explanation: 'Unit economics zoom in on one unit so you can see whether growth adds profit or burns cash.',
    },
    {
      kind: 'wordBank',
      id: 'w1',
      prompt: 'Build the definition',
      answer: ['Contribution', 'margin', 'is', 'revenue', 'minus', 'variable', 'cost'],
      distractors: ['taxes', 'salary'],
      explanation: 'Contribution margin excludes fixed costs.',
    },
  ],
};

export function LessonFlow({ onExit }: { onExit?: () => void }) {
  return (
    <LessonScreen
      lesson={demoLesson}
      onExit={() => onExit?.()}
      onFinish={() => onExit?.()}
    />
  );
}
