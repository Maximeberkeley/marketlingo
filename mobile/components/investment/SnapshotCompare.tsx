import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { PortfolioSnapshot } from '../../hooks/usePortfolioSnapshots';
import { Feather } from '@expo/vector-icons';

const LEO_STUDY = require('../../assets/mascot/leo-study.png');

const CATEGORY_COLORS = {
  core: '#10B981',
  growth: '#3B82F6',
  speculative: '#F59E0B',
};

interface SnapshotCompareProps {
  visible: boolean;
  onClose: () => void;
  snapshots: PortfolioSnapshot[];
}

export function SnapshotCompare({ visible, onClose, snapshots }: SnapshotCompareProps) {
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(Math.min(1, snapshots.length - 1));

  if (snapshots.length < 2) return null;

  const left = snapshots[leftIdx];
  const right = snapshots[rightIdx];
  const lBd = left.category_breakdown || { core: 0, growth: 0, speculative: 0 };
  const rBd = right.category_breakdown || { core: 0, growth: 0, speculative: 0 };

  const delta = {
    core: rBd.core - lBd.core,
    growth: rBd.growth - lBd.growth,
    speculative: rBd.speculative - lBd.speculative,
    positions: (right.positions?.length || 0) - (left.positions?.length || 0),
    allocation: Number(right.total_allocation || 0) - Number(left.total_allocation || 0),
  };

  const formatDelta = (v: number) => (v >= 0 ? `+${v}` : `${v}`);
  const deltaColor = (v: number) => (v > 0 ? '#22C55E' : v < 0 ? '#EF4444' : COLORS.textMuted);

  // Find companies added/removed between snapshots
  const leftCompanyIds = new Set((left.positions || []).map(p => p.company?.id));
  const rightCompanyIds = new Set((right.positions || []).map(p => p.company?.id));
  const addedCompanies = (right.positions || []).filter(p => !leftCompanyIds.has(p.company?.id));
  const removedCompanies = (left.positions || []).filter(p => !rightCompanyIds.has(p.company?.id));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={LEO_STUDY} style={{ width: 28, height: 28 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Strategy Evolution</Text>
              <Text style={styles.subtitle}>Compare how your portfolio changed</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
            {/* Snapshot selectors */}
            <View style={styles.selectorRow}>
              <View style={styles.selectorCol}>
                <Text style={styles.selectorLabel}>EARLIER</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {snapshots.map((s, i) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.selectorChip, i === leftIdx && styles.selectorChipActive]}
                      onPress={() => { setLeftIdx(i); if (i >= rightIdx) setRightIdx(Math.min(i + 1, snapshots.length - 1)); }}
                    >
                      <Text style={[styles.selectorChipText, i === leftIdx && styles.selectorChipTextActive]} numberOfLines={1}>
                        {s.snapshot_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <Feather name="arrow-right" size={16} color={COLORS.textMuted} style={{ marginTop: 20 }} />
              <View style={styles.selectorCol}>
                <Text style={styles.selectorLabel}>LATER</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {snapshots.map((s, i) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.selectorChip, i === rightIdx && { ...styles.selectorChipActive, borderColor: '#3B82F6' }]}
                      onPress={() => { setRightIdx(i); if (i <= leftIdx) setLeftIdx(Math.max(i - 1, 0)); }}
                    >
                      <Text style={[styles.selectorChipText, i === rightIdx && { ...styles.selectorChipTextActive, color: '#3B82F6' }]} numberOfLines={1}>
                        {s.snapshot_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Side-by-side bars */}
            <View style={styles.compareCard}>
              <Text style={styles.compareLabel}>ALLOCATION BREAKDOWN</Text>
              {(['core', 'growth', 'speculative'] as const).map(cat => {
                const lVal = lBd[cat] || 0;
                const rVal = rBd[cat] || 0;
                const d = rVal - lVal;
                return (
                  <View key={cat} style={styles.compareRow}>
                    <Text style={[styles.catName, { color: CATEGORY_COLORS[cat] }]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.barLeft, { width: `${Math.min(lVal, 100)}%`, backgroundColor: CATEGORY_COLORS[cat] + '60' }]} />
                    </View>
                    <Text style={styles.barValue}>{lVal}%</Text>
                    <Feather name="arrow-right" size={12} color={COLORS.textMuted} />
                    <View style={styles.barContainer}>
                      <View style={[styles.barLeft, { width: `${Math.min(rVal, 100)}%`, backgroundColor: CATEGORY_COLORS[cat] }]} />
                    </View>
                    <Text style={styles.barValue}>{rVal}%</Text>
                    <Text style={[styles.deltaValue, { color: deltaColor(d) }]}>{formatDelta(d)}</Text>
                  </View>
                );
              })}
            </View>

            {/* Summary deltas */}
            <View style={styles.deltaGrid}>
              <View style={styles.deltaCard}>
                <Feather name="layers" size={16} color={COLORS.accent} />
                <Text style={[styles.deltaNum, { color: deltaColor(delta.positions) }]}>{formatDelta(delta.positions)}</Text>
                <Text style={styles.deltaLabel}>Positions</Text>
              </View>
              <View style={styles.deltaCard}>
                <Feather name="percent" size={16} color={COLORS.accent} />
                <Text style={[styles.deltaNum, { color: deltaColor(delta.allocation) }]}>{formatDelta(delta.allocation)}%</Text>
                <Text style={styles.deltaLabel}>Allocation</Text>
              </View>
              <View style={styles.deltaCard}>
                <Feather name="shield" size={16} color={COLORS.accent} />
                <Text style={[styles.deltaNum, { color: deltaColor(delta.core) }]}>{formatDelta(delta.core)}%</Text>
                <Text style={styles.deltaLabel}>Core Shift</Text>
              </View>
            </View>

            {/* Changes */}
            {(addedCompanies.length > 0 || removedCompanies.length > 0) && (
              <View style={styles.changesCard}>
                <Text style={styles.compareLabel}>POSITION CHANGES</Text>
                {addedCompanies.map(p => (
                  <View key={p.company?.id} style={styles.changeRow}>
                    <View style={[styles.changeBadge, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                      <Feather name="plus" size={10} color="#22C55E" />
                    </View>
                    <Text style={styles.changeName}>{p.company?.name}</Text>
                    <Text style={styles.changeAlloc}>{p.allocation}% {p.category}</Text>
                  </View>
                ))}
                {removedCompanies.map(p => (
                  <View key={p.company?.id} style={styles.changeRow}>
                    <View style={[styles.changeBadge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                      <Feather name="minus" size={10} color="#EF4444" />
                    </View>
                    <Text style={[styles.changeName, { textDecorationLine: 'line-through', color: COLORS.textMuted }]}>{p.company?.name}</Text>
                    <Text style={styles.changeAlloc}>{p.allocation}%</Text>
                  </View>
                ))}
                {addedCompanies.length === 0 && removedCompanies.length === 0 && (
                  <Text style={styles.noChanges}>Same companies, different allocations</Text>
                )}
              </View>
            )}

            {/* Strategy notes comparison */}
            {(left.strategy_notes || right.strategy_notes) && (
              <View style={styles.notesCompare}>
                <Text style={styles.compareLabel}>STRATEGY NOTES</Text>
                {left.strategy_notes && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteBoxLabel}>{left.snapshot_name}</Text>
                    <Text style={styles.noteBoxText}>{left.strategy_notes}</Text>
                  </View>
                )}
                {right.strategy_notes && (
                  <View style={[styles.noteBox, { borderColor: 'rgba(59,130,246,0.3)' }]}>
                    <Text style={[styles.noteBoxLabel, { color: '#3B82F6' }]}>{right.snapshot_name}</Text>
                    <Text style={styles.noteBoxText}>{right.strategy_notes}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: COLORS.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%', paddingHorizontal: 20, paddingTop: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textMuted },

  selectorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 16 },
  selectorCol: { flex: 1 },
  selectorLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 6 },
  selectorChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
    marginRight: 6, maxWidth: 120,
  },
  selectorChipActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(139,92,246,0.08)' },
  selectorChipText: { fontSize: 11, color: COLORS.textMuted },
  selectorChipTextActive: { color: COLORS.accent, fontWeight: '600' },

  compareCard: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  compareLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 10 },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  catName: { width: 70, fontSize: 11, fontWeight: '600' },
  barContainer: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.border, overflow: 'hidden' },
  barLeft: { height: '100%', borderRadius: 3 },
  barValue: { width: 28, fontSize: 10, color: COLORS.textMuted, textAlign: 'right' },
  deltaValue: { width: 30, fontSize: 10, fontWeight: '600', textAlign: 'right' },

  deltaGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  deltaCard: {
    flex: 1, alignItems: 'center', backgroundColor: COLORS.bg2,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border, gap: 4,
  },
  deltaNum: { fontSize: 18, fontWeight: '700' },
  deltaLabel: { fontSize: 10, color: COLORS.textMuted },

  changesCard: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  changeBadge: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  changeName: { flex: 1, fontSize: 12, color: COLORS.textPrimary },
  changeAlloc: { fontSize: 11, color: COLORS.textMuted },
  noChanges: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },

  notesCompare: { gap: 8, marginBottom: 12 },
  noteBox: {
    backgroundColor: COLORS.bg2, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  noteBoxLabel: { fontSize: 10, fontWeight: '600', color: COLORS.accent, marginBottom: 4 },
  noteBoxText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, fontStyle: 'italic' },
});
