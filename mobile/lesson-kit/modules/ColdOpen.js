import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { useEnter } from './shared';
import { ColorText } from '../components/ColorText';
import { shortLabel } from '../text';
import { BriefingReader } from '../components/BriefingReader';
/** Cold open — one arresting line, full bleed, then tap on. */
export function ColdOpen({ exercise, onChange }) {
    const enter = useEnter(exercise.id);
    const [showBriefing, setShowBriefing] = useState(false);
    useEffect(() => {
        onChange({ canCheck: true, isCorrect: true });
    }, [exercise.id]);
    const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
    const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
    return (<View style={styles.wrap}>
      <Animated.View style={[styles.card, { opacity: enter, transform: [{ translateY }, { scale }] }]}>
        {!!exercise.eyebrow && <Text style={styles.eyebrow}>{shortLabel(exercise.eyebrow).toUpperCase()}</Text>}
        <ColorText text={exercise.headline} style={styles.headline} maxSentences={4} maxLength={260}/>
        {!!exercise.kicker && <ColorText text={exercise.kicker} style={styles.kicker} maxSentences={1} maxLength={80}/>}
        {!!exercise.fullText && exercise.fullText.trim() !== exercise.headline.trim() && (<TouchableOpacity accessibilityRole="button" accessibilityLabel="Read full briefing" activeOpacity={0.82} style={styles.readButton} onPress={() => setShowBriefing(true)}>
            <View style={styles.readIcon}><Feather name="file-text" size={15} color={tokens.color.accent}/></View>
            <View style={styles.readCopy}>
              <Text style={styles.readTitle}>Read briefing</Text>
              <Text style={styles.readNote}>Full context · readable view</Text>
            </View>
            <Feather name="chevron-right" size={18} color={tokens.color.textMuted}/>
          </TouchableOpacity>)}
      </Animated.View>
      {!!exercise.fullText && (<BriefingReader visible={showBriefing} title={exercise.detailTitle || exercise.eyebrow || 'Briefing'} eyebrow={exercise.eyebrow} text={exercise.fullText} keyTerms={exercise.keyTerms} sources={exercise.sources} onClose={() => setShowBriefing(false)}/>)}
    </View>);
}
const styles = StyleSheet.create({
    wrap: { flex: 1, justifyContent: 'center' },
    card: {
        borderRadius: tokens.radius.xl,
        // Always the dark ink card — in dark mode tokens.color.text flips light,
        // which made this white-on-white. The cold open stays dramatic in both themes.
        backgroundColor: '#171B26',
        padding: tokens.space.xl,
        gap: tokens.space.md,
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.6,
        color: '#FFFFFF',
        opacity: 0.6,
    },
    headline: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', lineHeight: 33 },
    kicker: { fontSize: tokens.font.body, color: '#FFFFFF', opacity: 0.75, lineHeight: 23 },
    readButton: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 4, paddingHorizontal: 13, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border },
    readIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.accentSoft },
    readCopy: { flex: 1 },
    readTitle: { fontSize: 15, fontWeight: '800', color: tokens.color.text },
    readNote: { marginTop: 2, fontSize: 11, fontWeight: '600', color: tokens.color.textMuted },
});
