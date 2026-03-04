import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { COLORS } from '../../lib/constants';
import { SlideMascotCard, getSlidePosition } from '../mascot/SlideMascotCard';

interface Source {
  label: string;
  url: string;
}

interface SlideContentCardProps {
  title: string;
  body: string;
  sources: Source[];
  slideIndex: number;
  totalSlides: number;
  stackTitle: string;
  marketId?: string;
}

export function SlideContentCard({
  title,
  body,
  sources,
  slideIndex,
  totalSlides,
  stackTitle,
  marketId,
}: SlideContentCardProps) {
  const slidePosition = getSlidePosition(slideIndex, totalSlides);

  // Safeguard: ensure title and body are always strings
  const safeTitle = typeof title === 'string' ? title : String(title ?? '');
  const safeBody = typeof body === 'string' ? body : String(body ?? '');
  const safeSources = Array.isArray(sources)
    ? sources.filter((s) => typeof s?.label === 'string' && typeof s?.url === 'string')
    : [];

  return (
    <View style={styles.container}>
      {/* Mascot card on strategic slides */}
      {slidePosition && (
        <SlideMascotCard
          position={slidePosition}
          slideIndex={slideIndex}
          totalSlides={totalSlides}
          marketId={marketId}
        />
      )}

      {/* Content Card */}
      <View style={styles.card}>
        <Text style={styles.title}>{safeTitle}</Text>
        <Text style={styles.body}>{safeBody}</Text>

        {/* Sources */}
        {safeSources.length > 0 && (
          <View style={styles.sourcesSection}>
            <View style={styles.divider} />
            <View style={styles.sourcesRow}>
              {safeSources.map((source, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.sourceChip}
                  onPress={() => Linking.openURL(source.url)}
                >
                  <Text style={styles.sourceText}>{source.label} ↗</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 23,
  },
  sourcesSection: {
    marginTop: 14,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 10,
  },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceChip: {
    backgroundColor: COLORS.bg1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sourceText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
