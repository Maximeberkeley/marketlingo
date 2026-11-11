# Small builders for the web3 case files. They produce the same dict shapes the other industries write by hand.

def call(situation, prompt, options, consequences, explanation, pro, mistake, model, sources=None):
    c = {
        'call': {
            'kind': 'theCall', 'situation': situation, 'prompt': prompt, 'options': list(options),
            'correctIndex': 0, 'consequences': list(consequences), 'explanation': explanation,
        },
        'pro': pro, 'mistake': mistake, 'model': model,
    }
    if sources:
        c['sources'] = list(sources)
    return c


def case(day, slot, title, lesson, headline, kicker, full, sources, evidence, numbers, career, invest, build, curiosity):
    return {
        'day': day, 'slot': slot, 'title': title, 'lessonTitle': lesson,
        'brief': {'headline': headline, 'kicker': kicker, 'fullText': full, 'sources': list(sources)},
        'evidence': evidence, 'numbers': numbers,
        'calls': {'career': career, 'invest': invest, 'build_startup': build, 'curiosity': curiosity},
    }


def spot(prompt, statements, fake, explanation):
    return {'kind': 'spotFake', 'prompt': prompt, 'statements': list(statements), 'fakeIndex': fake, 'explanation': explanation}


def chain(prompt, steps, explanation):
    return {'kind': 'buildChain', 'prompt': prompt, 'steps': list(steps), 'explanation': explanation}


def sort(prompt, buckets, items, explanation):
    return {'kind': 'sortSignal', 'prompt': prompt, 'buckets': list(buckets),
            'items': [{'text': t, 'bucket': b} for t, b in items], 'explanation': explanation}


def mc(prompt, options, correct, explanation):
    return {'kind': 'multipleChoice', 'prompt': prompt, 'options': list(options), 'correctIndex': correct, 'explanation': explanation}


def face(prompt, left, right, correct, explanation):
    return {'kind': 'faceOff', 'prompt': prompt, 'left': {'name': left[0], 'note': left[1]},
            'right': {'name': right[0], 'note': right[1]}, 'correctIndex': correct, 'explanation': explanation}


def num(prompt, lo, hi, value, unit, explanation):
    n = {'kind': 'numberSense', 'prompt': prompt, 'min': lo, 'max': hi, 'value': value, 'explanation': explanation}
    if unit:
        n['unit'] = unit
    return n
