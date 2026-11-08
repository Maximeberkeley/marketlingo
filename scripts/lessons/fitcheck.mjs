// Replays the app's text limits (mobile/lesson-kit/cardPresentation.ts and the lesson modules) on built
// lessons and exits 1 if any field would be cut on screen. Usage: node fitcheck.mjs lessons.json
import { buildSync } from 'esbuild';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fit-')), 'text.mjs');
buildSync({ entryPoints: [path.join(here, '../../mobile/lesson-kit/text.ts')], bundle: true, format: 'esm', platform: 'node', outfile: bundle, logLevel: 'error' });
const { shortText } = await import(pathToFileURL(bundle).href);

const LIMITS = {
  coldOpen: { headline: [4, 260], kicker: [1, 80] },
  microInsight: { text: [2, 150], highlight: [1, 100] },
  info: { title: [1, 80], body: [2, 150] },
  multipleChoice: { prompt: [2, 120] },
  theCall: { situation: [2, 150], prompt: [2, 110] },
};
const norm = s => s.replace(/\s+/g, ' ').trim();
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let bad = 0;
const report = (where, shown, full) => { bad++; console.log(`${where}: shown as "${shown}" | full "${full}"`); };
for (const [day, goals] of Object.entries(data)) {
  for (const [goal, lesson] of Object.entries(goals)) {
    for (const e of lesson.exercises) {
      for (const [f, [n, len]] of Object.entries(LIMITS[e.kind] || {})) {
        if (e[f] && norm(shortText(e[f], n, len)) !== norm(e[f])) report(`d${day} ${goal} ${e.id}.${f}`, shortText(e[f], n, len), e[f]);
      }
      if (e.kind === 'info') (e.bullets || []).forEach((b, i) => { if (i > 1 || norm(shortText(b, 1, 90)) !== norm(b)) report(`d${day} ${goal} ${e.id}.bullet${i}`, shortText(b, 1, 90), b); });
      for (const o of e.options || []) if (norm(shortText(o, 1, 72)) !== norm(o)) report(`d${day} ${goal} ${e.id} option`, shortText(o, 1, 72), o);
      for (const t of e.keyTerms || []) if (norm(shortText(t.definition, 1, 100)) !== norm(t.definition)) report(`d${day} ${goal} ${e.id} term`, shortText(t.definition, 1, 100), t.definition);
    }
  }
}
console.log(bad ? `${bad} fields would be cut` : 'all text fits on screen');
process.exit(bad ? 1 : 0);
