import React from 'react';
import { InfoCard } from '../exercises/InfoCard';
import { MultipleChoice } from '../exercises/MultipleChoice';
import { WordBank } from '../exercises/WordBank';
import { ColdOpen } from '../modules/ColdOpen';
import { MicroInsight } from '../modules/MicroInsight';
import { SortSignal } from '../modules/SortSignal';
import { BuildChain } from '../modules/BuildChain';
import { FaceOff } from '../modules/FaceOff';
import { SpeedRound } from '../modules/SpeedRound';
import { NumberSense } from '../modules/NumberSense';
import { SpotTheFake } from '../modules/SpotTheFake';
import { MapMarket } from '../modules/MapMarket';
import { ChartRead } from '../modules/ChartRead';
import { TheCall } from '../modules/TheCall';
import { ExerciseState } from '../exercises/types';
import { Exercise } from '../types';

/** Beats that need no answer — the button just says Continue. */
export const PASSIVE_KINDS = ['info', 'coldOpen', 'microInsight'] as const;
export const isPassiveKind = (kind?: string) =>
  PASSIVE_KINDS.includes(kind as (typeof PASSIVE_KINDS)[number]);

/** Shared module renderer used by lessons, the Arena and Deep Case. */
export function renderExerciseByKind(
  exercise: Exercise,
  phase: 'answering' | 'feedback',
  onChange: (s: ExerciseState) => void,
) {
  switch (exercise.kind) {
    case 'info':
      return <InfoCard exercise={exercise} phase={phase} onChange={onChange} />;
    case 'multipleChoice':
      return <MultipleChoice exercise={exercise} phase={phase} onChange={onChange} />;
    case 'wordBank':
      return <WordBank exercise={exercise} phase={phase} onChange={onChange} />;
    case 'coldOpen':
      return <ColdOpen exercise={exercise} phase={phase} onChange={onChange} />;
    case 'microInsight':
      return <MicroInsight exercise={exercise} phase={phase} onChange={onChange} />;
    case 'sortSignal':
      return <SortSignal exercise={exercise} phase={phase} onChange={onChange} />;
    case 'buildChain':
      return <BuildChain exercise={exercise} phase={phase} onChange={onChange} />;
    case 'faceOff':
      return <FaceOff exercise={exercise} phase={phase} onChange={onChange} />;
    case 'speedRound':
      return <SpeedRound exercise={exercise} phase={phase} onChange={onChange} />;
    case 'numberSense':
      return <NumberSense exercise={exercise} phase={phase} onChange={onChange} />;
    case 'spotFake':
      return <SpotTheFake exercise={exercise} phase={phase} onChange={onChange} />;
    case 'mapMarket':
      return <MapMarket exercise={exercise} phase={phase} onChange={onChange} />;
    case 'chartRead':
      return <ChartRead exercise={exercise} phase={phase} onChange={onChange} />;
    case 'theCall':
      return <TheCall exercise={exercise} phase={phase} onChange={onChange} />;
    default:
      return null;
  }
}
