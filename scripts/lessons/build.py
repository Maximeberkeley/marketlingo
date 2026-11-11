"""Build hand-written lessons (tag handwritten-v1) into an idempotent stacks + slides migration.

Each lesson file defines SRC (sources by key) and LESSONS (one dict per day; see spacetech/ for the shape).
One lesson per day becomes four stacks, one per learner goal: they share every card except the goal
card ("For your interview", "For investors", ...) and the Say-it section key.

Usage:
  python3 scripts/lessons/build.py spacetech scripts/lessons/spacetech/days_*.py \
      --out drizzle/migrations/0028_spacetech_handwritten_days_6_30.sql

Checks run first and stop the build on errors: syllabus facet per day, answer and option shape, sources on
every reading card, duplicate titles, dashes, number-slider traps. Then fitcheck.mjs replays the app's own
text limits (lesson-kit/text.ts) and fails if any field would be cut on screen.
"""
import importlib.util, json, re, sys, uuid, collections, os, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))

GOALS = ['career', 'invest', 'build_startup', 'curiosity']
LENS_EYEBROW = {'career': 'For your interview', 'invest': 'For investors', 'build_startup': 'For founders', 'curiosity': 'Why it matters'}
SECTION = {
    'definition': {'career': 'players', 'invest': 'watchlist', 'build_startup': 'money', 'curiosity': 'basics'},
    'money': {'career': 'how_money_moves', 'invest': 'drivers', 'build_startup': 'gap', 'curiosity': 'chain'},
    'power': {'career': 'questions', 'invest': 'thesis', 'build_startup': 'who_hurts', 'curiosity': 'players'},
    'numbers': {'career': 'numbers', 'invest': 'numbers', 'build_startup': 'why_now', 'curiosity': 'numbers'},
    'rules': {'career': 'risk', 'invest': 'risk', 'build_startup': 'incumbents', 'curiosity': 'rules'},
    'frontier': {'career': 'my_view', 'invest': 'review', 'build_startup': 'first_test', 'curiosity': 'frontier'},
}
FACET_ORDER = ['definition', 'money', 'power', 'numbers', 'rules', 'frontier']
NS = uuid.UUID('6f1c0f7e-3b8e-4a8a-9a55-0d3c2b1e7a10')
TAGS_TAIL = ['level:beginner', 'level:intermediate', 'level:advanced']


def load(paths):
    src, lessons = {}, []
    for i, path in enumerate(paths):
        spec = importlib.util.spec_from_file_location(f'lessons_{i}', path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        for k, v in mod.SRC.items():
            if k in src and src[k] != v:
                raise SystemExit(f'source key {k} defined twice with different values')
            src[k] = v
        lessons += mod.LESSONS
    return src, sorted(lessons, key=lambda l: l['day'])


def srcs(src, keys, where):
    out = []
    for k in keys:
        if k not in src:
            raise SystemExit(f'{where}: unknown source {k}')
        out.append(dict(src[k]))
    return out


def expand(src, L, market, goal):
    d = L['day']
    o = L['open']
    ex = [{'id': 'open', 'kind': 'coldOpen', 'kicker': o['kicker'], 'eyebrow': o['eyebrow'], 'headline': o['headline'],
           'fullText': o['fullText'], 'sources': srcs(src, o['sources'], f'd{d} open')}]
    for c in L['cards']:
        e = {k: v for k, v in c.items() if k != 'sources'}
        e['sources'] = srcs(src, c['sources'], f"d{d} {c['id']}")
        ex.append(e)
    for c in L['checks']:
        ex.append(dict(c))
    t, b, s = L['lenses'][goal]
    ex.append({'id': f'lens-{goal}', 'kind': 'info', 'title': t, 'body': b, 'eyebrow': LENS_EYEBROW[goal], 'sources': srcs(src, s, f'd{d} lens {goal}')})
    rt, rs = L['rule']
    ex.append({'id': 'rule', 'kind': 'microInsight', 'text': rt, 'eyebrow': 'The rule', 'sources': srcs(src, rs, f'd{d} rule')})
    ex.append({'id': 'say-it', 'kind': 'sayIt', 'takeaway': L['takeaway'], 'sectionKey': SECTION[L['facet']][goal]})
    return {'id': f'{market}-d{d}-{goal}', 'title': L['title'], 'exercises': ex}


def slides_for(lesson):
    out = []
    for e in lesson['exercises']:
        k = e['kind']
        if k == 'coldOpen':
            out.append((e['eyebrow'], f"{e['headline']} {e['fullText']}", e['sources']))
        elif k == 'microInsight':
            body = e['text'] + (f" {e['highlight']}" if e.get('highlight') else '')
            out.append((e.get('eyebrow') or 'Insight', body, e['sources']))
        elif k == 'info':
            body = e['body'] + ''.join(f' {b}' for b in e.get('bullets') or [])
            out.append((e['title'], body, e['sources']))
    return out


# ---------- checks ----------
EM = re.compile('[—–]')
BAD = re.compile(r'\b(delve|tapestry|leverage[sd]?|game[- ]changer|revolutioni[sz]e|crucial|seamless|cutting[- ]edge|unlock(s|ed)?)\b', re.I)


def check(src, lessons, market, existing_titles):
    errs, warns = [], []
    days = [l['day'] for l in lessons]
    if len(days) != len(set(days)):
        errs.append('duplicate days')
    titles = [l['title'] for l in lessons] + list(existing_titles)
    for t, n in collections.Counter(titles).items():
        if n > 1:
            errs.append(f'duplicate title: {t}')
    pos = collections.Counter()
    kinds_by_day = {}
    for L in lessons:
        d = L['day']
        want = FACET_ORDER[(d - 1) % 6]
        if L['facet'] != want:
            errs.append(f'd{d}: facet {L["facet"]} but syllabus says {want}')
        if set(L['lenses']) != set(GOALS):
            errs.append(f'd{d}: lenses missing goals')
        texts = [L['title'], L['open']['kicker'], L['open']['headline'], L['open']['fullText'], L['takeaway'], L['rule'][0]]
        for c in L['cards']:
            texts += [c.get('text', ''), c.get('highlight', ''), c.get('title', ''), c.get('body', '')] + list(c.get('bullets') or [])
            if not c.get('sources'):
                errs.append(f'd{d} {c["id"]}: no sources')
        for g, (t, b, s) in L['lenses'].items():
            texts += [t, b]
            if not s:
                errs.append(f'd{d} lens {g}: no sources')
        checks = L['checks']
        if not 2 <= len(checks) <= 3:
            errs.append(f'd{d}: {len(checks)} checks')
        kinds_by_day[d] = [c['kind'] for c in checks]
        for c in checks:
            k = c['kind']
            texts += [c.get('prompt', ''), c.get('explanation', ''), c.get('situation', '')]
            if k in ('multipleChoice', 'theCall'):
                opts = c['options']
                texts += opts + list(c.get('consequences') or [])
                ci = c['correctIndex']
                if not 0 <= ci < len(opts) or len(set(opts)) != len(opts):
                    errs.append(f'd{d} {c["id"]}: bad options/correctIndex')
                pos[ci] += 1
                lens_ = [len(x) for x in opts]
                if lens_[ci] == max(lens_) and lens_.count(max(lens_)) == 1 and max(lens_) - sorted(lens_)[-2] > 6:
                    warns.append(f'd{d} {c["id"]}: right answer is clearly the longest ({lens_})')
                if k == 'theCall' and len(c['consequences']) != len(opts):
                    errs.append(f'd{d} {c["id"]}: consequences/options mismatch')
            elif k == 'spotFake':
                texts += c['statements']
                if not 0 <= c['fakeIndex'] < len(c['statements']):
                    errs.append(f'd{d} fake index')
                pos[c['fakeIndex']] += 1
            elif k == 'faceOff':
                texts += [c['left']['name'], c['left'].get('note', ''), c['right']['name'], c['right'].get('note', '')]
                pos[c['correctIndex']] += 1
            elif k == 'numberSense':
                if not c['min'] < c['value'] < c['max']:
                    errs.append(f'd{d} numberSense value out of range')
                else:
                    at = (c['value'] - c['min']) / (c['max'] - c['min'])
                    if at <= c.get('tolerance', 0.12):
                        errs.append(f'd{d} numberSense: the untouched dial already counts as right ({at:.0%})')
                    if 0.47 <= at <= 0.53:
                        warns.append(f'd{d} numberSense: answer sits mid-range ({at:.0%}), easy to guess')
                    if c['value'] >= 1000 and (c.get('unit') or '') not in ('K', 'M', 'B'):
                        errs.append(f"d{d} numberSense: {c['value']} shows as {c['value']/1000:.1f}K on the dial; rescale the question")
                    if round(c['value'], 1) != c['value'] and abs(c['value']) < 1000:
                        warns.append(f'd{d} numberSense: decimal answer shows rounded to 0.1')
            elif k == 'sortSignal':
                texts += [i['text'] for i in c['items']] + c['buckets']
                used = {i['bucket'] for i in c['items']}
                if used != set(range(len(c['buckets']))):
                    errs.append(f'd{d} sort buckets unused')
            elif k == 'buildChain':
                texts += c['steps']
                if len(c['steps']) < 3:
                    errs.append(f'd{d} chain too short')
        for t in texts:
            if EM.search(t):
                errs.append(f'd{d}: dash in "{t[:60]}"')
            m = BAD.search(t)
            if m:
                warns.append(f'd{d}: word "{m.group(0)}" in "{t[:60]}"')
        words = sum(len(t.split()) for t in texts)
        if words < 180:
            warns.append(f'd{d}: short ({words} words)')
    for a, b in zip(sorted(kinds_by_day), sorted(kinds_by_day)[1:]):
        if kinds_by_day[a] == kinds_by_day[b]:
            warns.append(f'd{a}/d{b}: same check kinds {kinds_by_day[a]}')
    return errs, warns, pos


def q(s):
    if '$ml$' in s:
        raise SystemExit('dollar-quote tag inside text')
    return f'$ml${s}$ml$'


# The stacks table only accepts NEWS, HISTORY, LESSON, GAME, DRILL or SUMMARY as stack_type (its CHECK
# constraint), so hand-written lessons are 'LESSON' rows; the app finds them by the MICRO_LESSON tag.
STACK_TYPE = 'LESSON'


def stack_rows(src, lessons, market):
    """Every stack and its slides, as plain rows: the single source for the migration and the loader."""
    out = []
    for L in lessons:
        for g in GOALS:
            lesson = expand(src, L, market, g)
            sid = str(uuid.uuid5(NS, f'marketlingo:{market}:d{L["day"]}:{g}:handwritten-v1'))
            tags = ['MICRO_LESSON', f'day-{L["day"]}', 'month-1', 'handwritten-v1', f'goal:{g}'] + TAGS_TAIL
            slides = [{'id': str(uuid.uuid5(NS, f'{sid}:slide:{n}')), 'slide_number': n, 'title': title, 'body': body, 'sources': s}
                      for n, (title, body, s) in enumerate(slides_for(lesson), 1)]
            out.append({'id': sid, 'market_id': market, 'title': L['title'], 'stack_type': STACK_TYPE, 'tags': tags,
                        'duration_minutes': 5, 'authored_lesson': lesson, 'slides': slides})
    return out


def sql(src, lessons, market):
    rows, slide_rows, ids = [], [], []
    for r in stack_rows(src, lessons, market):
        sid = r['id']
        ids.append(sid)
        tag_sql = 'ARRAY[' + ', '.join(q(t) for t in r['tags']) + ']::text[]'
        rows.append(f"({q(sid)}::uuid, {q(market)}, {q(r['title'])}, '{r['stack_type']}', {tag_sql}, {r['duration_minutes']}, now(), '{{}}'::jsonb, {q(json.dumps(r['authored_lesson'], ensure_ascii=False))}::jsonb)")
        for sl in r['slides']:
            slide_rows.append(f"({q(sl['id'])}::uuid, {q(sid)}::uuid, {sl['slide_number']}, {q(sl['title'])}, {q(sl['body'])}, {q(json.dumps(sl['sources'], ensure_ascii=False))}::jsonb)")
    id_list = ', '.join(f"'{i}'::uuid" for i in ids)
    days = sorted(l['day'] for l in lessons)
    head = (f"-- Hand-written {market} lessons, days {days[0]}-{days[-1]} ({len(ids)} stacks: one per day and learner goal).\n"
            "-- Tagged handwritten-v1, so Days 1-30 pick them over older generated stacks (mobile/lib/handwritten.ts).\n"
            "-- Safe to run more than once: stacks upsert on id, and each stack's slides are replaced.\n"
            "-- Too large for Lovable to paste: the load-handwritten-lessons edge functions write these same rows\n"
            "-- (scripts/lessons/export_loader.py).\n")
    out = [head, 'BEGIN;\n',
           'INSERT INTO stacks (id, market_id, title, stack_type, tags, duration_minutes, published_at, metadata, authored_lesson) VALUES\n',
           ',\n'.join(rows),
           '\nON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, tags = EXCLUDED.tags, stack_type = EXCLUDED.stack_type,\n'
           '  authored_lesson = EXCLUDED.authored_lesson, duration_minutes = EXCLUDED.duration_minutes,\n'
           '  published_at = COALESCE(stacks.published_at, EXCLUDED.published_at);\n\n',
           f'DELETE FROM slides WHERE stack_id IN ({id_list});\n\n',
           'INSERT INTO slides (id, stack_id, slide_number, title, body, sources) VALUES\n',
           ',\n'.join(slide_rows), ';\n\nCOMMIT;\n']
    return ''.join(out), ids


if __name__ == '__main__':
    args = sys.argv[1:]
    out = args[args.index('--out') + 1] if '--out' in args else None
    js = args[args.index('--json') + 1] if '--json' in args else None
    market = args[0]
    paths = [a for a in args[1:] if not a.startswith('--') and a not in (out, js)]
    src, lessons = load(paths)
    titles_file = os.path.join(HERE, market, 'existing_titles.json')
    existing = json.load(open(titles_file)) if os.path.exists(titles_file) else []
    errs, warns, pos = check(src, lessons, market, existing)
    print(f'{len(lessons)} lessons, days {[l["day"] for l in lessons]}')
    print('answer positions:', dict(pos))
    for w in warns:
        print('WARN', w)
    for e in errs:
        print('ERROR', e)
    if errs:
        sys.exit(1)
    expanded = {str(l['day']): {g: expand(src, l, market, g) for g in GOALS} for l in lessons}
    js_path = js or os.path.join(tempfile.mkdtemp(), 'lessons.json')
    json.dump(expanded, open(js_path, 'w'), ensure_ascii=False, indent=1)
    fit = subprocess.run(['node', os.path.join(HERE, 'fitcheck.mjs'), js_path], capture_output=True, text=True)
    print(fit.stdout.strip().splitlines()[-1] if fit.stdout.strip() else fit.stderr.strip())
    if fit.returncode != 0:
        print(fit.stdout + fit.stderr)
        sys.exit(1)
    if out:
        s, ids = sql(src, lessons, market)
        open(out, 'w').write(s)
        print(f'wrote {out}: {len(ids)} stacks, {len(s)//1024} KB')
