import { getIndustryPack } from '../industry/packs';
import { drillSpotFake, drillTrueFalse, packChain, packFaceOff, packMap, packNumber, packSpeedRound, statColdOpen, statFaceOff, statLeoLine, statNumberSense, statTrend, trainerCall, } from '../industry/build';
import { makeBuildChain, makeChartRead, makeColdOpen, makeMapMarket, makeMicroInsight, makeNumberSense, makeRecall, makeSortSignal, makeSpeedRound, makeSpotFake, sentences, shuffle, } from './extract';
import { checkClaim, checkTamper, lessonCheckFactories } from './lessonChecks';
const rotate = (list) => shuffle(list);
function leoLine(pool, i) {
    if (!pool?.length)
        return undefined;
    return pool[i % pool.length];
}
export function buildBeats(stackTitle, slides, metadata, industry) {
    const pack = getIndustryPack(industry?.marketId);
    const marketLabel = pack?.label || industry?.marketName || 'your market';
    const trainerRows = industry?.trainer ?? [];
    const drills = industry?.drills ?? [];
    const stats = industry?.stats ?? [];
    // Leo speaks with real figures whenever the market has them.
    const statLines = shuffle(stats).map(statLeoLine);
    const exercises = [];
    const slideNumbers = [];
    const push = (ex, slideNumber, leo) => {
        if (!ex)
            return false;
        exercises.push(leo ? { ...ex, leo } : ex);
        slideNumbers.push(slideNumber);
        return true;
    };
    const firstSlide = slides[0]?.slideNumber ?? 1;
    const lastSlide = slides[slides.length - 1]?.slideNumber ?? firstSlide;
    const allTerms = slides.flatMap(s => s.keyTerms || []);
    const bodyPool = slides.map(s => sentences(s.body));
    // 1. Cold open — the day's own number, or the market's signature hook.
    const opened = push(makeColdOpen(slides, 'beat-open', pack ? pack.eyebrow : undefined) ||
        statColdOpen(stats, 'beat-open-stat', pack?.eyebrow), firstSlide, {
        line: statLines[0] || leoLine(pack?.leo.open, 0) || `Two minutes inside ${marketLabel}. Let's go.`,
        mood: 'idle',
    });
    if (!opened && pack) {
        push({
            kind: 'coldOpen',
            id: 'beat-open-pack',
            eyebrow: pack.eyebrow,
            headline: pack.coldOpen.headline,
            kicker: pack.coldOpen.kicker,
        }, firstSlide, { line: leoLine(pack.leo.open, 0), mood: 'idle' });
    }
    // 2. Games — industry-specific first, slide-derived as backup.
    const industryFactories = pack
        ? rotate([
            () => packMap(pack, `ind-map-${exercises.length}`),
            () => packFaceOff(pack, `ind-face-${exercises.length}`),
            () => packChain(pack, `ind-chain-${exercises.length}`),
            () => packNumber(pack, `ind-num-${exercises.length}`),
            () => packSpeedRound(pack, `ind-speed-${exercises.length}`),
        ])
        : [];
    if (stats.length >= 1) {
        industryFactories.unshift(() => statNumberSense(stats, `stat-num-${exercises.length}`));
        industryFactories.push(() => statTrend(stats, `stat-trend-${exercises.length}`));
    }
    if (stats.length >= 2) {
        industryFactories.push(() => statFaceOff(stats, `stat-face-${exercises.length}`));
    }
    if (drills.length >= 3) {
        industryFactories.push(() => drillSpotFake(drills, `ind-fake-${exercises.length}`, `One of these ${marketLabel} facts is false. Which one?`));
        industryFactories.push(() => drillTrueFalse(drills, `ind-tf-${exercises.length}`));
    }
    const slideFactories = rotate([
        () => makeMapMarket(allTerms, `beat-map-${exercises.length}`),
        () => makeSpeedRound(allTerms, `beat-speed-${exercises.length}`),
        () => makeSortSignal(slides, `beat-sort-${exercises.length}`),
        () => makeNumberSense(slides, `beat-num-${exercises.length}`),
        (slideIdx) => makeBuildChain(sentences(slides[slideIdx]?.body || '', 20, 90), `beat-chain-${exercises.length}`, `Order the steps behind "${slides[slideIdx]?.title ?? stackTitle}"`),
        () => makeChartRead(slides, `beat-chart-${exercises.length}`),
    ]);
    // Checks built from THIS lesson's own figures, definitions, mechanism and
    // claims. These come first: the check must test the lesson.
    let checkSeq = 0;
    const checkFactories = lessonCheckFactories(slides, allTerms, () => `beat-check-${(checkSeq += 1)}`);
    // No learner should meet the same question twice in one lesson: each factory
    // is spent after it produces a beat, and identical prompts are rejected.
    const spentChecks = new Set();
    const spentSlideGames = new Set();
    const spentIndustry = new Set();
    const seenPrompts = new Set();
    const signature = (ex) => {
        const text = ex.prompt || ex.situation || ex.text || '';
        return `${ex.kind}|${String(text).toLowerCase().slice(0, 90)}`;
    };
    const take = (built) => {
        if (!built)
            return null;
        const key = signature(built);
        if (seenPrompts.has(key))
            return null;
        seenPrompts.add(key);
        return built;
    };
    const nextGame = (slideIdx) => {
        // 1. The lesson's own material — a question only a reader can answer.
        for (let i = 0; i < checkFactories.length; i++) {
            if (spentChecks.has(i))
                continue;
            const built = take(checkFactories[i]());
            spentChecks.add(i);
            if (built)
                return built;
        }
        // 2. Slide-derived play (sorting, chains, charts) — still this lesson.
        for (let i = 0; i < slideFactories.length; i++) {
            if (spentSlideGames.has(i))
                continue;
            const built = take(slideFactories[i](slideIdx));
            spentSlideGames.add(i);
            if (built)
                return built;
        }
        // 3. Market-wide material — only when the lesson can't support a question.
        for (let i = 0; i < industryFactories.length; i++) {
            if (spentIndustry.has(i))
                continue;
            const built = take(industryFactories[i]());
            spentIndustry.add(i);
            if (built)
                return built;
        }
        const others = bodyPool.filter((_, i) => i !== slideIdx).flat();
        return slides[slideIdx] ? take(makeRecall(slides[slideIdx], others, `beat-recall-${exercises.length}`)) : null;
    };
    // 3. Alternate insight → game across the slides.
    let gameCount = 0;
    slides.forEach((slide, slideIdx) => {
        push(makeMicroInsight(slide, `beat-insight-${slide.slideNumber}`, slide.title), slide.slideNumber, {
            line: undefined,
            mood: 'idle',
        });
        const isLast = slideIdx === slides.length - 1;
        if (!isLast || slides.length === 1) {
            const added = push(nextGame(slideIdx), slide.slideNumber, {
                line: statLines.length
                    ? statLines[gameCount % statLines.length]
                    : leoLine(pack?.leo.game, gameCount),
                mood: 'thinking',
            });
            if (added)
                gameCount += 1;
        }
    });
    // 4. Boss beat — the lesson's own claim under pressure first, then a real
    // scenario from this market as backup. Never a repeat of an earlier beat.
    const boss = take(checkClaim(slides, 'beat-boss-claim')) ||
        take(checkTamper(slides, 'beat-boss-tamper')) ||
        take(trainerCall(shuffle(trainerRows)[0], 'beat-boss-call')) ||
        take(drillSpotFake(drills, 'beat-boss-fake', `One of these ${marketLabel} facts is false. Which one?`)) ||
        take(makeSpotFake(slides, 'beat-boss'));
    push(boss, lastSlide, {
        line: pack?.leo.boss || `Your call. Read it the way an insider in ${marketLabel} would.`,
        mood: 'thinking',
    });
    // 5. Takeaway, plus a cliffhanger for tomorrow.
    const takeaway = (metadata?.key_takeaway || '').trim();
    if (takeaway.length >= 12) {
        push({
            kind: 'microInsight',
            id: 'beat-takeaway',
            eyebrow: 'Lock it in',
            text: takeaway,
            highlight: metadata?.next_preview?.trim() ? `Tomorrow: ${metadata.next_preview.trim()}` : undefined,
            fullText: [metadata?.recap_bridge, metadata?.key_takeaway, metadata?.next_preview]
                .filter((value) => Boolean(value?.trim()))
                .map(value => value.trim())
                .join('\n\n'),
            detailTitle: 'What to remember',
        }, lastSlide, { line: pack?.leo.takeaway, mood: 'celebrate' });
    }
    return {
        lesson: {
            id: stackTitle,
            title: stackTitle,
            exercises,
            leoReactions: {
                win: ['That is exactly how an insider reads it.', 'Clean. You are building real instinct.', 'Yes — you followed the money.'],
                miss: ['Not it, but now you know where to look.', 'Close. Re-read who carries the risk.', 'Wrong turn — this is the one people get wrong.'],
            },
        },
        slideNumbers,
    };
}
