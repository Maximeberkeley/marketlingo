import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../lib/constants';

const MARKET_ILLUSTRATIONS: Record<string, any> = {
  aerospace: require('../../assets/illustrations/aerospace.png'),
  neuroscience: require('../../assets/illustrations/neuroscience.png'),
  ai: require('../../assets/illustrations/ai.png'),
  fintech: require('../../assets/illustrations/fintech.png'),
  ev: require('../../assets/illustrations/ev.png'),
  biotech: require('../../assets/illustrations/biotech.png'),
  cleanenergy: require('../../assets/illustrations/cleanenergy.png'),
  agtech: require('../../assets/illustrations/agtech.png'),
  climatetech: require('../../assets/illustrations/climatetech.png'),
  cybersecurity: require('../../assets/illustrations/cybersecurity.png'),
  spacetech: require('../../assets/illustrations/spacetech.png'),
  robotics: require('../../assets/illustrations/robotics.png'),
  healthtech: require('../../assets/illustrations/healthtech.png'),
  logistics: require('../../assets/illustrations/logistics.png'),
  web3: require('../../assets/illustrations/web3.png'),
};

const STAGES = [
  { label: 'Recall', icon: 'rotate-ccw' as const },
  { label: 'Discover', icon: 'search' as const },
  { label: 'Predict', icon: 'crosshair' as const },
  { label: 'Apply', icon: 'tool' as const },
  { label: 'Decide', icon: 'flag' as const },
];

export type LessonStage = 'Brief' | 'Recall' | 'Discover' | 'Predict' | 'Apply' | 'Debrief';

interface MissionBriefProps {
  title: string;
  goals: string[];
  previousTopic?: string;
  marketId?: string;
  dayNumber?: number;
  mentorName: string;
  accentColor: string;
  estimatedMinutes: number;
}

export function MissionBrief({
  title,
  goals,
  previousTopic,
  marketId,
  dayNumber,
  mentorName,
  accentColor,
  estimatedMinutes,
}: MissionBriefProps) {
  const illustration = MARKET_ILLUSTRATIONS[marketId || 'aerospace'];
  const capability = goals[0] || `Explain ${title.toLowerCase()} and use it in a real decision.`;

  return (
    <View style={styles.mission}>
      <View style={[styles.missionVisual, { backgroundColor: accentColor + '12' }]}>
        {illustration ? <Image source={illustration} style={styles.illustration} /> : null}
        <View style={[styles.dayBadge, { borderColor: accentColor + '35' }]}>
          <Text style={[styles.dayText, { color: accentColor }]}>{dayNumber ? `DAY ${dayNumber}` : 'FIELD MISSION'}</Text>
        </View>
      </View>

      <Text style={[styles.eyebrow, { color: accentColor }]}>TODAY'S MISSION</Text>
      <Text style={styles.missionTitle}>{title}</Text>
      <Text style={styles.promise}>Leave able to {capability.replace(/[.!]+$/, '').toLowerCase()}.</Text>

      <View style={styles.mentorBrief}>
        <View style={[styles.mentorMark, { backgroundColor: accentColor }]}>
          <Feather name="compass" size={18} color={COLORS.bg0} />
        </View>
        <Text style={styles.mentorText}>
          <Text style={styles.mentorName}>{mentorName}: </Text>
          {previousTopic ? `Use what you learned about ${previousTopic}—today you will put it to work.` : 'Watch for the signal that changes the decision.'}
        </Text>
      </View>

      <View style={styles.route}>
        {STAGES.map((stage, index) => (
          <React.Fragment key={stage.label}>
            <View style={styles.routeStop}>
              <View style={[styles.routeNode, index === 0 && { backgroundColor: accentColor, borderColor: accentColor }]}>
                <Feather name={stage.icon} size={16} color={index === 0 ? COLORS.bg0 : COLORS.textMuted} />
              </View>
              <Text style={[styles.routeLabel, index === 0 && { color: accentColor }]}>{stage.label}</Text>
            </View>
            {index < STAGES.length - 1 ? <View style={styles.routeLine} /> : null}
          </React.Fragment>
        ))}
      </View>

      <View style={styles.missionMeta}>
        <View style={styles.metaItem}><Feather name="clock" size={14} color={COLORS.textMuted} /><Text style={styles.metaText}>{estimatedMinutes} min</Text></View>
        <View style={styles.metaItem}><Feather name="zap" size={14} color={COLORS.warning} /><Text style={styles.metaText}>Decision at the finish</Text></View>
      </View>
    </View>
  );
}

export function StageLabel({ stage, detail, accentColor }: { stage: LessonStage; detail?: string; accentColor: string }) {
  return (
    <View style={styles.stageLabel}>
      <View style={[styles.stageDot, { backgroundColor: accentColor }]} />
      <Text style={[styles.stageName, { color: accentColor }]}>{stage.toUpperCase()}</Text>
      {detail ? <Text style={styles.stageDetail} numberOfLines={1}>{detail}</Text> : null}
    </View>
  );
}

export function KnowledgeUnlock({ label, accentColor }: { label: string; accentColor: string }) {
  return (
    <View style={[styles.unlock, { borderColor: accentColor + '30', backgroundColor: accentColor + '0D' }]}>
      <Feather name="check" size={14} color={accentColor} />
      <Text style={[styles.unlockText, { color: accentColor }]} numberOfLines={1}>Insight unlocked · {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mission: { flex: 1, paddingBottom: 24 },
  missionVisual: { minHeight: 172, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  illustration: { width: 176, height: 150, resizeMode: 'contain' },
  dayBadge: { position: 'absolute', top: 14, left: 14, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: COLORS.bg0, borderWidth: 1 },
  dayText: { fontSize: 10, fontWeight: '800', letterSpacing: 0 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0, marginBottom: 8 },
  missionTitle: { fontSize: 28, lineHeight: 33, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 0 },
  promise: { fontSize: 16, lineHeight: 23, color: COLORS.textSecondary, marginTop: 10 },
  mentorBrief: { marginTop: 20, flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: COLORS.bg1, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  mentorMark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mentorText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.textSecondary },
  mentorName: { fontWeight: '800', color: COLORS.textPrimary },
  route: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 28 },
  routeStop: { width: 44, alignItems: 'center' },
  routeNode: { width: 40, height: 40, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bg0, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  routeLabel: { marginTop: 7, fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  routeLine: { flex: 1, height: 2, marginTop: 19, backgroundColor: COLORS.border },
  missionMeta: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metaItem: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  metaText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  stageLabel: { flexDirection: 'row', alignItems: 'center', minHeight: 28, marginBottom: 12 },
  stageDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  stageName: { fontSize: 11, fontWeight: '900', letterSpacing: 0 },
  stageDetail: { flex: 1, marginLeft: 8, fontSize: 12, color: COLORS.textMuted },
  unlock: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  unlockText: { flexShrink: 1, fontSize: 11, fontWeight: '700' },
});