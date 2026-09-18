import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyTerm, Source } from '../types';
import { tokens } from '../theme/tokens';
import { ColorText } from './ColorText';
import { dropIncompleteTail } from '../../lib/textUtils';
import { useDeepDiveTarget } from './DeepDiveContext';
import { useDeepDive } from '../../hooks/useDeepDive';

interface Props {
  visible: boolean;
  title: string;
  eyebrow?: string;
  text: string;
  keyTerms?: KeyTerm[];
  sources?: Source[];
  onClose: () => void;
}

function paragraphs(text: string): string[] {
  // Authored text can itself have been stored truncated; never render a
  // fragment that stops mid-thought.
  const normalized = dropIncompleteTail(text.replace(/\r/g, '').trim());
  if (!normalized) return [];
  const explicit = normalized.split(/\n\s*\n+/).map(part => part.trim()).filter(Boolean);
  if (explicit.length > 1) return explicit;

  const sentences = normalized.split(/(?<=[.!?])\s+/).map(part => part.trim()).filter(Boolean);
  const groups: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    groups.push(sentences.slice(index, index + 2).join(' '));
  }
  return groups.length ? groups : [normalized];
}

export function BriefingReader({ visible, title, eyebrow, text, keyTerms, sources, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(0);
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const sections = useMemo(() => paragraphs(text), [text]);
  const { stackId, learningGoal } = useDeepDiveTarget();
  const { deepDive, loading: deepLoading, error: deepError, load: loadDeepDive } = useDeepDive(
    stackId,
    learningGoal,
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const available = contentSize.height - layoutMeasurement.height;
    setProgress(available <= 0 ? 1 : Math.min(1, Math.max(0, contentOffset.y / available)));
  };

  const close = () => {
    setProgress(0);
    setOpenTerm(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <View style={[styles.root, { paddingTop: insets.top }]}> 
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close briefing"
            hitSlop={10}
            style={styles.close}
            onPress={close}
          >
            <Feather name="x" size={22} color={tokens.color.text} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{eyebrow || 'FULL BRIEFING'}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          </View>
          <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(4, progress * 100)}%` }]} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={32}
        >
          <View style={styles.readingHead}>
            <View style={styles.signalDot} />
            <Text style={styles.readingLabel}>READING VIEW</Text>
            <Text style={styles.scrollCue}>Scroll to read</Text>
          </View>

          <Text style={styles.title}>{title}</Text>

          <View style={styles.rule} />
          {sections.map((section, index) => (
            <ColorText
              key={`${index}-${section.slice(0, 18)}`}
              text={section}
              style={index === 0 ? styles.lead : styles.body}
              maxSentences={100}
              maxLength={10000}
            />
          ))}

          {!!stackId && !deepDive && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go deeper on this concept"
              activeOpacity={0.85}
              style={styles.deepButton}
              disabled={deepLoading}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                loadDeepDive();
              }}
            >
              {deepLoading ? (
                <ActivityIndicator size="small" color={tokens.color.accent} />
              ) : (
                <Feather name="layers" size={16} color={tokens.color.accent} />
              )}
              <Text style={styles.deepButtonText}>
                {deepLoading ? 'Writing the deep layer…' : 'Go deeper on this concept'}
              </Text>
            </TouchableOpacity>
          )}

          {!!deepError && !deepDive && <Text style={styles.deepError}>{deepError}</Text>}

          {!!deepDive && (
            <View style={styles.deep}>
              <Text style={styles.sectionLabel}>DEEP LAYER</Text>
              <Text style={styles.deepConcept}>{deepDive.concept}</Text>
              <Text style={styles.body}>{deepDive.summary}</Text>

              {!!deepDive.mechanism?.length && (
                <View style={styles.deepBlock}>
                  <Text style={styles.deepHeading}>How it works</Text>
                  {deepDive.mechanism.map((step, index) => (
                    <View key={`${index}-${step.step}`} style={styles.stepRow}>
                      <Text style={styles.stepIndex}>{index + 1}</Text>
                      <View style={styles.stepCopy}>
                        <Text style={styles.stepLabel}>{step.step}</Text>
                        <Text style={styles.stepDetail}>{step.detail}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {!!deepDive.case_study?.company && (
                <View style={styles.deepBlock}>
                  <Text style={styles.deepHeading}>In the real world</Text>
                  <Text style={styles.caseCompany}>{deepDive.case_study.company}</Text>
                  {!!deepDive.case_study.situation && (
                    <Text style={styles.stepDetail}>{deepDive.case_study.situation}</Text>
                  )}
                  {deepDive.case_study.figures?.map((figure, index) => (
                    <View key={`${index}-fig`} style={styles.figureRow}>
                      <View style={styles.signalDot} />
                      <Text style={styles.figureText}>{figure}</Text>
                    </View>
                  ))}
                  {!!deepDive.case_study.outcome && (
                    <Text style={styles.stepDetail}>{deepDive.case_study.outcome}</Text>
                  )}
                </View>
              )}

              {!!deepDive.key_terms?.length && (
                <View style={styles.deepBlock}>
                  <Text style={styles.deepHeading}>Words to own</Text>
                  {deepDive.key_terms.map(term => (
                    <View key={term.term} style={styles.term}>
                      <Text style={styles.termWord}>{term.term}</Text>
                      <Text style={styles.termDefinition}>{term.definition}</Text>
                    </View>
                  ))}
                </View>
              )}

              {!!deepDive.sources?.length && (
                <View style={styles.deepBlock}>
                  <Text style={styles.deepHeading}>Where this comes from</Text>
                  {deepDive.sources.map((source, index) => (
                    <TouchableOpacity
                      key={`${source.url}-${index}`}
                      accessibilityRole="link"
                      style={styles.source}
                      onPress={() => Linking.openURL(source.url).catch(() => {})}
                    >
                      <Text style={styles.sourceText}>{source.label}</Text>
                      <Feather name="external-link" size={14} color={tokens.color.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {!!keyTerms?.length && (
            <View style={styles.terms}>
              <Text style={styles.sectionLabel}>KEY TERMS</Text>
              {keyTerms.map(term => {
                const expanded = openTerm === term.term;
                return (
                  <TouchableOpacity
                    key={term.term}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    accessibilityLabel={`${expanded ? 'Hide' : 'Show'} definition for ${term.term}`}
                    activeOpacity={0.82}
                    style={[styles.term, expanded && styles.termOpen]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setOpenTerm(current => current === term.term ? null : term.term);
                    }}
                  >
                    <View style={styles.termHead}>
                      <Text style={styles.termWord}>{term.term}</Text>
                      <Feather name={expanded ? 'minus' : 'plus'} size={17} color={tokens.color.accent} />
                    </View>
                    {expanded && <Text style={styles.termDefinition}>{term.definition}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {!!sources?.length && (
            <View style={styles.sources}>
              <Text style={styles.sectionLabel}>SOURCES</Text>
              {sources.map((source, index) => (
                <TouchableOpacity
                  key={`${source.url}-${index}`}
                  style={styles.source}
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(source.url).catch(() => {})}
                >
                  <Text style={styles.sourceText}>{source.label}</Text>
                  <Feather name="external-link" size={14} color={tokens.color.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}> 
          <TouchableOpacity accessibilityRole="button" style={styles.done} activeOpacity={0.88} onPress={close}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 12 },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.surface },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 10, fontWeight: '900', color: tokens.color.accent, letterSpacing: 1.2 },
  headerTitle: { marginTop: 2, fontSize: 15, fontWeight: '800', color: tokens.color.text },
  percent: { width: 38, textAlign: 'right', fontSize: 12, fontWeight: '800', color: tokens.color.textMuted },
  track: { height: 3, backgroundColor: tokens.color.track },
  fill: { height: 3, minWidth: 4, borderRadius: 2, backgroundColor: tokens.color.accent },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 48 },
  readingHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  signalDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: tokens.color.signalData, marginRight: 7 },
  readingLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1, color: tokens.color.textSecondary },
  scrollCue: { marginLeft: 'auto', fontSize: 11, fontWeight: '700', color: tokens.color.textMuted },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '900', color: tokens.color.text },
  rule: { height: 1, backgroundColor: tokens.color.border, marginVertical: 24 },
  lead: { fontSize: 19, lineHeight: 29, fontWeight: '600', color: tokens.color.text, marginBottom: 18 },
  body: { fontSize: 17, lineHeight: 28, color: tokens.color.textSecondary, marginBottom: 18 },
  terms: { marginTop: 16, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, color: tokens.color.textMuted, marginBottom: 2 },
  term: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border },
  termOpen: { borderColor: tokens.color.accent },
  termHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  termWord: { flex: 1, fontSize: 16, fontWeight: '800', color: tokens.color.text },
  termDefinition: { marginTop: 10, fontSize: 16, lineHeight: 25, color: tokens.color.textSecondary },
  sources: { marginTop: 28, gap: 8 },
  deepButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 18,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: tokens.color.accent,
    backgroundColor: tokens.color.surface,
  },
  deepButtonText: { fontSize: 15, fontWeight: '800', color: tokens.color.accent },
  deepError: { fontSize: 14, color: tokens.color.textMuted, marginBottom: 12 },
  deep: { marginTop: 8, gap: 10 },
  deepConcept: { fontSize: 22, lineHeight: 29, fontWeight: '900', color: tokens.color.text },
  deepBlock: { marginTop: 14, gap: 10 },
  deepHeading: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase', color: tokens.color.textSecondary },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    lineHeight: 26,
    fontSize: 13,
    fontWeight: '900',
    color: tokens.color.textOnAccent,
    backgroundColor: tokens.color.accent,
    overflow: 'hidden',
  },
  stepCopy: { flex: 1, gap: 4 },
  stepLabel: { fontSize: 16, fontWeight: '800', color: tokens.color.text },
  stepDetail: { fontSize: 16, lineHeight: 25, color: tokens.color.textSecondary },
  caseCompany: { fontSize: 17, fontWeight: '900', color: tokens.color.text },
  figureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  figureText: { flex: 1, fontSize: 15, fontWeight: '700', color: tokens.color.text },
  source: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface },
  sourceText: { flex: 1, fontSize: 14, fontWeight: '700', color: tokens.color.textSecondary },
  footer: { paddingHorizontal: 18, paddingTop: 12, borderTopWidth: 1, borderTopColor: tokens.color.border, backgroundColor: tokens.color.bg },
  done: { height: tokens.size.buttonHeight, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.md, backgroundColor: tokens.color.accent },
  doneText: { fontSize: tokens.font.button, fontWeight: '900', color: tokens.color.textOnAccent },
});