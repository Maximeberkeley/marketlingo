import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { checkMechanism } from '../mobile/lesson-kit/sequencer/lessonChecks';
import { buildCase } from '../mobile/lesson-kit/case/buildCase';
import { buildArena } from '../mobile/lesson-kit/arena/buildArena';
import { lessonQuestions } from '../mobile/lesson-kit/practice/lessonQuestions';
import type { StudiedLessonInput } from '../mobile/lesson-kit/arena/buildArena';

const prose = 'Tier 1 suppliers deliver complete systems directly to the aircraft maker. The OEM owns the design and runs final assembly. Collins Aerospace sells avionics to Boeing and Airbus.';
const lesson: StudiedLessonInput = { title: 'Supplier tiers', day: 1, slides: [{ title: 'Say which layer a company sits in', body: prose }], questions: [
  { kind: 'multipleChoice', id: 'mc', prompt: 'Which supplier tier?', options: ['Tier 1', 'OEM'], correctIndex: 0 },
  { kind: 'sortSignal', id: 'sort', prompt: 'Sort suppliers', buckets: ['OEM','Tier 1'], items: [{text:'Boeing',bucket:0},{text:'Collins',bucket:1}] },
] };
const input = { marketName: 'Aerospace', trainer: [], drills: [], stats: [], studied: [lesson] };
const evidence = (l: StudiedLessonInput) => buildCase({ ...input, studied: [l] })?.stages.find(s => s.key === 'evidence')?.exercise;

describe('explicit source sequences only', () => {
  it('rejects the tester’s principle, OEM duty and company example', () => {
    expect(checkMechanism(lesson.slides, 'test')).toBeNull();
  });
  it.each([
    ['1. Gather evidence\n2. Compare the bids\n3. Choose a supplier', ['Gather evidence','Compare the bids','Choose a supplier']],
    ['First gather evidence, then compare the bids, finally choose a supplier.', ['gather evidence','compare the bids','choose a supplier.']],
    ['First gather evidence. Then choose a supplier.', ['gather evidence.','choose a supplier.']],
    ['Gather evidence → Compare the bids → Choose a supplier', ['Gather evidence','Compare the bids','Choose a supplier']],
  ])('preserves the complete explicit order: %s', (body, steps) => {
    expect(checkMechanism([{title:'Supplier selection',body}], 'test')?.steps).toEqual(steps);
  });
  it.each(['1. One step\n3. Missing step\n4. Last step', 'First-tier suppliers sell systems. Other companies then supply parts.', 'Gather evidence → → Choose a supplier'])('rejects incomplete or non-sequential markers: %s', body => {
    expect(checkMechanism([{body}], 'test')).toBeNull();
  });
  it('never skips or truncates a long intermediate step', () => {
    const long = 'Compare all supplier bids against the evidence and confirm every required certification before moving on. '.repeat(4).trim();
    expect(checkMechanism([{body:`1. Gather evidence\n2. ${long}\n3. Choose a supplier`}], 'test')?.steps).toEqual(['Gather evidence',long,'Choose a supplier']);
  });
  it('Cases Evidence prefers authored chain, then sort, then claim', () => {
    const chain = {kind:'buildChain' as const,id:'chain',prompt:'Assembly sequence',steps:['Design','Build','Certify']};
    expect(evidence({...lesson,questions:[...(lesson.questions ?? []),chain]})?.kind).toBe('buildChain');
    expect(evidence(lesson)?.kind).toBe('sortSignal');
    const claims = [{body:'Supplier revenue grows when more aircraft are delivered to airlines. Engine demand increases as the fleet expands worldwide. Maintenance spending rises as older aircraft need more frequent repairs.'}];
    expect(evidence({...lesson,slides:claims,questions:lesson.questions?.filter(q=>q.kind==='multipleChoice')})?.kind).toBe('multipleChoice');
    expect(evidence({...lesson,questions:lesson.questions?.filter(q=>q.kind==='multipleChoice')})).toBeUndefined();
  });
  it('Arena never generates a chain even from an explicitly sequenced slide', () => {
    const sequenced = {...lesson,slides:[{body:'1. Gather evidence\n2. Compare bids\n3. Select supplier'}],questions:lesson.questions?.filter(q=>q.kind==='multipleChoice')};
    expect(buildArena({...input,studied:[sequenced]}).flatMap(w=>w.exercises).some(q=>q.kind==='buildChain')).toBe(false);
  });
  it('plain-question practice preserves authored answers and never invents chains', () => {
    const result = lessonQuestions([{...lesson,slides:[]}]);
    expect(result[0]).toMatchObject({question:'Which supplier tier?',options:['Tier 1','OEM'],correctAnswer:0});
    expect(result).toHaveLength(1);
  });
  it('keeps all changed JavaScript twins identical to their sources', () => {
    for (const [file,loader] of [['sequencer/lessonChecks','ts'],['case/buildCase','ts'],['arena/buildArena','ts'],['practice/lessonQuestions','ts'],['modules/BuildChain','tsx']]) {
      const source = readFileSync(`mobile/lesson-kit/${file}.${loader}`,'utf8');
      const compiled = execFileSync(process.execPath,['--input-type=module','-e',`import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:'${loader}',jsx:'transform',format:'esm',target:'es2020'}).code);`],{encoding:'utf8'});
      expect(readFileSync(`mobile/lesson-kit/${file}.js`,'utf8')).toBe(compiled);
    }
  });
});