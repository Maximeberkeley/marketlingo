import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { extractSentences, splitSentences } from '../mobile/lib/textUtils';

const transform = (source: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:'ts',jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });

describe('sentences keep dotted names whole', () => {
  it('never ends a sentence inside a domain or a dotted name', () => {
    expect(splitSentences('The OCC ordered the sponsor bank of Crypto.com to fix its program. It had weak controls.'))
      .toEqual(['The OCC ordered the sponsor bank of Crypto.com to fix its program.', 'It had weak controls.']);
    expect(splitSentences('JPMorgan Chase Bank, N.A. agreed to pay $1 billion. Regulators said so.'))
      .toEqual(['JPMorgan Chase Bank, N.A. agreed to pay $1 billion.', 'Regulators said so.']);
    expect(extractSentences('Node.js runs it. Second. Third.', 2)).toBe('Node.js runs it. Second.');
  });

  it('still splits ordinary sentences and keeps decimals', () => {
    expect(splitSentences('Prices rose 2.5% in May. Then they fell.')).toEqual(['Prices rose 2.5% in May.', 'Then they fell.']);
    expect(splitSentences('It ended. Next one starts!')).toEqual(['It ended.', 'Next one starts!']);
  });

  it('keeps the JavaScript copy in sync', () => {
    expect(readFileSync('mobile/lib/textUtils.js', 'utf8')).toBe(transform(readFileSync('mobile/lib/textUtils.ts', 'utf8')));
  });
});
