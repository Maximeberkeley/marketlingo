"""Shared builders for the robotics case files: each returns the plain dicts build.py reads."""


def call(situation, prompt, options, consequences, explanation, pro, mistake, model, sources=None):
    out = {
        'call': {
            'kind': 'theCall', 'situation': situation, 'prompt': prompt, 'options': options, 'correctIndex': 0,
            'consequences': consequences, 'explanation': explanation,
        },
        'pro': pro, 'mistake': mistake, 'model': model,
    }
    if sources:
        out['sources'] = sources
    return out


def mc(prompt, options, ci, explanation):
    return {'kind': 'multipleChoice', 'prompt': prompt, 'options': options, 'correctIndex': ci, 'explanation': explanation}


def fake(prompt, statements, fi, explanation):
    return {'kind': 'spotFake', 'prompt': prompt, 'statements': statements, 'fakeIndex': fi, 'explanation': explanation}


def sort(prompt, buckets, items, explanation):
    return {'kind': 'sortSignal', 'prompt': prompt, 'buckets': buckets,
            'items': [{'text': t, 'bucket': b} for t, b in items], 'explanation': explanation}


def chain(prompt, steps, explanation):
    return {'kind': 'buildChain', 'prompt': prompt, 'steps': steps, 'explanation': explanation}


def face(prompt, left, right, ci, explanation):
    return {'kind': 'faceOff', 'prompt': prompt, 'left': {'name': left[0], 'note': left[1]},
            'right': {'name': right[0], 'note': right[1]}, 'correctIndex': ci, 'explanation': explanation}


def num(prompt, lo, hi, value, unit, explanation):
    return {'kind': 'numberSense', 'prompt': prompt, 'min': lo, 'max': hi, 'value': value, 'unit': unit, 'explanation': explanation}


def case(day, slot, title, lesson, headline, kicker, full, sources, evidence, numbers, career, invest, build, curiosity):
    return {
        'day': day, 'slot': slot, 'title': title, 'lessonTitle': lesson,
        'brief': {'headline': headline, 'kicker': kicker, 'fullText': full, 'sources': sources},
        'evidence': evidence, 'numbers': numbers,
        'calls': {'career': career, 'invest': invest, 'build_startup': build, 'curiosity': curiosity},
    }
