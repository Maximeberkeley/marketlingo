import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';

interface PathwayStep {
  title: string;
  duration: string;
  description: string;
  tips: string[];
}

interface RegulatoryPathway {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  timeline: string;
  costRange: string;
  steps: PathwayStep[];
  examples: string[];
}

const FDA_PATHWAYS: RegulatoryPathway[] = [
  {
    id: '510k',
    name: '510(k) Clearance',
    description: 'For devices substantially equivalent to existing approved devices. Most common pathway.',
    emoji: '📋',
    color: '#3B82F6',
    timeline: '3-6 months',
    costRange: '$50K - $150K',
    steps: [
      { title: 'Identify Predicate Device', duration: '2-4 weeks', description: 'Find an FDA-cleared device with similar intended use.', tips: ['Search FDA 510(k) database', 'Consider multiple predicates', 'Document similarities clearly'] },
      { title: 'Prepare Submission', duration: '2-3 months', description: 'Compile device description, performance testing, and comparison.', tips: ['Follow FDA guidance documents', 'Include risk analysis', 'Prepare biocompatibility data'] },
      { title: 'FDA Review', duration: '90 days (statutory)', description: 'FDA reviews submission; may request Additional Information.', tips: ['Respond to AI requests quickly', 'Track review timeline', 'Prepare for potential meeting'] },
      { title: 'Clearance Decision', duration: '1-2 weeks', description: 'FDA issues SE or NSE decision.', tips: ['Plan manufacturing scale-up', 'Prepare marketing materials', 'Register establishment'] },
    ],
    examples: ['Consumer EEG headbands', 'Neurofeedback systems', 'TMS accessories'],
  },
  {
    id: 'denovo',
    name: 'De Novo Classification',
    description: 'For novel, low-to-moderate risk devices without a predicate. Creates new classification.',
    emoji: '⚖️',
    color: '#8B5CF6',
    timeline: '6-12 months',
    costRange: '$150K - $400K',
    steps: [
      { title: 'Pre-Submission Meeting', duration: '3-4 months', description: 'Request Q-Sub meeting with FDA to discuss classification.', tips: ['Prepare detailed device description', 'Propose risk classification', 'Identify key questions'] },
      { title: 'Clinical Evidence', duration: '3-6 months', description: 'Conduct bench testing, possibly clinical studies.', tips: ['Design studies per FDA feedback', 'Consider IRB-approved trials', 'Document adverse events'] },
      { title: 'De Novo Request', duration: '1-2 months', description: 'Submit comprehensive request with all evidence.', tips: ['Include risk-benefit analysis', 'Propose special controls', 'Reference similar devices'] },
      { title: 'FDA Review & Grant', duration: '150 days (goal)', description: 'FDA reviews and may grant De Novo classification.', tips: ['You become the predicate', 'Plan post-market requirements', 'Consider IP implications'] },
    ],
    examples: ['Novel neurostimulation devices', 'AI-powered diagnostic tools', 'Closed-loop brain interfaces'],
  },
  {
    id: 'pma',
    name: 'PMA (Pre-Market Approval)',
    description: 'For Class III high-risk devices. Most rigorous pathway requiring clinical trials.',
    emoji: '🛡️',
    color: '#F59E0B',
    timeline: '2-5 years',
    costRange: '$5M - $50M+',
    steps: [
      { title: 'Pre-IDE Planning', duration: '6-12 months', description: 'Prepare Investigational Device Exemption application.', tips: ['Define primary endpoints', 'Power analysis for sample size', 'Identify clinical sites'] },
      { title: 'IDE Approval & Trial', duration: '1-3 years', description: 'Conduct pivotal clinical trial with FDA oversight.', tips: ['Enroll diverse patient population', 'Maintain GCP compliance', 'Track all adverse events'] },
      { title: 'PMA Submission', duration: '3-6 months', description: 'Compile comprehensive application with all data.', tips: ['Hire regulatory consultants', 'Prepare executive summary', 'Include all raw data'] },
      { title: 'FDA Review & Panel', duration: '180 days + panel', description: 'FDA reviews; may convene advisory panel.', tips: ['Prepare panel presentation', 'Anticipate questions', 'Engage with patient advocates'] },
    ],
    examples: ['Deep brain stimulators', 'Implantable BCIs', 'Closed-loop seizure devices'],
  },
];

const IRB_ESSENTIALS = [
  { title: 'Informed Consent', description: 'Participants must understand risks, benefits, and alternatives.', emoji: '👥' },
  { title: 'Risk Minimization', description: 'Design studies to minimize risks. Justify remaining risks.', emoji: '🛡️' },
  { title: 'Vulnerable Populations', description: 'Extra protections for children, prisoners, pregnant women.', emoji: '⚠️' },
  { title: 'Data Privacy', description: 'Protect participant data. Consider HIPAA, GDPR, brain data.', emoji: '📋' },
];

export default function RegulatoryHubScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const activePathway = FDA_PATHWAYS.find((p) => p.id === selectedPathway);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Sophia */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mentorHeader}>
          <View style={styles.mentorAvatar}>
            <Text style={{ fontSize: 28 }}>✨</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Research-to-Clinic Pipeline</Text>
            <Text style={styles.subtitle}>Navigate FDA & IRB pathways with confidence</Text>
          </View>
        </View>

        {/* Sophia's Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            <Text style={styles.tipLabel}>Sophia's Tip: </Text>
            The regulatory pathway you choose will define your timeline, budget, and fundraising strategy. Understanding these early saves years of pivots!
          </Text>
        </View>

        {/* FDA Pathways */}
        <Text style={styles.sectionTitle}>FDA DEVICE PATHWAYS</Text>
        <View style={{ gap: 10 }}>
          {FDA_PATHWAYS.map((pathway) => (
            <TouchableOpacity
              key={pathway.id}
              style={[styles.pathwayCard, selectedPathway === pathway.id && { borderColor: COLORS.accent, borderWidth: 2 }]}
              onPress={() => { setSelectedPathway(selectedPathway === pathway.id ? null : pathway.id); setExpandedStep(null); }}
              activeOpacity={0.7}
            >
              <View style={styles.pathwayHeader}>
                <View style={[styles.pathwayIcon, { backgroundColor: pathway.color + '20' }]}>
                  <Text style={{ fontSize: 20 }}>{pathway.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pathwayName}>{pathway.name}</Text>
                  <View style={styles.pathwayMeta}>
                    <Text style={styles.metaText}>⏱ {pathway.timeline}</Text>
                    <Text style={styles.metaText}>{pathway.costRange}</Text>
                  </View>
                </View>
                <Text style={[styles.chevron, selectedPathway === pathway.id && { transform: [{ rotate: '90deg' }] }]}>›</Text>
              </View>
              <Text style={styles.pathwayDesc}>{pathway.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Expanded Pathway Details */}
        {activePathway && (
          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>🧪 Step-by-Step Process</Text>
            {activePathway.steps.map((step, idx) => (
              <View key={idx}>
                <TouchableOpacity
                  style={styles.stepRow}
                  onPress={() => setExpandedStep(expandedStep === idx ? null : idx)}
                >
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDuration}>{step.duration}</Text>
                  </View>
                  <Text style={[styles.chevron, expandedStep === idx && { transform: [{ rotate: '90deg' }] }]}>›</Text>
                </TouchableOpacity>
                {expandedStep === idx && (
                  <View style={styles.stepExpanded}>
                    <Text style={styles.stepDesc}>{step.description}</Text>
                    {step.tips.map((tip, tipIdx) => (
                      <View key={tipIdx} style={styles.tipRow}>
                        <Text style={{ color: '#22C55E', fontSize: 12 }}>✓</Text>
                        <Text style={styles.tipItemText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
            <View style={styles.examplesRow}>
              <Text style={styles.examplesLabel}>Example Devices:</Text>
              <View style={styles.chipRow}>
                {activePathway.examples.map((ex, idx) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{ex}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* IRB Essentials */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>IRB ESSENTIALS</Text>
        <View style={styles.irbGrid}>
          {IRB_ESSENTIALS.map((item, idx) => (
            <View key={idx} style={styles.irbCard}>
              <View style={styles.irbIcon}>
                <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
              </View>
              <Text style={styles.irbTitle}>{item.title}</Text>
              <Text style={styles.irbDesc}>{item.description}</Text>
            </View>
          ))}
        </View>

        {/* External Link */}
        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => Linking.openURL('https://www.fda.gov/medical-devices')}
        >
          <Text style={{ fontSize: 24 }}>🧠</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>FDA Medical Devices</Text>
            <Text style={styles.linkDesc}>Official guidance documents</Text>
          </View>
          <Text style={{ fontSize: 16, color: COLORS.accent }}>↗</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  scrollContent: { paddingHorizontal: 16 },
  headerRow: { marginBottom: 12 },
  backText: { fontSize: 15, color: COLORS.textSecondary },
  mentorHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  mentorAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 2, borderColor: 'rgba(139,92,246,0.4)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  tipCard: { backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', borderRadius: 14, padding: 14, marginBottom: 20 },
  tipText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  tipLabel: { fontWeight: '600', color: COLORS.accent },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10 },
  pathwayCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  pathwayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  pathwayIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pathwayName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  pathwayMeta: { flexDirection: 'row', gap: 12, marginTop: 2 },
  metaText: { fontSize: 11, color: COLORS.textMuted },
  pathwayDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  chevron: { fontSize: 22, color: COLORS.textMuted },
  stepsCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: COLORS.border },
  stepsTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.bg1, borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.1)', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  stepTitle: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  stepDuration: { fontSize: 10, color: COLORS.textMuted },
  stepExpanded: { marginLeft: 38, marginBottom: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: COLORS.accent },
  stepDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 6 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 3 },
  tipItemText: { fontSize: 11, color: COLORS.textMuted, flex: 1 },
  examplesRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  examplesLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: COLORS.bg1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  chipText: { fontSize: 10, color: COLORS.textSecondary },
  irbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  irbCard: { width: '47%' as any, backgroundColor: COLORS.bg2, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  irbIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(59,130,246,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  irbTitle: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 4 },
  irbDesc: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, padding: 14, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  linkTitle: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  linkDesc: { fontSize: 11, color: COLORS.textMuted },
});
