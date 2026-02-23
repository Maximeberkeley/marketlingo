import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Share,
  Platform,
} from 'react-native';
import { COLORS } from '../../lib/constants';

export type MilestoneType = 'streak' | 'level_up' | 'passport_stamp' | 'stage_up';

interface MilestoneShareCardProps {
  visible: boolean;
  type: MilestoneType;
  data: {
    value: number;
    label: string;
    marketName?: string;
    marketEmoji?: string;
    stageName?: string;
    monthName?: string;
    grade?: string;
  };
  onDismiss: () => void;
}

const milestoneConfig: Record<MilestoneType, {
  emoji: string;
  color: string;
  bgColor: string;
  getTitle: (v: number) => string;
  getSubtitle: (data: any) => string;
}> = {
  streak: {
    emoji: '🔥',
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    getTitle: (v) => `${v}-Day Streak!`,
    getSubtitle: () => 'Consistency is the ultimate superpower',
  },
  level_up: {
    emoji: '⚡',
    color: '#EAB308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    getTitle: (v) => `Level ${v} Reached!`,
    getSubtitle: () => 'Knowledge compounds like interest',
  },
  passport_stamp: {
    emoji: '🛂',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    getTitle: (_v) => 'New Stamp Earned!',
    getSubtitle: (d) => d.monthName ? `Completed: ${d.monthName}` : 'Another month mastered',
  },
  stage_up: {
    emoji: '🚀',
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    getTitle: (_v) => 'Stage Unlocked!',
    getSubtitle: (d) => d.stageName || 'Moving up the ranks',
  },
};

export function MilestoneShareCard({ visible, type, data, onDismiss }: MilestoneShareCardProps) {
  const config = milestoneConfig[type];

  const handleShare = async () => {
    const marketInfo = data.marketEmoji && data.marketName
      ? `${data.marketEmoji} ${data.marketName}`
      : '';

    let shareText = '';
    switch (type) {
      case 'streak':
        shareText = `🔥 ${data.value}-day learning streak in ${marketInfo}!\n\nConsistency > intensity. Studying markets daily with MarketLingo 💜`;
        break;
      case 'level_up':
        shareText = `⚡ Just hit Level ${data.value} in ${marketInfo}!\n\nKnowledge compounds. Learning with MarketLingo 💜`;
        break;
      case 'passport_stamp':
        shareText = `🛂 Earned my "${data.monthName}" passport stamp in ${marketInfo}! Grade: ${data.grade || 'A'}\n\nBuilding industry expertise with MarketLingo 💜`;
        break;
      case 'stage_up':
        shareText = `🚀 Unlocked the "${data.stageName}" stage in ${marketInfo}!\n\nLeveling up my market knowledge with MarketLingo 💜`;
        break;
    }

    try {
      await Share.share({
        message: shareText,
        title: `MarketLingo — ${config.getTitle(data.value)}`,
      });
    } catch (_e) {
      // user cancelled
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Badge circle */}
          <View style={[styles.badgeCircle, { backgroundColor: config.bgColor, borderColor: config.color + '40' }]}>
            <Text style={styles.badgeEmoji}>{config.emoji}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: config.color }]}>
            {config.getTitle(data.value)}
          </Text>
          <Text style={styles.subtitle}>{config.getSubtitle(data)}</Text>

          {/* Market badge */}
          {data.marketEmoji && data.marketName && (
            <View style={styles.marketPill}>
              <Text style={{ fontSize: 14 }}>{data.marketEmoji}</Text>
              <Text style={styles.marketPillText}>{data.marketName}</Text>
            </View>
          )}

          {/* Value display */}
          <View style={[styles.valueBox, { backgroundColor: config.bgColor }]}>
            <Text style={[styles.valueText, { color: config.color }]}>
              {data.label}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
              <Text style={styles.shareBtnText}>📤 Share on LinkedIn / Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} activeOpacity={0.7}>
              <Text style={styles.dismissBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  badgeEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  marketPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.bg1,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  marketPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  valueBox: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 24,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  shareBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  dismissBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
