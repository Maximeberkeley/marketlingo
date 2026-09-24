import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../../lib/constants';
import { saveDemoMarket, saveDemoXP } from '../../lib/demoXPBridge';
import { storage } from '../../lib/storage';
import { triggerCelebration, triggerHaptic } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';
import { ConfettiBurst } from '../ui/ConfettiBurst';
const TOKENS = [
    { word: 'torque', chance: '92%', correct: true },
    { word: 'music', chance: '5%', correct: false },
    { word: 'engine', chance: '1%', correct: false },
];
const QUIZ_OPTIONS = [
    'It plans an outline of the conclusion before writing word one.',
    'It calculates backwards from the final answer to the prompt.',
    'It has zero idea how the sentence ends until it generates the final word.',
    'It selects a complete pre-written answer from memory.',
];
export function DemoLesson({ onComplete, onSkip }) {
    const insets = useSafeAreaInsets();
    const [stage, setStage] = useState(0);
    const [token, setToken] = useState(null);
    const [attentionRevealed, setAttentionRevealed] = useState(false);
    const [wrongAnswer, setWrongAnswer] = useState(null);
    const [correct, setCorrect] = useState(false);
    const [rewardSaved, setRewardSaved] = useState(false);
    const content = useRef(new Animated.Value(1)).current;
    const shake = useRef(new Animated.Value(0)).current;
    const attention = useRef(new Animated.Value(0)).current;
    useEffect(() => { void saveDemoMarket('ai'); }, []);
    const moveTo = (next) => {
        content.setValue(0);
        setStage(next);
        Animated.timing(content, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    };
    const revealAttention = () => {
        if (attentionRevealed)
            return;
        setAttentionRevealed(true);
        void triggerHaptic('selection');
        void playSound('tap');
        Animated.spring(attention, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
    };
    const answerQuiz = (index) => {
        if (correct)
            return;
        if (index !== 2) {
            setWrongAnswer(index);
            void triggerHaptic('warning');
            void playSound('wrong');
            shake.setValue(0);
            Animated.sequence([
                Animated.timing(shake, { toValue: 8, duration: 55, useNativeDriver: true }),
                Animated.timing(shake, { toValue: -8, duration: 55, useNativeDriver: true }),
                Animated.timing(shake, { toValue: 5, duration: 55, useNativeDriver: true }),
                Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
            ]).start();
            return;
        }
        setWrongAnswer(null);
        setCorrect(true);
        void triggerCelebration();
        void playSound('celebration');
    };
    const finishQuiz = async () => {
        if (!rewardSaved) {
            await Promise.all([saveDemoXP(20), storage.setDemoStatus('completed')]);
            setRewardSaved(true);
        }
        moveTo(3);
    };
    const skip = async () => {
        await storage.setDemoStatus('skipped');
        onSkip();
    };
    const activeStep = Math.min(stage, 2);
    return (<View style={[styles.screen, { paddingTop: insets.top + 6 }]}> 
      <ConfettiBurst show={correct || stage === 3} count={30}/>
      <View style={styles.topBar}>
        <View style={styles.progressWrap} accessibilityLabel={`Demo step ${activeStep + 1} of 3`}>
          {['Step 1', 'Step 2', 'Quiz'].map((label, index) => (<View key={label} style={styles.progressItem}>
              <View style={[styles.progressTrack, index <= activeStep && styles.progressTrackActive]}/>
              <Text style={[styles.progressLabel, index === activeStep && styles.progressLabelActive]}>{label}</Text>
            </View>))}
        </View>
        {stage < 3 && (<TouchableOpacity style={styles.skipButton} onPress={skip} accessibilityRole="button" accessibilityLabel="Skip demo lesson">
            <Text style={styles.skipText}>Skip</Text>
            <Feather name="x" size={16} color={COLORS.textSecondary}/>
          </TouchableOpacity>)}
      </View>

      <Animated.View style={[styles.flex, {
                opacity: content,
                transform: [{ translateY: content.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            }]}> 
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
          {stage === 0 && (<View>
              <Tag>HOW AI ACTUALLY WORKS</Tag>
              <Text style={styles.eyebrow}>THE NEXT-TOKEN MACHINE · CONCEPT 1/3</Text>
              <Text style={styles.title}>What is an LLM doing right now?</Text>
              <Image source={require('../../assets/mascot/leo_AImachinelearning.png')} style={styles.heroLeo} resizeMode="contain"/>
              <View style={styles.promptCard}>
                <Text style={styles.promptLead}>Predict the next word</Text>
                <Text style={styles.sentence}>“The best thing about an electric car is the instant…”</Text>
                <View style={styles.chips}>
                  {TOKENS.map((item) => {
                const selected = token === item.word;
                return (<TouchableOpacity key={item.word} style={[styles.wordChip, selected && styles.wordChipSelected]} onPress={() => { setToken(item.word); void triggerHaptic('selection'); void playSound('tap'); }} accessibilityRole="button" accessibilityState={{ selected }}>
                        <Text style={[styles.word, selected && styles.wordSelected]}>{item.word}</Text>
                        <Text style={[styles.chance, selected && styles.chanceSelected]}>{item.chance}</Text>
                      </TouchableOpacity>);
            })}
                </View>
              </View>
              {token && (<Takeaway icon="cpu">
                  AI models are not searching Google or databases. They are massive mathematical prediction engines calculating the single most likely next word fragment.
                </Takeaway>)}
              <Primary label="Continue" disabled={!token} onPress={() => moveTo(1)}/>
            </View>)}

          {stage === 1 && (<View>
              <Tag>THE SECRET SAUCE</Tag>
              <Text style={styles.eyebrow}>THE ATTENTION SPARK · CONCEPT 2/3</Text>
              <Text style={styles.title}>How does it understand context?</Text>
              <View style={styles.attentionCard}>
                <View style={styles.sentenceLine}>
                  <View style={styles.anchorWord}><Text style={styles.sentenceWordStrong}>trophy</Text></View>
                  <Text style={styles.sentenceText}>The </Text>
                </View>
                <Text style={styles.contextSentence}>
                  The <Text style={styles.sentenceWordStrong}>trophy</Text> didn't fit in the suitcase because{' '}
                  <Text style={styles.itWord} onPress={revealAttention}>IT</Text> was too big.
                </Text>
                <View style={styles.connectionArea} pointerEvents="none">
                  <Animated.View style={[styles.connectionLine, {
                    opacity: attention,
                    transform: [{ scaleX: attention }],
                }]}/>
                  <Animated.View style={[styles.spark, { opacity: attention }]}/>
                </View>
                <TouchableOpacity style={styles.tapIt} onPress={revealAttention}>
                  <Feather name={attentionRevealed ? 'link-2' : 'mouse-pointer'} size={16} color={COLORS.accent}/>
                  <Text style={styles.tapItText}>{attentionRevealed ? 'IT connects to trophy' : 'Tap “IT” to reveal the connection'}</Text>
                </TouchableOpacity>
              </View>
              {attentionRevealed && (<Takeaway icon="git-merge">
                  Older algorithms forgot earlier words. Modern Transformers use “Self-Attention” to map relationships between all words simultaneously, giving AI the illusion of reasoning.
                </Takeaway>)}
              <Primary label="Ready for the Test" disabled={!attentionRevealed} onPress={() => moveTo(2)}/>
            </View>)}

          {stage === 2 && (<Animated.View style={{ transform: [{ translateX: shake }] }}>
              <Tag>MIND-BLOWN TEST</Tag>
              <Text style={styles.eyebrow}>ONE LAST PREDICTION</Text>
              <Text style={styles.quizTitle}>When an AI writes a 500-word essay, when does it decide how the final sentence will conclude?</Text>
              <View style={styles.options}>
                {QUIZ_OPTIONS.map((option, index) => {
                const isWrong = wrongAnswer === index;
                const isCorrect = correct && index === 2;
                return (<TouchableOpacity key={option} style={[styles.option, isWrong && styles.optionWrong, isCorrect && styles.optionCorrect]} onPress={() => answerQuiz(index)} disabled={correct}>
                      <View style={[styles.optionLetter, isWrong && styles.optionLetterWrong, isCorrect && styles.optionLetterCorrect]}>
                        <Text style={styles.optionLetterText}>{String.fromCharCode(65 + index)}</Text>
                      </View>
                      <Text style={styles.optionText}>{option}</Text>
                      {isCorrect && <Feather name="check-circle" size={20} color={COLORS.success}/>}
                    </TouchableOpacity>);
            })}
              </View>
              {wrongAnswer !== null && !correct && (<Text style={styles.hint}>Not quite. Think smaller: what does the model choose at each single moment?</Text>)}
              {correct && (<View style={styles.explanation}>
                  <Text style={styles.explanationTitle}>Aha!</Text>
                  <Text style={styles.explanationText}>It has zero foresight. Modern AI generates purely forward, one word token at a time. The entire appearance of intelligent thought comes from predicting probabilities across trillions of words.</Text>
                </View>)}
              <Primary label="Claim My Starting Reward" disabled={!correct} onPress={() => void finishQuiz()}/>
            </Animated.View>)}

          {stage === 3 && (<View style={styles.victory}>
              <Image source={require('../../assets/mascot/leo-celebrating.png')} style={styles.victoryLeo} resizeMode="contain"/>
              <Text style={styles.victoryKicker}>FIRST WIN BANKED</Text>
              <Text style={styles.victoryTitle}>You just learned how modern AI thinks.</Text>
              <View style={styles.rewards}>
                <View style={styles.reward}><Feather name="zap" size={24} color={COLORS.gold}/><Text style={styles.rewardValue}>+20 XP</Text><Text style={styles.rewardLabel}>Starting reward</Text></View>
                <View style={styles.reward}><Feather name="activity" size={24} color={COLORS.streak}/><Text style={styles.rewardValue}>1 Day</Text><Text style={styles.rewardLabel}>Streak unlocked</Text></View>
              </View>
              <Primary label="Save My Progress & Choose Industry" onPress={onComplete}/>
            </View>)}
        </ScrollView>
      </Animated.View>
    </View>);
}
function Tag({ children }) {
    return <View style={styles.tag}><Text style={styles.tagText}>{children}</Text></View>;
}
function Takeaway({ children, icon }) {
    return <View style={styles.takeaway}><Feather name={icon} size={20} color={COLORS.accent}/><Text style={styles.takeawayText}>{children}</Text></View>;
}
function Primary({ label, disabled, onPress }) {
    return (<TouchableOpacity style={[styles.primary, disabled && styles.primaryDisabled]} disabled={disabled} onPress={onPress} activeOpacity={0.86}>
      <Text style={styles.primaryText}>{label}</Text><Feather name="arrow-right" size={18} color={COLORS.textOnAccent}/>
    </TouchableOpacity>);
}
const styles = StyleSheet.create({
    flex: { flex: 1 },
    screen: { flex: 1, backgroundColor: COLORS.bg0 },
    topBar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 18, paddingVertical: 10 },
    progressWrap: { flex: 1, flexDirection: 'row', gap: 6 },
    progressItem: { flex: 1, gap: 5 },
    progressTrack: { height: 5, borderRadius: 3, backgroundColor: COLORS.bg2 },
    progressTrackActive: { backgroundColor: COLORS.accent },
    progressLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', fontWeight: '600' },
    progressLabelActive: { color: COLORS.accent, fontWeight: '800' },
    skipButton: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 2 },
    skipText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
    content: { paddingHorizontal: 20, paddingTop: 18 },
    tag: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.accentSoft, marginBottom: 10 },
    tagText: { fontSize: 10, fontWeight: '900', color: COLORS.accent, letterSpacing: 1 },
    eyebrow: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, marginBottom: 6 },
    title: { fontSize: 30, lineHeight: 36, fontWeight: '900', color: COLORS.textPrimary },
    heroLeo: { width: 190, height: 190, alignSelf: 'center', marginVertical: 8 },
    promptCard: { backgroundColor: COLORS.bg2, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 18, ...SHADOWS.sm },
    promptLead: { fontSize: 11, fontWeight: '800', color: COLORS.accent, marginBottom: 8, textTransform: 'uppercase' },
    sentence: { fontSize: 19, lineHeight: 27, fontWeight: '700', color: COLORS.textPrimary },
    chips: { flexDirection: 'row', gap: 8, marginTop: 18 },
    wordChip: { flex: 1, minHeight: 68, borderRadius: 14, backgroundColor: COLORS.bg1, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
    wordChipSelected: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
    word: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
    wordSelected: { color: COLORS.accent },
    chance: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
    chanceSelected: { color: COLORS.accent, fontWeight: '800' },
    takeaway: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.accentSoft, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.border },
    takeawayText: { flex: 1, fontSize: 14, lineHeight: 21, color: COLORS.textSecondary, fontWeight: '600' },
    primary: { minHeight: 56, borderRadius: 16, marginTop: 22, paddingHorizontal: 18, backgroundColor: COLORS.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...SHADOWS.accent },
    primaryDisabled: { opacity: 0.35 },
    primaryText: { fontSize: 16, fontWeight: '800', color: COLORS.textOnAccent, textAlign: 'center' },
    attentionCard: { marginTop: 24, minHeight: 240, borderRadius: 22, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, padding: 20, justifyContent: 'center', ...SHADOWS.sm },
    sentenceLine: { position: 'absolute', opacity: 0 },
    anchorWord: { opacity: 0 },
    sentenceText: { color: COLORS.textPrimary },
    contextSentence: { fontSize: 23, lineHeight: 36, textAlign: 'center', color: COLORS.textPrimary, fontWeight: '600' },
    sentenceWordStrong: { color: COLORS.accent, fontWeight: '900' },
    itWord: { color: COLORS.accent, fontWeight: '900', textDecorationLine: 'underline' },
    connectionArea: { height: 42, marginHorizontal: 28, justifyContent: 'center' },
    connectionLine: { height: 3, borderRadius: 2, backgroundColor: COLORS.accent },
    spark: { position: 'absolute', left: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accent },
    tapIt: { alignSelf: 'center', flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: COLORS.accentSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    tapItText: { color: COLORS.accent, fontSize: 12, fontWeight: '800' },
    quizTitle: { fontSize: 25, lineHeight: 32, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 18 },
    options: { gap: 10 },
    option: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.bg2, padding: 13 },
    optionWrong: { borderColor: COLORS.error, backgroundColor: COLORS.errorSoft },
    optionCorrect: { borderColor: COLORS.success, backgroundColor: COLORS.successSoft },
    optionLetter: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg1 },
    optionLetterWrong: { backgroundColor: COLORS.errorSoft },
    optionLetterCorrect: { backgroundColor: COLORS.successSoft },
    optionLetterText: { fontSize: 13, fontWeight: '900', color: COLORS.textSecondary },
    optionText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600', color: COLORS.textPrimary },
    hint: { marginTop: 12, color: COLORS.error, fontSize: 13, lineHeight: 19, fontWeight: '700' },
    explanation: { marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: COLORS.successSoft, borderWidth: 1, borderColor: COLORS.success },
    explanationTitle: { fontSize: 18, fontWeight: '900', color: COLORS.success, marginBottom: 4 },
    explanationText: { fontSize: 14, lineHeight: 21, color: COLORS.textSecondary },
    victory: { alignItems: 'center', paddingTop: 20 },
    victoryLeo: { width: 210, height: 210 },
    victoryKicker: { fontSize: 11, fontWeight: '900', color: COLORS.accent, letterSpacing: 1.2, marginTop: 4 },
    victoryTitle: { fontSize: 28, lineHeight: 34, fontWeight: '900', textAlign: 'center', color: COLORS.textPrimary, marginTop: 8 },
    rewards: { alignSelf: 'stretch', flexDirection: 'row', gap: 10, marginTop: 22 },
    reward: { flex: 1, minHeight: 118, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border },
    rewardValue: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary, marginTop: 7 },
    rewardLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
});
