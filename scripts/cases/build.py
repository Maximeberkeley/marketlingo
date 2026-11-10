"""Build hand-written Deep Cases into an idempotent public.deep_cases migration.

Each case file defines SRC (sources by key, like the lessons) and CASES: one dict per case with day,
slot (1 apply, 2 connect, 3 decide), title, lessonTitle, brief, evidence, numbers and calls. The four
learner goals share the brief, evidence and numbers; each goal gets its own final call and debrief.

Usage:
  python3 scripts/cases/build.py aerospace scripts/cases/aerospace/days_*.py \
      --out drizzle/migrations/0038_aerospace_deep_cases.sql

Checks run first and stop the build on errors: case shape, every goal's call, answer and option shape,
sources, dashes, number-slider traps. Then the lessons' fitcheck.mjs replays the app's text limits on
every stage, and this file checks the limits of the game modules fitcheck does not cover.
"""
import importlib.util, hashlib, json, re, sys, uuid, collections, os, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
LESSONS = os.path.join(HERE, '..', 'lessons')
_spec = importlib.util.spec_from_file_location('lesson_build', os.path.join(LESSONS, 'build.py'))
LB = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(LB)

GOALS = LB.GOALS
SLOTS = {1: 'apply', 2: 'connect', 3: 'decide'}
EVIDENCE = {'sortSignal', 'spotFake', 'buildChain', 'multipleChoice', 'faceOff'}
CALLS = {'theCall', 'multipleChoice'}
# Module limits fitcheck.mjs does not replay: (sentences, characters).
LIMITS = {'statement': (1, 90), 'item': (1, 90), 'consequence': (1, 90), 'faceName': (1, 60), 'faceNote': (1, 72),
          'step': (1, 90), 'prompt': (2, 120), 'debrief': (2, 230), 'bucket': (1, 28)}
SENT = re.compile(r'(?<=[.!?])\s+(?=[A-Z0-9"“])')


def sentences(t):
    return [s for s in SENT.split(t.strip()) if s]


def load(paths):
    src, cases = {}, []
    for i, path in enumerate(paths):
        spec = importlib.util.spec_from_file_location(f'cases_{i}', path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        for k, v in mod.SRC.items():
            if k in src and src[k] != v:
                raise SystemExit(f'source key {k} defined twice with different values')
            src[k] = v
        cases += mod.CASES
    return src, sorted(cases, key=lambda c: (c['day'], c['slot']))


def fits(text, kind, where, errs):
    n, length = LIMITS[kind]
    if len(text) > length or len(sentences(text)) > n:
        errs.append(f'{where}: too long for the screen ({len(text)} chars, {len(sentences(text))} sentences; max {length}, {n}): "{text[:70]}"')


def check_exercise(e, where, errs, warns, pos, texts):
    k = e.get('kind')
    texts += [e.get('prompt', ''), e.get('explanation', ''), e.get('situation', '')]
    if e.get('prompt'):
        fits(e['prompt'], 'prompt', f'{where} prompt', errs)
    if not e.get('explanation'):
        errs.append(f'{where}: no explanation')
    if k in ('multipleChoice', 'theCall'):
        opts = e['options']
        texts += opts + list(e.get('consequences') or [])
        ci = e['correctIndex']
        if len(opts) != 3 or not 0 <= ci < len(opts) or len(set(opts)) != len(opts):
            errs.append(f'{where}: needs three distinct options and a valid correctIndex')
        pos[ci] += 1
        lens_ = [len(x) for x in opts]
        if lens_[ci] == max(lens_) and lens_.count(max(lens_)) == 1 and max(lens_) - sorted(lens_)[-2] > 6:
            warns.append(f'{where}: right answer is clearly the longest ({lens_})')
        if k == 'theCall':
            if len(e.get('consequences') or []) != len(opts):
                errs.append(f'{where}: one consequence per option')
            for c in e.get('consequences') or []:
                fits(c, 'consequence', f'{where} consequence', errs)
    elif k == 'spotFake':
        texts += e['statements']
        if len(e['statements']) != 3 or not 0 <= e['fakeIndex'] < 3:
            errs.append(f'{where}: spotFake needs three statements and a fake index')
        pos[e['fakeIndex']] += 1
        for s in e['statements']:
            fits(s, 'statement', f'{where} statement', errs)
    elif k == 'faceOff':
        texts += [e['left']['name'], e['left'].get('note', ''), e['right']['name'], e['right'].get('note', '')]
        pos[e['correctIndex']] += 1
        for side in ('left', 'right'):
            fits(e[side]['name'], 'faceName', f'{where} {side}', errs)
            if e[side].get('note'):
                fits(e[side]['note'], 'faceNote', f'{where} {side} note', errs)
    elif k == 'numberSense':
        if not e['min'] < e['value'] < e['max']:
            errs.append(f'{where}: numberSense value out of range')
        else:
            at = (e['value'] - e['min']) / (e['max'] - e['min'])
            if at <= e.get('tolerance', 0.12):
                errs.append(f'{where}: the untouched dial already counts as right ({at:.0%})')
            if 0.47 <= at <= 0.53:
                warns.append(f'{where}: answer sits mid-range ({at:.0%}), easy to guess')
            if e['value'] >= 1000 and (e.get('unit') or '') not in ('K', 'M', 'B'):
                errs.append(f"{where}: {e['value']} shows as {e['value']/1000:.1f}K on the dial; rescale the question")
            if round(e['value'], 1) != e['value'] and abs(e['value']) < 1000:
                warns.append(f'{where}: decimal answer shows rounded to 0.1')
    elif k == 'sortSignal':
        texts += [i['text'] for i in e['items']] + e['buckets']
        if {i['bucket'] for i in e['items']} != set(range(len(e['buckets']))):
            errs.append(f'{where}: sort buckets unused')
        for i in e['items']:
            fits(i['text'], 'item', f'{where} item', errs)
        for b in e['buckets']:
            fits(b, 'bucket', f'{where} bucket', errs)
    elif k == 'buildChain':
        texts += e['steps']
        if len(e['steps']) < 3:
            errs.append(f'{where}: chain too short')
        for s in e['steps']:
            fits(s, 'step', f'{where} step', errs)
    else:
        errs.append(f'{where}: unknown kind {k}')


def check(src, cases):
    errs, warns = [], []
    pos = collections.Counter()
    seen = set()
    by_day = collections.defaultdict(list)
    for c in cases:
        d, s = c['day'], c['slot']
        where = f'd{d} c{s}'
        if (d, s) in seen:
            errs.append(f'{where}: duplicate day and slot')
        seen.add((d, s))
        by_day[d].append(s)
        if s not in SLOTS:
            errs.append(f'{where}: slot must be 1, 2 or 3')
        texts = [c['title'], c['brief']['headline'], c['brief'].get('kicker', ''), c['brief'].get('fullText', '')]
        if not c.get('lessonTitle'):
            errs.append(f'{where}: no lessonTitle')
        for k in c['brief'].get('sources', []):
            if k not in src:
                errs.append(f'{where}: unknown source {k}')
        if not c['brief'].get('sources'):
            errs.append(f'{where}: brief has no sources')
        ev = c['evidence']
        if ev.get('kind') not in EVIDENCE:
            errs.append(f'{where}: evidence kind {ev.get("kind")} not allowed')
        check_exercise(ev, f'{where} evidence', errs, warns, pos, texts)
        if c.get('numbers', {}).get('kind') != 'numberSense':
            errs.append(f'{where}: numbers stage must be numberSense')
        else:
            check_exercise(c['numbers'], f'{where} numbers', errs, warns, pos, texts)
        if set(c['calls']) != set(GOALS):
            errs.append(f'{where}: calls must cover {GOALS}')
        prompts = []
        for g, call in c['calls'].items():
            e = call['call']
            if e.get('kind') not in CALLS:
                errs.append(f'{where} {g}: call kind {e.get("kind")} not allowed')
            check_exercise(e, f'{where} {g}', errs, warns, pos, texts)
            prompts.append((e.get('situation', ''), e.get('prompt', '')))
            for field in ('pro', 'mistake', 'model'):
                if not call.get(field):
                    errs.append(f'{where} {g}: no {field}')
                else:
                    texts.append(call[field])
                    fits(call[field], 'debrief', f'{where} {g} {field}', errs)
            for k in call.get('sources', []):
                if k not in src:
                    errs.append(f'{where} {g}: unknown source {k}')
        if len(set(prompts)) != len(prompts):
            errs.append(f'{where}: two goals share the same call; write one per goal')
        for t in texts:
            if LB.EM.search(t or ''):
                errs.append(f'{where}: dash in "{t[:60]}"')
            m = LB.BAD.search(t or '')
            if m:
                warns.append(f'{where}: word "{m.group(0)}" in "{t[:60]}"')
    for d, slots in sorted(by_day.items()):
        if sorted(slots) != [1, 2, 3]:
            warns.append(f'd{d}: has cases {sorted(slots)}, a full day has 1, 2 and 3')
    return errs, warns, pos


def rotate(e, k):
    """Moves the right answer to a varied stored position; every module shows options shuffled anyway."""
    if e.get('kind') not in ('multipleChoice', 'theCall') or not k:
        return dict(e)
    n = len(e['options'])
    out = dict(e)
    for f in ('options', 'consequences', 'whyWrong'):
        if isinstance(e.get(f), list) and len(e[f]) == n:
            out[f] = [e[f][(i - k) % n] for i in range(n)]
    out['correctIndex'] = (e['correctIndex'] + k) % n
    return out


def expand(src, c):
    def resolve(keys, where):
        return LB.srcs(src, keys, where)
    brief = {k: v for k, v in c['brief'].items() if k != 'sources'}
    brief['sources'] = resolve(c['brief']['sources'], f"d{c['day']} c{c['slot']} brief")
    calls = {}
    for gi, (g, call) in enumerate(c['calls'].items()):
        out = {'call': rotate(call['call'], (c['day'] + c['slot'] + gi) % 3), 'proReasoning': call['pro'], 'commonMistake': call['mistake'], 'mentalModel': call['model']}
        if call.get('sources'):
            out['sources'] = resolve(call['sources'], f"d{c['day']} c{c['slot']} {g}")
        calls[g] = out
    return {
        'id': c['id'], 'title': c['title'], 'lessonTitle': c['lessonTitle'], 'slot': c['slot'], 'type': SLOTS[c['slot']],
        'brief': brief, 'evidence': rotate(c['evidence'], (c['day'] * 2 + c['slot']) % 3), 'numbers': dict(c['numbers']), 'calls': calls,
    }


def fit_payload(src, market, cases):
    """Shapes each case like a lesson, one per goal, so fitcheck.mjs can replay the text limits."""
    out = {}
    for c in cases:
        content = expand(src, c)
        brief = {'id': 'brief', 'kind': 'coldOpen', **{k: v for k, v in content['brief'].items() if k != 'sources'}}
        out[f"{c['day']}-c{c['slot']}"] = {
            g: {'exercises': [brief, {**content['evidence'], 'id': 'evidence'}, {**content['numbers'], 'id': 'numbers'}, {**call['call'], 'id': f'call-{g}'}]}
            for g, call in content['calls'].items()
        }
    return out


def q(s):
    return LB.q(s)


SCHEMA = """CREATE TABLE IF NOT EXISTS public.deep_cases (
  id UUID PRIMARY KEY,
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 365),
  slot SMALLINT NOT NULL CHECK (slot BETWEEN 1 AND 3),
  content JSONB NOT NULL,
  tags TEXT[] NOT NULL DEFAULT ARRAY['handwritten-v1']::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (market_id, day, slot)
);

GRANT SELECT ON public.deep_cases TO authenticated;
GRANT ALL ON public.deep_cases TO service_role;
ALTER TABLE public.deep_cases ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'deep_cases'
                 AND policyname = 'Deep cases readable by signed-in learners') THEN
    CREATE POLICY "Deep cases readable by signed-in learners" ON public.deep_cases FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deep_cases_market_day ON public.deep_cases (market_id, day);
"""


def fingerprint(content):
    """A short hash of a case's content, kept in its tags so a loader can skip rows already current."""
    return 'src:' + hashlib.sha256(json.dumps(content, ensure_ascii=False, sort_keys=True).encode('utf-8')).hexdigest()[:12]


def rows_for(src, cases, market):
    """The deep_cases rows for one market, shared by the SQL migration and the load-deep-cases function."""
    out = []
    for c in cases:
        content = expand(src, c)
        out.append({
            'id': str(uuid.uuid5(LB.NS, f"marketlingo:{market}:case:d{c['day']}:s{c['slot']}:handwritten-v1")),
            'market_id': market, 'day': c['day'], 'slot': c['slot'], 'content': content,
            'tags': ['handwritten-v1', fingerprint(content)],
        })
    return out


def sql(src, cases, market):
    rows = []
    for r in rows_for(src, cases, market):
        tags = ', '.join(q(t) for t in r['tags'])
        rows.append(f"({q(r['id'])}::uuid, {q(market)}, {r['day']}, {r['slot']}, {q(json.dumps(r['content'], ensure_ascii=False))}::jsonb, ARRAY[{tags}]::text[])")
    days = sorted({c['day'] for c in cases})
    head = (f"-- Hand-written {market} Deep Cases, days {days[0]}-{days[-1]} ({len(rows)} cases, three per day).\n"
            "-- Each case shares its brief, evidence and numbers across learner goals and holds a final call\n"
            "-- and debrief for every goal (career, invest, build_startup, curiosity).\n"
            "-- Safe to run more than once: creates public.deep_cases if missing and upserts each case.\n")
    return ''.join([head, 'BEGIN;\n\n', SCHEMA, '\n',
                    'INSERT INTO public.deep_cases (id, market_id, day, slot, content, tags) VALUES\n',
                    ',\n'.join(rows),
                    '\nON CONFLICT (market_id, day, slot) DO UPDATE SET content = EXCLUDED.content, tags = EXCLUDED.tags, updated_at = now();\n\n',
                    'COMMIT;\n\n', "NOTIFY pgrst, 'reload schema';\n"]), len(rows)


if __name__ == '__main__':
    args = sys.argv[1:]
    out = args[args.index('--out') + 1] if '--out' in args else None
    market = args[0]
    paths = [a for a in args[1:] if not a.startswith('--') and a != out]
    src, cases = load(paths)
    for c in cases:
        c.setdefault('id', f"{market}-d{c['day']}-c{c['slot']}")
    errs, warns, pos = check(src, cases)
    print(f'{len(cases)} cases, days {sorted({c["day"] for c in cases})}')
    print('answer positions:', dict(pos))
    for w in warns:
        print('WARN', w)
    for e in errs:
        print('ERROR', e)
    if errs:
        sys.exit(1)
    js_path = os.path.join(tempfile.mkdtemp(), 'cases.json')
    json.dump(fit_payload(src, market, cases), open(js_path, 'w'), ensure_ascii=False, indent=1)
    fit = subprocess.run(['node', os.path.join(LESSONS, 'fitcheck.mjs'), js_path], capture_output=True, text=True, cwd=LESSONS)
    print(fit.stdout.strip().splitlines()[-1] if fit.stdout.strip() else fit.stderr.strip())
    if fit.returncode != 0:
        print(fit.stdout + fit.stderr)
        sys.exit(1)
    if out:
        s, n = sql(src, cases, market)
        open(out, 'w').write(s)
        print(f'wrote {out}: {n} cases, {len(s)//1024} KB')
