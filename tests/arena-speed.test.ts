import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');
const hook = read('mobile/hooks/useStudiedLessons.ts');

describe('setting up the Arena loads studied lessons once', () => {
  it('reads the session on the device instead of asking the server who you are', () => {
    expect(hook).toContain('await supabase.auth.getSession()');
    expect(hook).not.toContain('auth.getUser()');
    expect(read('mobile/hooks/useFocusTopic.ts')).toMatch(/const load = useCallback\(async \(\) => \{[\s\S]*?auth\.getSession\(\)[\s\S]*?\.from\('learner_focus'\)/);
  });

  it('asks for completed lessons and daily credits at the same time', () => {
    expect(hook).toMatch(/await Promise\.all\(\[\s*supabase\s*\.from\('user_progress'\)[\s\S]*?\.from\('daily_completions'\)/);
  });

  it('does not fetch again when the focus topic or preferred day arrives; it only reorders', () => {
    expect(hook).toMatch(/\}, \[marketId\]\);\n\n  const lessons = useMemo\(\(\) => orderStudiedLessons\(studied, preferredDay, focusSignature\), \[studied, preferredDay, focusSignature\]\);/);
    expect(hook).toContain('export function orderStudiedLessons(');
  });

  it('builds the Arena and Deep Case once the focus topic is known, so a run never reshuffles', () => {
    expect(read('mobile/app/arena.tsx')).toContain('studied.isLoading || focus.loading ||');
    expect(read('mobile/app/deep-case.tsx')).toContain('studied.isLoading || focus.loading || solvedBefore === null || authored.loading) {');
  });

  it('has JavaScript copies that match', () => {
    for (const [path, loader] of [['hooks/useStudiedLessons', 'ts'], ['hooks/useFocusTopic', 'ts'], ['app/arena', 'tsx'], ['app/deep-case', 'tsx']]) {
      const js = read(`mobile/${path}.js`);
      expect(js, path).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js, path).toMatch(/import React\b/);
    }
  }, 30000);
});
