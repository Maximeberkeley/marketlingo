import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PrimaryButton } from '../components/PrimaryButton';
import { tokens } from '../theme/tokens';
import { playSound } from '../../lib/sounds';
import { triggerHaptic } from '../../lib/haptics';
import { lessonRewards, scoreHeadline } from './lessonRewards';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useDeliverable } from '../../hooks/useDeliverable';
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m} min ${s.toString().padStart(2, '0')}` : `${s} sec`;
}
export function LessonComplete({ correct, total, baseXp, bestCombo = 0, heartsLeft, timeSpentSeconds = 0, streakDays, onDone, doneLabel = 'Continue', leoQuestions = 0, marketId, }) {
    const { progress } = useUserProgress(marketId);
    const goal = progress?.learning_goal ?? null;
    const dossier = useDeliverable(marketId, goal);
    const sectionCount = dossier.template.sections.length;
    const nextSection = dossier.firstOpenSection;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
    const praise = scoreHeadline(accuracy, total);
    const bonuses = useRef(lessonRewards(baseXp, accuracy, total, bestCombo, heartsLeft, timeSpentSeconds)).current;
    const totalXp = bonuses.reduce((sum, line) => sum + line.xp, 0);
    const [shown, setShown] = useState(0);
    useEffect(() => {
        playSound('celebration').catch(() => { });
    }, []);
    useEffect(() => {
        if (shown >= bonuses.length)
            return;
        const t = setTimeout(() => {
            setShown(s => s + 1);
            playSound('xpEarn').catch(() => { });
        }, 350 + shown * 300);
        return () => clearTimeout(t);
    }, [shown, bonuses.length]);
    return (<ScrollView style={styles.scroll} contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <View style={styles.badge}>
        <Feather name="award" size={40} color={tokens.color.accent}/>
      </View>
      <Text style={styles.title}>{praise}</Text>
      {typeof streakDays === 'number' && streakDays > 0 ? (<Text style={styles.subtitle}>🔥 {streakDays}-day streak — come back tomorrow to keep it.</Text>) : (<Text style={styles.subtitle}>You just started a streak. Come back tomorrow to keep it.</Text>)}

      <Text style={styles.xpBig}>+{totalXp} XP</Text>

      {total > 0 && <View style={styles.bonusList}>
        {bonuses.map((b, i) => (<View key={i} style={styles.bonusRow}>
            <Feather name="zap" size={14} color={tokens.color.accent}/>
            <Text style={styles.bonusLabel}>{b.label}</Text>
            <Text style={styles.bonusXp}>+{b.xp}</Text>
          </View>))}
      </View>}

      {leoQuestions > 0 && (<Text style={styles.leoLine}>
          You asked Leo {leoQuestions} {leoQuestions === 1 ? 'thing' : 'things'}. That's how it sticks.
        </Text>)}

      <View style={styles.stats}>
        {total > 0 && <Stat label="Accuracy" value={`${accuracy}%`}/>}
        {total > 0 && <Stat label="Correct" value={`${correct}/${total}`}/>}
        <Stat label="Time" value={formatTime(timeSpentSeconds)}/>
      </View>

      {/* Real progress: only sections the learner wrote count. */}
      {!dossier.loading && (<TouchableOpacity style={styles.dossierCard} activeOpacity={0.85} onPress={() => {
                triggerHaptic('medium');
                onDone(totalXp);
                router.push({ pathname: '/deliverable', params: nextSection ? { section: nextSection.key } : {} });
            }}>
          <View style={styles.dossierIcon}>
            <Feather name="file-text" size={18} color={tokens.color.accent}/>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.dossierEyebrow}>
              {dossier.template.title.toUpperCase()}
            </Text>
            <Text style={styles.dossierTitle}>{`${dossier.template.title} · ${dossier.filledSections} of ${sectionCount} sections written by you`}</Text>
            <Text style={styles.dossierBody}>{nextSection ? `Next: ${nextSection.title}` : 'Every section is written. Open it to review or export.'}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={tokens.color.accent}/>
        </TouchableOpacity>)}

      <TouchableOpacity accessibilityRole="link" accessibilityLabel="Today's intel · 3 stories →" style={styles.intelLink} activeOpacity={0.7} onPress={() => {
            triggerHaptic('light');
            onDone(totalXp);
            router.push({ pathname: '/(tabs)/roadmap', params: { autoOpen: '1' } });
        }}>
        <Text style={styles.intelLinkText}>Today's intel · 3 stories →</Text>
      </TouchableOpacity>

      <PrimaryButton label={doneLabel} onPress={() => {
            triggerHaptic('light');
            onDone(totalXp);
        }} style={styles.cta}/>
    </ScrollView>);
}
function Stat({ label, value }) {
    return (<View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>);
}
const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: tokens.color.bg },
    wrap: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.space.xl,
        paddingBottom: tokens.space.xl * 2,
        gap: tokens.space.sm,
        backgroundColor: tokens.color.bg,
    },
    intelLink: { minHeight: 44, justifyContent: 'center', alignSelf: 'stretch', alignItems: 'center' },
    intelLinkText: { fontSize: tokens.font.caption + 1, color: tokens.color.accent, fontWeight: '600', textAlign: 'center' },
    badge: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: tokens.color.accentSoft,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: tokens.space.sm,
    },
    title: { maxWidth: '100%', textAlign: 'center', fontSize: tokens.font.title, fontWeight: '800', color: tokens.color.text },
    subtitle: { maxWidth: '100%', textAlign: 'center', fontSize: tokens.font.body, color: tokens.color.textSecondary, textAlign: 'center' },
    xpBig: {
        fontSize: 40,
        fontWeight: '900',
        color: tokens.color.accent,
        marginTop: tokens.space.md,
    },
    leoLine: {
        fontSize: tokens.font.caption,
        fontWeight: '700',
        color: tokens.color.accent,
        textAlign: 'center',
        marginBottom: tokens.space.md,
    },
    bonusList: { alignSelf: 'stretch', gap: 6, marginTop: tokens.space.sm },
    bonusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.space.sm,
        backgroundColor: tokens.color.surface,
        borderRadius: tokens.radius.md,
        paddingHorizontal: tokens.space.md,
        paddingVertical: tokens.space.sm,
    },
    bonusLabel: { flex: 1, minWidth: 0, flexShrink: 1, fontSize: tokens.font.caption + 1, fontWeight: '700', color: tokens.color.textSecondary },
    bonusXp: { fontSize: tokens.font.caption + 1, fontWeight: '800', color: tokens.color.accent },
    stats: {
        flexDirection: 'row',
        gap: tokens.space.md,
        marginTop: tokens.space.lg,
        width: '100%',
    },
    stat: {
        flex: 1,
        borderRadius: tokens.radius.lg,
        borderWidth: 2,
        borderColor: tokens.color.border,
        paddingVertical: tokens.space.lg,
        alignItems: 'center',
        gap: 4,
    },
    statValue: { fontSize: tokens.font.body, fontWeight: '800', color: tokens.color.text },
    statLabel: { fontSize: tokens.font.caption, color: tokens.color.textMuted, fontWeight: '600' },
    cta: { alignSelf: 'stretch', marginTop: tokens.space.lg },
    dossierCard: {
        alignSelf: 'stretch',
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.space.md,
        marginTop: tokens.space.lg,
        padding: tokens.space.md,
        borderRadius: tokens.radius.lg,
        borderWidth: 1,
        borderColor: tokens.color.accent,
        backgroundColor: tokens.color.card,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 4,
    },
    dossierIcon: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.color.accentSoft,
    },
    dossierEyebrow: {
        fontSize: 9.5,
        fontWeight: '800',
        letterSpacing: 1,
        color: tokens.color.accent,
    },
    dossierTitle: {
        fontSize: tokens.font.caption + 2,
        fontWeight: '800',
        color: tokens.color.text,
        marginTop: 3,
    },
    dossierBody: { fontSize: tokens.font.caption, color: tokens.color.textSecondary, marginTop: 2 },
});
