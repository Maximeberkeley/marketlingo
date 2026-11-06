import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { explicitSteps, checkMechanism } from '../mobile/lesson-kit/sequencer/lessonChecks';
import { buildCase } from '../mobile/lesson-kit/case/buildCase';
import { buildArena } from '../mobile/lesson-kit/arena/buildArena';
import { studiedMaterial } from '../mobile/lesson-kit/practice/studiedMaterial';
import neuro from './fixtures/neuroscience-day1.json';
import fintech from './fixtures/fintech-day1.json';
import cleanenergy from './fixtures/cleanenergy-day1.json';
import cybersecurity from './fixtures/cybersecurity-day1.json';
import web3 from './fixtures/web3-day1.json';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');
const lessonOf = (f: any) => ({ ...f, ...studiedMaterial(f.authored_lesson) });
const fixtures = { neuro, fintech, cleanenergy, cybersecurity, web3 } as Record<string, any>;
const drills = [
  { id: 'd1', statement: 'A verified true market fact.', is_true: true, explanation: 'Checked.' },
  { id: 'd2', statement: 'Another verified true market fact.', is_true: true, explanation: 'Checked.' },
  { id: 'd3', statement: 'A verified false market claim.', is_true: false, explanation: 'Checked.' },
];

describe('Build the Chain only from sequences the lesson spelled out', () => {
  it('reads numbered lists, arrow chains and First/Then/Finally runs, and strips the giveaway words', () => {
    expect(explicitSteps('How a card payment settles:\n1. The shop sends the charge\n2. The card network routes it\n3. The bank approves it\n4. Money moves overnight')).toEqual([
      'The shop sends the charge', 'The card network routes it', 'The bank approves it', 'Money moves overnight',
    ]);
    expect(explicitSteps('Value moves like this: raw titanium → forged parts → assembled wing → finished aircraft.')).toEqual([
      'Value moves like this: raw titanium', 'Forged parts', 'Assembled wing', 'Finished aircraft',
    ]);
    expect(explicitSteps('First, the drug is tested on cells in the lab. Then it is tested on a small group of volunteers. Finally, a large trial proves it works.')).toEqual([
      'The drug is tested on cells in the lab', 'It is tested on a small group of volunteers', 'A large trial proves it works',
    ]);
  });

  it('never turns ordinary prose into a chain', () => {
    const prose = 'Airbus is the OEM: it designs the aircraft and puts its name on it. Tier 1 suppliers sell whole systems straight to the OEM. A supplier can build the fuselage, but the OEM is still responsible for how it fits. Say which layer a company sits in before you judge it.';
    expect(explicitSteps(prose)).toBeNull();
    expect(checkMechanism([{ title: 'Say which layer a company sits in', body: prose }], 'x')).toBeNull();
    expect(explicitSteps('Only two steps: 1. Sign up 2. Learn')).toBeNull();
    expect(explicitSteps('First you read. Then you answer.')).toBeNull();
  });

  it('asks to put the steps in order and lists the order in the explanation', () => {
    const chain = checkMechanism([{ title: 'How a card payment settles', body: '1. The shop sends the charge 2. The card network routes it 3. The bank approves it' }], 'c');
    expect(chain).toMatchObject({ kind: 'buildChain', prompt: 'Put these steps in order: How a card payment settles' });
    expect(chain?.explanation).toBe('In order: 1. The shop sends the charge  2. The card network routes it  3. The bank approves it');
  });

  it('generates no chain from any day-1 lesson, whose slides are prose', () => {
    for (const f of Object.values(fixtures)) expect(checkMechanism(f.slides, 'x')).toBeNull();
  });

  it('gives Cases Evidence a written sort or chain, else a spot-the-altered-claim, never a made-up order', () => {
    for (const [name, f] of Object.entries(fixtures)) {
      const lesson = lessonOf(f);
      const evidence = buildCase({ marketId: name, marketName: name, trainer: [], drills, stats: [], studied: [lesson] } as any)
        ?.stages.find(s => s.key === 'evidence')?.exercise;
      const written = (lesson.questions || []).map((q: any) => q.kind);
      if (written.includes('sortSignal')) expect(evidence?.kind).toBe('sortSignal');
      else if (written.includes('buildChain')) expect(evidence).toMatchObject({ kind: 'buildChain', prompt: (lesson.questions as any[]).find(q => q.kind === 'buildChain').prompt });
      if (evidence?.kind === 'buildChain') expect(evidence.prompt).not.toMatch(/^Rebuild the mechanism/);
      // Without written sort/chain questions, the stage falls back to an altered-claim check from the lesson.
      const bare = { ...lesson, questions: [] };
      const fallback = buildCase({ marketId: name, marketName: name, trainer: [], drills, stats: [], studied: [bare] } as any)
        ?.stages.find(s => s.key === 'evidence')?.exercise;
      expect(fallback?.kind).not.toBe('buildChain');
      if (fallback?.source?.type === 'lesson') expect(fallback.kind).toBe('spotFake');
      if (name !== 'cleanenergy') expect(fallback).toMatchObject({ kind: 'spotFake', source: { type: 'lesson' } });
    }
  });

  it('never puts a generated prose chain in the Arena', () => {
    for (const [name, f] of Object.entries(fixtures)) {
      for (let i = 0; i < 20; i++) {
        const chains = buildArena({ marketId: name, marketName: name, trainer: [], drills, stats: [], studied: [lessonOf(f)] })
          .flatMap(w => w.exercises).filter(e => e.kind === 'buildChain') as any[];
        for (const c of chains) expect(c.prompt).not.toMatch(/^Rebuild the mechanism/);
      }
    }
  }, 60000);

  it('labels where the chain starts and ends', () => {
    const src = read('mobile/lesson-kit/modules/BuildChain.tsx');
    expect(src).toContain("if (slot === 0) return 'Tap the first step';");
    expect(src).toContain("if (slot === total - 1) return 'Tap the last step';");
  });
});

describe('JavaScript copies of every file changed for lesson clarity', () => {
  const pairs: Array<[string, string]> = [
    ['lesson-kit/sequencer/lessonChecks', 'ts'],
    ['lesson-kit/modules/BuildChain', 'tsx'],
    ['lesson-kit/case/buildCase', 'ts'],
    ['lesson-kit/arena/buildArena', 'ts'],
  ];
  it('match their source exactly after transpilation and import React when they use it', () => {
    for (const [path, loader] of pairs) {
      const js = read(`mobile/${path}.js`);
      expect(js).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js).toMatch(/import React\b/);
    }
  }, 30000);
});
