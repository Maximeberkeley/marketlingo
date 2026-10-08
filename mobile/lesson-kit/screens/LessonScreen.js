import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, Animated, Easing, AccessibilityInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LessonHeader } from '../components/LessonHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { FeedbackFooter } from '../components/FeedbackFooter';
import { InfoCard } from '../exercises/InfoCard';
import { MultipleChoice } from '../exercises/MultipleChoice';
import { WordBank } from '../exercises/WordBank';
import { ColdOpen } from '../modules/ColdOpen';
import { MicroInsight } from '../modules/MicroInsight';
import { SortSignal } from '../modules/SortSignal';
import { BuildChain } from '../modules/BuildChain';
import { FaceOff } from '../modules/FaceOff';
import { SpeedRound } from '../modules/SpeedRound';
import { NumberSense } from '../modules/NumberSense';
import { SpotTheFake } from '../modules/SpotTheFake';
import { MapMarket } from '../modules/MapMarket';
import { ChartRead } from '../modules/ChartRead';
import { TheCall } from '../modules/TheCall';
import { SayIt } from '../modules/SayIt';
import { LessonComplete } from './LessonComplete';
import { tokens } from '../theme/tokens';
import { playSound } from '../../lib/sounds';
import { getMarketWorld } from '../../data/marketWorlds';
import { AskLeoOverlay } from '../../components/ai/AskLeoOverlay';
import { normalizedCopy } from '../cardPresentation';
/** Flatten the current beat's visible text into a context string for Leo. */
function exerciseContext(exercise) {
    if (!exercise)
        return '';
    const e = exercise;
    const parts = [];
    for (const key of ['title', 'headline', 'prompt', 'text', 'body', 'question']) {
        const v = e[key];
        if (typeof v === 'string' && v.trim())
            parts.push(v.trim());
    }
    return parts.join('\n');
}
const MAX_HEARTS = 3;
/** Beats that need no answer — the button just says Continue. */
const PASSIVE_KINDS = ['info', 'coldOpen', 'microInsight', 'sayIt'];
const isPassiveKind = (kind) => PASSIVE_KINDS.includes(kind);
export function LessonScreen({ lesson, onExit, onFinish, xpPerCorrect = 10, renderExtraActions, doneLabel, streakDays, confirmExit = true, marketId, onSaveLeoAnswer, }) {
    const insets = useSafeAreaInsets();
    const [queue, setQueue] = useState(lesson.exercises);
    const [cardSpace, setCardSpace] = useState(0);
    const [measuredCard, setMeasuredCard] = useState(null);
    const [index, setIndex] = useState(0);
    const [maxIndexReached, setMaxIndexReached] = useState(0);
    const [phase, setPhase] = useState('answering');
    const [state, setState] = useState({ canCheck: false, isCorrect: false });
    const [correctCount, setCorrectCount] = useState(0);
    const [gradedCount, setGradedCount] = useState(0);
    const [combo, setCombo] = useState(0);
    const [bestCombo, setBestCombo] = useState(0);
    const livesEnabled = typeof lesson.lives === 'number';
    const [hearts, setHearts] = useState(lesson.lives ?? MAX_HEARTS);
    const [missed, setMissed] = useState([]);
    /** Per-beat outcome (exercise id -> was correct) so back/forward navigation
     *  restores the real previous result instead of resetting the card. */
    const [results, setResults] = useState({});
    const [showExitPrompt, setShowExitPrompt] = useState(false);
    const [showHeartsPrompt, setShowHeartsPrompt] = useState(false);
    const [showAskLeo, setShowAskLeo] = useState(false);
    const [leoMessages, setLeoMessages] = useState([]);
    const [leoAutoAsk, setLeoAutoAsk] = useState(null);
    const [showActions, setShowActions] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);
    const enter = useRef(new Animated.Value(1)).current;
    const scrollRef = useRef(null);
    const [finished, setFinished] = useState(false);
    const startedAt = useRef(Date.now());
    const world = getMarketWorld(marketId);
    // XP pop animation
    const [pop, setPop] = useState(null);
    const popAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        setQueue(lesson.exercises);
        setMeasuredCard(null);
        setIndex(0);
        setPhase('answering');
        setState({ canCheck: false, isCorrect: false });
        setCorrectCount(0);
        setGradedCount(0);
        setCombo(0);
        setBestCombo(0);
        setHearts(lesson.lives ?? MAX_HEARTS);
        setMissed([]);
        setResults({});
        setShowExitPrompt(false);
        setShowHeartsPrompt(false);
        setFinished(false);
        startedAt.current = Date.now();
        setLeoMessages([]);
        setLeoAutoAsk(null);
        setShowActions(false);
    }, [lesson.id]);
    useEffect(() => {
        let active = true;
        AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active)
            setReduceMotion(value); }).catch(() => { });
        const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
        return () => { active = false; subscription.remove(); };
    }, []);
    useEffect(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
        setShowActions(false);
        enter.setValue(reduceMotion ? 1 : 0);
        const animation = Animated.timing(enter, {
            toValue: 1, duration: reduceMotion ? 0 : 180,
            easing: Easing.out(Easing.quad), useNativeDriver: true,
        });
        animation.start();
        return () => animation.stop();
    }, [index, lesson.id, reduceMotion, enter]);
    const exercise = queue[index];
    const combined = exercise?.kind === 'microInsight' && Boolean(exercise.mergedCards?.length);
    const combinedFits = measuredCard?.id === exercise?.id && cardSpace > 0 && measuredCard.height <= cardSpace;
    useEffect(() => {
        if (!combined || !exercise || measuredCard?.id !== exercise.id || cardSpace <= 0 || measuredCard.height <= cardSpace)
            return;
        // Native layout includes real text wrapping, font scaling, panels and controls.
        // Restore both originals before showing an overflowing combined card.
        setQueue(current => {
            const position = current.findIndex(card => card.id === exercise.id);
            if (position < 0)
                return current;
            return [...current.slice(0, position), ...(exercise.kind === 'microInsight' ? exercise.mergedCards || [exercise] : [exercise]), ...current.slice(position + 1)];
        });
        setMeasuredCard(null);
    }, [combined, exercise, measuredCard, cardSpace]);
    const sourceIndex = lesson.exercises.findIndex(card => card.id === exercise?.id ||
        (card.kind === 'microInsight' && card.mergedCards?.some(original => original.id === exercise?.id)));
    const actionIndex = sourceIndex >= 0 ? sourceIndex : index;
    const isInfo = isPassiveKind(exercise?.kind);
    const total = queue.length;
    const progress = total > 0 ? (index + (phase === 'feedback' ? 1 : 0)) / total : 0;
    const handleChange = useCallback((next) => setState(next), []);
    /** Opens the chat, optionally with a question Leo answers straight away. */
    const openLeo = useCallback((question) => {
        setLeoAutoAsk(question ?? null);
        setShowActions(false);
        setShowAskLeo(true);
    }, []);
    const firePop = useCallback((label) => {
        setPop(label);
        popAnim.setValue(0);
        Animated.timing(popAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start(() => setPop(null));
    }, [popAnim]);
    /** Moves to a beat, restoring its real previous state: graded cards show
     *  their original feedback (no re-answering, no double scoring), fresh or
     *  passive cards start clean. */
    const goToBeat = useCallback((target) => {
        const beat = queue[target];
        setIndex(target);
        setShowActions(false);
        const graded = beat && !isPassiveKind(beat.kind) ? results[beat.id] : undefined;
        if (graded !== undefined) {
            setPhase('feedback');
            setState({ canCheck: true, isCorrect: graded });
        }
        else {
            setPhase('answering');
            setState({ canCheck: false, isCorrect: false });
        }
    }, [queue, results]);
    const goNext = useCallback(() => {
        if (index >= total - 1) {
            playSound('lessonComplete').catch(() => { });
            setFinished(true);
            return;
        }
        setMaxIndexReached(prev => Math.max(prev, index + 1));
        goToBeat(index + 1);
    }, [index, total, goToBeat]);
    const continueLesson = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        goNext();
    }, [goNext]);
    const onAction = useCallback(() => {
        if (isInfo) {
            continueLesson();
            return;
        }
        if (phase === 'answering') {
            if (!state.canCheck)
                return;
            if (exercise)
                setResults(r => ({ ...r, [exercise.id]: state.isCorrect }));
            if (index >= maxIndexReached) {
                setGradedCount(c => c + 1);
                if (state.isCorrect) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
                    playSound('correct').catch(() => { });
                    setCorrectCount(c => c + 1);
                    const nextCombo = combo + 1;
                    setCombo(nextCombo);
                    setBestCombo(previous => Math.max(previous, nextCombo));
                    firePop(`+${xpPerCorrect} XP`);
                }
                else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
                    playSound('wrong').catch(() => { });
                    setCombo(0);
                    setMissed(m => (exercise ? [...m, exercise] : m));
                    if (livesEnabled) {
                        const nextHearts = Math.max(0, hearts - 1);
                        setHearts(nextHearts);
                        if (nextHearts === 0)
                            setShowHeartsPrompt(true);
                    }
                }
            }
            setPhase('feedback');
            return;
        }
        continueLesson();
    }, [isInfo, phase, state, continueLesson, exercise, xpPerCorrect, firePop, combo, hearts, livesEnabled, index, maxIndexReached]);
    const retryMissed = useCallback(() => {
        setShowHeartsPrompt(false);
        setHearts(lesson.lives ?? MAX_HEARTS);
        if (!missed.length)
            return;
        const retryItems = missed.map((e, i) => ({ ...e, id: `${e.id}-retry${i}` }));
        setMissed([]);
        setQueue(q => {
            const next = [...q];
            next.splice(index + 1, 0, ...retryItems);
            return next;
        });
    }, [missed, index]);
    const handleExitPress = useCallback(() => {
        if (!confirmExit || finished) {
            onExit();
            return;
        }
        setShowExitPrompt(true);
    }, [confirmExit, finished, onExit]);
    /** The feedback explanation already quotes the correct sentence; don't print it twice. */
    const feedbackExplanation = exercise && 'explanation' in exercise ? normalizedCopy(exercise.explanation || '') : '';
    const answerCopy = exercise && exercise.kind === 'multipleChoice' ? normalizedCopy(exercise.options[exercise.correctIndex] || '') : '';
    const repeatsAnswer = Boolean(answerCopy && feedbackExplanation.includes(answerCopy));
    const correctAnswerText = useMemo(() => {
        if (!exercise)
            return undefined;
        if (exercise.kind === 'multipleChoice')
            return exercise.options[exercise.correctIndex];
        if (exercise.kind === 'wordBank')
            return exercise.answer.join(' ');
        if (exercise.kind === 'theCall')
            return exercise.options[exercise.correctIndex];
        if (exercise.kind === 'faceOff')
            return exercise.correctIndex === 0 ? exercise.left.name : exercise.right.name;
        if (exercise.kind === 'spotFake')
            return exercise.statements[exercise.fakeIndex];
        if (exercise.kind === 'mapMarket')
            return exercise.nodes[exercise.correctIndex]?.label;
        return undefined;
    }, [exercise]);
    if (finished || !exercise) {
        const timeSpentSeconds = Math.round((Date.now() - startedAt.current) / 1000);
        return (<LessonComplete correct={correctCount} total={gradedCount} baseXp={correctCount * xpPerCorrect} bestCombo={bestCombo} heartsLeft={livesEnabled ? hearts : undefined} timeSpentSeconds={timeSpentSeconds} streakDays={streakDays} doneLabel={doneLabel} marketId={marketId} leoQuestions={leoMessages.filter(m => m.role === 'user').length} onDone={xp => onFinish({
                correct: correctCount,
                total: gradedCount,
                xp,
                timeSpentSeconds,
            })}/>);
    }
    const buttonVariant = combined && !combinedFits ? 'disabled' : phase === 'feedback' || isInfo || state.canCheck ? 'primary' : 'disabled';
    const buttonLabel = isInfo ? 'Continue' : phase === 'answering' ? 'Check' : 'Continue';
    return (<View style={[styles.root, { paddingTop: insets.top }]}>
      <LessonHeader progress={progress} onExit={handleExitPress} onAskLeo={() => openLeo()} onMore={renderExtraActions ? () => setShowActions(value => !value) : undefined} menuOpen={showActions}/>

      {!!pop && (<Animated.View key={exercise.id} pointerEvents="none" style={[
                styles.pop,
                {
                    opacity: popAnim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                    transform: [
                        { translateY: popAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -46] }) },
                    ],
                },
            ]}>
          <Text style={styles.popText}>{pop}</Text>
        </Animated.View>)}

      <ScrollView ref={scrollRef} style={styles.scroll} onLayout={event => setCardSpace(Math.max(0, event.nativeEvent.layout.height - 48))} contentContainerStyle={[styles.content, exercise.kind === 'coldOpen' && styles.coverContent]} keyboardShouldPersistTaps="handled">
        {exercise.kind !== 'coldOpen' && <View style={styles.upperSpace}/>}
        <Animated.View onLayout={event => { if (combined)
        setMeasuredCard({ id: exercise.id, height: event.nativeEvent.layout.height }); }} style={[styles.beat, exercise.kind === 'coldOpen' && styles.fullBleed, { opacity: combined && !combinedFits ? 0 : enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
          {exercise.kind === 'sayIt'
            ? <SayIt key={exercise.id} exercise={exercise} marketId={marketId} onDone={continueLesson}/>
            : renderExercise(exercise, phase, handleChange)}
        </Animated.View>
        {exercise.kind !== 'coldOpen' && <View style={styles.lowerSpace}/>}
      </ScrollView>


      {phase === 'feedback' && !isInfo && (<FeedbackFooter key={exercise.id} isCorrect={state.isCorrect} explanation={'explanation' in exercise ? exercise.explanation : undefined} correctAnswer={state.isCorrect || repeatsAnswer ? undefined : correctAnswerText}/>)}

      {exercise.kind === 'sayIt' ? (<View style={{ height: insets.bottom + tokens.space.lg }}/>) : (<View style={[styles.footer, { paddingBottom: insets.bottom + tokens.space.lg }]}>
          <PrimaryButton label={buttonLabel} onPress={onAction} variant={buttonVariant}/>
        </View>)}

      <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
        <View style={styles.menuLayer}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowActions(false)} accessibilityRole="button" accessibilityLabel="Dismiss lesson actions"/>
          <View style={[styles.actionsMenu, { marginTop: insets.top + 64 }]}>
            {renderExtraActions?.(actionIndex, () => setShowActions(false), exercise)}
          </View>
        </View>
      </Modal>

      {/* Leave confirmation — loss aversion */}
      <Modal visible={showExitPrompt} transparent animationType="fade" onRequestClose={() => setShowExitPrompt(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Leave now?</Text>
            <Text style={styles.sheetBody}>
              You'll lose your progress in this lesson{typeof streakDays === 'number' && streakDays > 0
            ? ` and put your ${streakDays}-day streak at risk`
            : ''}.
            </Text>
            <PrimaryButton label="Keep learning" onPress={() => setShowExitPrompt(false)}/>
            <TouchableOpacity onPress={() => { setShowExitPrompt(false); onExit(); }} style={styles.ghost}>
              <Text style={styles.ghostText}>Leave anyway</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Out of hearts — offer a retry instead of ending the lesson */}
      <Modal visible={livesEnabled && showHeartsPrompt} transparent animationType="fade" onRequestClose={() => setShowHeartsPrompt(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Out of hearts</Text>
            <Text style={styles.sheetBody}>
              No problem — nothing is locked. Redo the questions you missed to lock the ideas in.
            </Text>
            <PrimaryButton label="Retry what I missed" onPress={retryMissed}/>
            <TouchableOpacity onPress={() => { setShowHeartsPrompt(false); setHearts(lesson.lives ?? MAX_HEARTS); }} style={styles.ghost}>
              <Text style={styles.ghostText}>Keep going</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Ask Leo — mid-lesson questions */}
      <AskLeoOverlay visible={showAskLeo} onClose={() => { setShowAskLeo(false); setLeoAutoAsk(null); }} lessonContext={`Lesson: ${lesson.title}\nWorld: ${world.worldName}\nCurrent beat: ${exerciseContext(exercise)}`} contextLabel={exerciseContext(exercise).split('\n')[0] || lesson.title} accentColor={world.colors[0]} messages={leoMessages} onMessagesChange={setLeoMessages} autoAsk={leoAutoAsk} onSaveAnswer={onSaveLeoAnswer ? text => onSaveLeoAnswer(text, actionIndex, exercise) : undefined}/>
    </View>);
}
function renderExercise(exercise, phase, onChange) {
    switch (exercise.kind) {
        case 'info':
            return <InfoCard exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'multipleChoice':
            return <MultipleChoice exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'wordBank':
            return <WordBank exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'coldOpen':
            return <ColdOpen exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'microInsight':
            return <MicroInsight exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'sortSignal':
            return <SortSignal exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'buildChain':
            return <BuildChain exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'faceOff':
            return <FaceOff exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'speedRound':
            return <SpeedRound exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'numberSense':
            return <NumberSense exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'spotFake':
            return <SpotTheFake exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'mapMarket':
            return <MapMarket exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'chartRead':
            return <ChartRead exercise={exercise} phase={phase} onChange={onChange}/>;
        case 'theCall':
            return <TheCall exercise={exercise} phase={phase} onChange={onChange}/>;
        default:
            return null;
    }
}
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.color.bg },
    beat: { width: '100%', alignSelf: 'stretch', flexShrink: 0 },
    upperSpace: { flexGrow: 0.42, flexBasis: 0 },
    lowerSpace: { flexGrow: 0.58, flexBasis: 0 },
    fullBleed: { flexGrow: 1 },
    coverContent: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, gap: 0 },
    menuLayer: { flex: 1 },
    actionsMenu: { alignSelf: 'flex-end', marginRight: tokens.space.lg, minWidth: 176, maxWidth: '90%', padding: tokens.space.sm, backgroundColor: tokens.color.card, borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.sm },
    scroll: { flex: 1, width: '100%' },
    content: {
        width: '100%',
        alignItems: 'stretch',
        paddingHorizontal: tokens.space.lg,
        paddingTop: 24,
        paddingBottom: 24,
        flexGrow: 1,
        justifyContent: 'flex-start',
    },
    pop: {
        position: 'absolute',
        top: 64,
        alignSelf: 'center',
        zIndex: 30,
    },
    popText: {
        fontSize: tokens.font.body,
        fontWeight: '900',
        color: tokens.color.correctDark,
    },
    footer: {
        paddingHorizontal: tokens.space.lg,
        paddingTop: tokens.space.md,
        gap: tokens.space.md,
        backgroundColor: tokens.color.bg,
    },
    backdrop: {
        flex: 1,
        backgroundColor: tokens.color.scrim,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: tokens.color.card,
        borderTopLeftRadius: tokens.radius.xl,
        borderTopRightRadius: tokens.radius.xl,
        padding: tokens.space.xl,
        paddingBottom: tokens.space.xxl,
        gap: tokens.space.md,
    },
    sheetTitle: { fontSize: tokens.font.prompt, fontWeight: '800', color: tokens.color.text },
    sheetBody: { fontSize: tokens.font.body, lineHeight: 24, color: tokens.color.textSecondary },
    ghost: { alignItems: 'center', paddingVertical: tokens.space.md },
    ghostText: { fontSize: tokens.font.body, fontWeight: '700', color: tokens.color.textMuted },
});
