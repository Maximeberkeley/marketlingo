import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Company, marketCompanies, defaultCompanies } from '../../data/keyPlayersData';
import { CompanyDetailModal } from './CompanyDetailModal';
import { COLORS } from '../../lib/constants';

interface KeyPlayersProps {
  marketId: string;
}

const segmentColors: Record<string, { bg: string; text: string }> = {
  commercial: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  defense: { bg: 'rgba(239,68,68,0.2)', text: '#F87171' },
  space: { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' },
  propulsion: { bg: 'rgba(249,115,22,0.2)', text: '#FB923C' },
  suppliers: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  services: { bg: 'rgba(6,182,212,0.2)', text: '#22D3EE' },
  devices: { bg: 'rgba(167,139,250,0.2)', text: '#C4B5FD' },
  therapeutics: { bg: 'rgba(236,72,153,0.2)', text: '#F472B6' },
  pharma: { bg: 'rgba(99,102,241,0.2)', text: '#818CF8' },
  models: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  hardware: { bg: 'rgba(6,182,212,0.2)', text: '#22D3EE' },
  enterprise: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  payments: { bg: 'rgba(249,115,22,0.2)', text: '#FB923C' },
  investing: { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' },
  infrastructure: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  lending: { bg: 'rgba(251,191,36,0.2)', text: '#FCD34D' },
  neobank: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  charging: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  battery: { bg: 'rgba(99,102,241,0.2)', text: '#818CF8' },
};

export function KeyPlayers({ marketId }: KeyPlayersProps) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showAll, setShowAll] = useState(false);

  const companies = marketCompanies[marketId] || defaultCompanies;
  const displayedCompanies = showAll ? companies : companies.slice(0, 8);

  return (
    <>
      <View style={styles.container}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Text style={{ fontSize: 14 }}>🏢</Text>
            </View>
            <Text style={styles.headerTitle}>Key Players</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{companies.length}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowAll(!showAll)} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>{showAll ? 'Show less ↑' : 'See all →'}</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Scroll (default) or Grid */}
        {showAll ? (
          <View style={styles.grid}>
            {displayedCompanies.map((company) => {
              const segStyle = segmentColors[company.segment] || { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA' };
              return (
                <TouchableOpacity
                  key={company.id}
                  style={styles.gridCard}
                  onPress={() => setSelectedCompany(company)}
                  activeOpacity={0.75}
                >
                  <View style={styles.gridCardLogoRow}>
                    <View style={styles.logoContainer}>
                      {company.logoUrl ? (
                        <Image
                          source={{ uri: company.logoUrl }}
                          style={styles.logoImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textMuted }}>{company.name.charAt(0)}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gridCompanyName} numberOfLines={1}>{company.name}</Text>
                      {company.ticker && (
                        <Text style={styles.gridTicker}>${company.ticker}</Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.segmentBadge, { backgroundColor: segStyle.bg }]}>
                    <Text style={[styles.segmentText, { color: segStyle.text }]}>
                      {company.segment.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {displayedCompanies.map((company) => {
              const segStyle = segmentColors[company.segment] || { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA' };
              return (
                <TouchableOpacity
                  key={company.id}
                  style={styles.card}
                  onPress={() => setSelectedCompany(company)}
                  activeOpacity={0.75}
                >
                  {/* Logo */}
                  <View style={styles.logoContainerLarge}>
                    {company.logoUrl ? (
                      <Image
                        source={{ uri: company.logoUrl }}
                        style={styles.logoImageLarge}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={{ fontSize: 28 }}>{company.logo}</Text>
                    )}
                  </View>

                  {/* Name */}
                  <Text style={styles.companyName} numberOfLines={2}>{company.name}</Text>

                  {/* Ticker */}
                  {company.ticker && (
                    <Text style={styles.tickerText}>${company.ticker}</Text>
                  )}

                  {/* Segment */}
                  <View style={[styles.segmentBadge, { backgroundColor: segStyle.bg, marginTop: 6 }]}>
                    <Text style={[styles.segmentText, { color: segStyle.text }]}>
                      {company.segment.toUpperCase()}
                    </Text>
                  </View>

                  {/* Bottom accent line */}
                  <View style={styles.accentLine} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <CompanyDetailModal
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(139,92,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.bg1,
    borderRadius: 20,
  },
  countText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  seeAllBtn: {},
  seeAllText: { fontSize: 12, color: COLORS.textMuted },
  horizontalList: {
    gap: 10,
    paddingRight: 4,
  },
  card: {
    width: 136,
    padding: 14,
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  logoContainerLarge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoImageLarge: { width: 36, height: 36 },
  companyName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  tickerText: {
    fontSize: 11,
    color: COLORS.accent,
    marginTop: 2,
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.accent,
    opacity: 0.5,
    borderRadius: 1,
  },
  // Grid styles
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48%',
    padding: 12,
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  gridCardLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bg1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoImage: { width: 28, height: 28 },
  gridCompanyName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  gridTicker: {
    fontSize: 11,
    color: COLORS.accent,
  },
  segmentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  segmentText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});
