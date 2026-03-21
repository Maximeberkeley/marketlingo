import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SHADOWS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useInvestmentLab } from '../hooks/useInvestmentLab';
import { usePortfolioSnapshots, PortfolioSnapshot } from '../hooks/usePortfolioSnapshots';
import { marketCompanies, defaultCompanies, Company } from '../data/keyPlayersData';
import { Feather } from '@expo/vector-icons';
import { SnapshotCompare } from '../components/investment/SnapshotCompare';

const LEO_CELEBRATING = require('../assets/mascot/leo-celebrating.png');
const LEO_STUDY = require('../assets/mascot/leo-study.png');

interface PortfolioPosition {
  company: { id: string; name: string; ticker?: string };
  allocation: number; // percentage 0-100
  category: 'core' | 'growth' | 'speculative';
}

const CATEGORY_CONFIG = {
  core: { label: 'Core', color: '#10B981', target: '60-70%', icon: 'shield' as const },
  growth: { label: 'Growth', color: '#3B82F6', target: '20-30%', icon: 'trending-up' as const },
  speculative: { label: 'Speculative', color: '#F59E0B', target: '5-10%', icon: 'zap' as const },
};

export default function PortfolioBuilderScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'core' | 'growth' | 'speculative'>('core');
  const [snapshotName, setSnapshotName] = useState('');
  const [strategyNotes, setStrategyNotes] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    const fetchMarket = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market')
        .eq('id', user.id)
        .single();
      if (profile?.selected_market) setSelectedMarket(profile.selected_market);
      setLoading(false);
    };
    fetchMarket();
  }, [user]);

  const { progress, addToWatchlist } = useInvestmentLab(selectedMarket || undefined);
  const { snapshots, saveSnapshot, loading: snapshotsLoading } = usePortfolioSnapshots(selectedMarket || undefined);
  const watchlist = progress?.watchlist_companies || [];

  // Get suggested companies from Key Players data
  const suggestedCompanies = useMemo(() => {
    const companies = marketCompanies[selectedMarket || ''] || defaultCompanies;
    return companies.slice(0, 12);
  }, [selectedMarket]);

  // Available companies = watchlist + suggestions minus already added
  const availableCompanies = useMemo(() => {
    const positionIds = new Set(positions.map((p) => p.company.id));
    const all = new Map<string, { id: string; name: string; ticker?: string }>();

    // Add watchlist companies first
    watchlist.forEach((c) => {
      if (!positionIds.has(c.id)) all.set(c.id, c);
    });

    // Add suggested companies
    suggestedCompanies.forEach((c) => {
      if (!positionIds.has(c.id)) all.set(c.id, { id: c.id, name: c.name, ticker: c.ticker });
    });

    return Array.from(all.values());
  }, [watchlist, suggestedCompanies, positions]);

  const totalAllocation = positions.reduce((sum, p) => sum + p.allocation, 0);

  const categoryBreakdown = useMemo(() => {
    const breakdown = { core: 0, growth: 0, speculative: 0 };
    positions.forEach((p) => {
      breakdown[p.category] += p.allocation;
    });
    return breakdown;
  }, [positions]);

  const addPosition = (company: { id: string; name: string; ticker?: string }) => {
    const remaining = 100 - totalAllocation;
    const defaultAlloc = Math.min(remaining, selectedCategory === 'core' ? 15 : selectedCategory === 'growth' ? 10 : 5);
    setPositions((prev) => [
      ...prev,
      { company, allocation: defaultAlloc, category: selectedCategory },
    ]);
    setShowAddModal(false);

    // Also add to watchlist if not already there
    if (!watchlist.some((w) => w.id === company.id)) {
      addToWatchlist(company);
    }
  };

  const removePosition = (companyId: string) => {
    setPositions((prev) => prev.filter((p) => p.company.id !== companyId));
  };

  const updateAllocation = (companyId: string, newAlloc: number) => {
    setPositions((prev) =>
      prev.map((p) =>
        p.company.id === companyId ? { ...p, allocation: Math.max(0, Math.min(100, newAlloc)) } : p
      )
    );
  };

  const getFeedback = () => {
    const messages: { type: 'success' | 'warning' | 'error'; text: string }[] = [];

    if (positions.length < 3) {
      messages.push({ type: 'warning', text: 'Add at least 3 companies for basic diversification' });
    }
    if (positions.length > 15) {
      messages.push({ type: 'warning', text: 'Too many positions — consider focusing on your top picks' });
    }
    if (totalAllocation < 95) {
      messages.push({ type: 'warning', text: `${100 - totalAllocation}% unallocated — consider filling your portfolio` });
    }
    if (totalAllocation > 100) {
      messages.push({ type: 'error', text: `Over-allocated by ${totalAllocation - 100}% — reduce some positions` });
    }

    const maxPosition = Math.max(...positions.map((p) => p.allocation), 0);
    if (maxPosition > 30) {
      messages.push({ type: 'warning', text: 'Concentration risk: no position should exceed 25-30%' });
    }

    if (categoryBreakdown.core < 40 && positions.length >= 3) {
      messages.push({ type: 'warning', text: 'Low core allocation — consider adding more established leaders' });
    }
    if (categoryBreakdown.speculative > 20) {
      messages.push({ type: 'warning', text: 'High speculative allocation — limit to 10% for risk management' });
    }

    if (positions.length >= 3 && totalAllocation >= 90 && totalAllocation <= 105 && maxPosition <= 30) {
      messages.push({ type: 'success', text: 'Well-balanced portfolio! Good diversification and position sizing.' });
    }

    return messages;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const feedback = getFeedback();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Portfolio Builder</Text>
          <Text style={styles.subtitle}>Allocate your investment portfolio</Text>
        </View>

        {/* Allocation Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Total Allocated</Text>
            <Text
              style={[
                styles.overviewValue,
                totalAllocation > 100 && { color: '#EF4444' },
                totalAllocation >= 95 && totalAllocation <= 100 && { color: '#22C55E' },
              ]}
            >
              {totalAllocation}%
            </Text>
          </View>

          {/* Allocation Bar */}
          <View style={styles.allocBar}>
            <View
              style={[
                styles.allocFill,
                {
                  width: `${Math.min(categoryBreakdown.core, 100)}%`,
                  backgroundColor: CATEGORY_CONFIG.core.color,
                },
              ]}
            />
            <View
              style={[
                styles.allocFill,
                {
                  width: `${Math.min(categoryBreakdown.growth, 100)}%`,
                  backgroundColor: CATEGORY_CONFIG.growth.color,
                },
              ]}
            />
            <View
              style={[
                styles.allocFill,
                {
                  width: `${Math.min(categoryBreakdown.speculative, 100)}%`,
                  backgroundColor: CATEGORY_CONFIG.speculative.color,
                },
              ]}
            />
          </View>

          {/* Category Legend */}
          <View style={styles.legendRow}>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: config.color }]} />
                <Text style={styles.legendLabel}>
                  {config.label} {categoryBreakdown[key as keyof typeof categoryBreakdown]}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Feedback */}
        {feedback.length > 0 && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>
              <Feather name="cpu" size={14} color={COLORS.accent} /> AI Feedback
            </Text>
            {feedback.map((msg, i) => (
              <View key={i} style={styles.feedbackRow}>
                <Feather
                  name={msg.type === 'success' ? 'check-circle' : msg.type === 'error' ? 'x-circle' : 'alert-circle'}
                  size={14}
                  color={msg.type === 'success' ? '#22C55E' : msg.type === 'error' ? '#EF4444' : '#F59E0B'}
                />
                <Text style={styles.feedbackText}>{msg.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Positions */}
        {positions.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>YOUR POSITIONS</Text>
            {positions.map((pos) => {
              const catConfig = CATEGORY_CONFIG[pos.category];
              return (
                <View key={pos.company.id} style={styles.positionCard}>
                  <View style={styles.positionHeader}>
                    <View
                      style={[styles.catBadge, { backgroundColor: catConfig.color + '15' }]}
                    >
                      <Feather name={catConfig.icon} size={14} color={catConfig.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.positionName} numberOfLines={1}>
                        {pos.company.name}
                      </Text>
                      <Text style={styles.positionTicker}>
                        {pos.company.ticker || catConfig.label}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removePosition(pos.company.id)}
                      style={styles.removeBtn}
                    >
                      <Feather name="x" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Allocation slider-like control */}
                  <View style={styles.allocControl}>
                    <TouchableOpacity
                      style={styles.allocBtn}
                      onPress={() => updateAllocation(pos.company.id, pos.allocation - 5)}
                    >
                      <Text style={styles.allocBtnText}>−</Text>
                    </TouchableOpacity>
                    <View style={styles.allocDisplay}>
                      <Text style={[styles.allocValue, { color: catConfig.color }]}>
                        {pos.allocation}%
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.allocBtn}
                      onPress={() => updateAllocation(pos.company.id, pos.allocation + 5)}
                    >
                      <Text style={styles.allocBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Mini bar */}
                  <View style={styles.miniBar}>
                    <View
                      style={[
                        styles.miniFill,
                        {
                          width: `${Math.min(pos.allocation, 100)}%`,
                          backgroundColor: catConfig.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Add Position */}
        {!showAddModal ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
          >
            <Feather name="plus" size={20} color={COLORS.accent} />
            <Text style={styles.addBtnText}>Add Company</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addModal}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Add to Portfolio</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Category selector */}
            <Text style={styles.catLabel}>Position Type</Text>
            <View style={styles.catRow}>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.catOption,
                    selectedCategory === key && {
                      borderColor: config.color,
                      backgroundColor: config.color + '10',
                    },
                  ]}
                  onPress={() => setSelectedCategory(key as any)}
                >
                  <Feather name={config.icon} size={14} color={config.color} />
                  <Text
                    style={[
                      styles.catOptionText,
                      selectedCategory === key && { color: config.color },
                    ]}
                  >
                    {config.label}
                  </Text>
                  <Text style={styles.catTarget}>{config.target}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Company list */}
            <Text style={styles.catLabel}>Select Company</Text>
            {availableCompanies.length > 0 ? (
              <View style={{ gap: 6 }}>
                {availableCompanies.slice(0, 10).map((company) => {
                  const isWatchlisted = watchlist.some((w) => w.id === company.id);
                  return (
                    <TouchableOpacity
                      key={company.id}
                      style={styles.companyOption}
                      onPress={() => addPosition(company)}
                    >
                      <Feather
                        name={isWatchlisted ? 'star' : 'globe'}
                        size={14}
                        color={isWatchlisted ? '#F59E0B' : COLORS.textMuted}
                      />
                      <Text style={styles.companyOptionName} numberOfLines={1}>
                        {company.name}
                      </Text>
                      {company.ticker && (
                        <Text style={styles.companyOptionTicker}>
                          {company.ticker}
                        </Text>
                      )}
                      <Feather name="plus" size={14} color={COLORS.accent} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noCompanies}>
                All available companies have been added
              </Text>
            )}
          </View>
        )}

        {/* Save & History Actions */}
        {positions.length >= 2 && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <TouchableOpacity
              style={[styles.actionBtn, { flex: 1, backgroundColor: COLORS.accent }]}
              onPress={() => { setSnapshotName(''); setStrategyNotes(''); setShowSaveModal(true); }}
            >
              <Feather name="save" size={16} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Save Snapshot</Text>
            </TouchableOpacity>
            {snapshots.length > 0 && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border }]}
                onPress={() => setShowHistory(!showHistory)}
              >
                <Feather name="clock" size={16} color={COLORS.accent} />
                <Text style={styles.actionBtnText}>{snapshots.length}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Snapshot History */}
        {showHistory && snapshots.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>STRATEGY EVOLUTION</Text>
            {snapshots.map((snap, i) => {
              const bd = snap.category_breakdown || { core: 0, growth: 0, speculative: 0 };
              const prevSnap = snapshots[i + 1];
              return (
                <View key={snap.id} style={styles.snapshotCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Image source={i === 0 ? LEO_CELEBRATING : LEO_STUDY} style={{ width: 28, height: 28 }} resizeMode="contain" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.snapshotName}>{snap.snapshot_name}</Text>
                      <Text style={styles.snapshotDate}>
                        {new Date(snap.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}{(snap.positions || []).length} positions · {snap.total_allocation}%
                      </Text>
                    </View>
                  </View>
                  {/* Mini allocation bar */}
                  <View style={[styles.allocBar, { marginTop: 10, marginBottom: 4 }]}>
                    <View style={[styles.allocFill, { width: `${bd.core}%`, backgroundColor: CATEGORY_CONFIG.core.color }]} />
                    <View style={[styles.allocFill, { width: `${bd.growth}%`, backgroundColor: CATEGORY_CONFIG.growth.color }]} />
                    <View style={[styles.allocFill, { width: `${bd.speculative}%`, backgroundColor: CATEGORY_CONFIG.speculative.color }]} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: CATEGORY_CONFIG.core.color }}>Core {bd.core}%</Text>
                    <Text style={{ fontSize: 10, color: CATEGORY_CONFIG.growth.color }}>Growth {bd.growth}%</Text>
                    <Text style={{ fontSize: 10, color: CATEGORY_CONFIG.speculative.color }}>Spec {bd.speculative}%</Text>
                  </View>
                  {snap.strategy_notes && (
                    <Text style={styles.snapshotNotes} numberOfLines={2}>{snap.strategy_notes}</Text>
                  )}
                  {/* Delta vs previous */}
                  {prevSnap && (
                    <View style={styles.deltaRow}>
                      <Feather name="git-branch" size={11} color={COLORS.textMuted} />
                      <Text style={styles.deltaText}>
                        vs {prevSnap.snapshot_name}: Core {bd.core - ((prevSnap.category_breakdown as any)?.core || 0) >= 0 ? '+' : ''}{bd.core - ((prevSnap.category_breakdown as any)?.core || 0)}%
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Image source={LEO_STUDY} style={{ width: 20, height: 20 }} resizeMode="contain" />
            <Text style={styles.tipsTitle}>Portfolio Tips</Text>
          </View>
          <Text style={styles.tipsItem}>
            Core (60-70%): Established leaders with proven track records
          </Text>
          <Text style={styles.tipsItem}>
            Growth (20-30%): Companies with high expansion potential
          </Text>
          <Text style={styles.tipsItem}>
            Speculative (5-10%): Early-stage or turnaround plays
          </Text>
          <Text style={styles.tipsItem}>
            Aim for 5-10 positions for optimal diversification
          </Text>
        </View>
      </ScrollView>

      {/* Save Snapshot Modal */}
      <Modal visible={showSaveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Image source={LEO_CELEBRATING} style={{ width: 32, height: 32 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Save Strategy Snapshot</Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Record your current portfolio for future comparison</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                <Feather name="x" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Strategy Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Conservative Q1 Strategy"
              placeholderTextColor={COLORS.textMuted}
              value={snapshotName}
              onChangeText={setSnapshotName}
            />
            <Text style={styles.inputLabel}>Strategy Notes (optional)</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 80 }]}
              placeholder="Why did you choose this allocation?"
              placeholderTextColor={COLORS.textMuted}
              value={strategyNotes}
              onChangeText={setStrategyNotes}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.saveBtn, !snapshotName.trim() && { opacity: 0.5 }]}
              disabled={!snapshotName.trim()}
              onPress={async () => {
                await saveSnapshot(
                  snapshotName.trim(),
                  positions.map(p => ({ company: p.company, allocation: p.allocation, category: p.category })),
                  totalAllocation,
                  categoryBreakdown,
                  strategyNotes.trim() || undefined,
                );
                setShowSaveModal(false);
                Alert.alert('Snapshot Saved', 'You can compare strategies in the history section.');
              }}
            >
              <Feather name="save" size={16} color="#fff" />
              <Text style={styles.saveBtnText}>Save Snapshot</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  header: { marginBottom: 20 },
  backText: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  overviewCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewLabel: { fontSize: 13, color: COLORS.textMuted },
  overviewValue: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  allocBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  allocFill: { height: '100%' },
  legendRow: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: COLORS.textMuted },

  feedbackCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  feedbackText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  positionCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  catBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  positionTicker: { fontSize: 11, color: COLORS.textMuted },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  allocBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bg1,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocBtnText: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  allocDisplay: { flex: 1, alignItems: 'center' },
  allocValue: { fontSize: 22, fontWeight: '800' },
  miniBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  miniFill: { height: '100%', borderRadius: 2 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },

  addModal: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addModalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },

  catLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
  },
  catRow: { gap: 8 },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.bg1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catOptionText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  catTarget: { fontSize: 11, color: COLORS.textMuted },

  companyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.bg1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  companyOptionName: { flex: 1, fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  companyOptionTicker: { fontSize: 11, color: COLORS.textMuted },
  noCompanies: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', padding: 20 },

  tipsCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipsTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  tipsItem: { fontSize: 12, color: COLORS.textMuted, lineHeight: 20 },

  // Actions
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },

  // Snapshots
  snapshotCard: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  snapshotName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  snapshotDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  snapshotNotes: { fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 6 },
  deltaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
    paddingTop: 6, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  deltaText: { fontSize: 10, color: COLORS.textMuted },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  inputLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  modalInput: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    fontSize: 14, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, marginTop: 20,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
