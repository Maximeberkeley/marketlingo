import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { getMarketName } from '../lib/markets';
import { Feather } from '@expo/vector-icons';

interface RegulatoryItem {
  title: string;
  description: string;
  url?: string;
}

interface MarketRegulatoryData {
  marketName: string;
  mentorTip: string;
  bodies: RegulatoryItem[];
  keyRegulations: { title: string; description: string }[];
  resources: RegulatoryItem[];
}

const REGULATORY_DATA: Record<string, MarketRegulatoryData> = {
  aerospace: {
    marketName: 'Aerospace',
    mentorTip: 'FAA certification is the single biggest time-to-market variable in aerospace startups. Start the process 18-24 months before you need it.',
    bodies: [
      { title: 'FAA', description: 'Federal Aviation Administration — governs all US civil aviation, certifications, and airspace.' },
      { title: 'ITAR', description: 'International Traffic in Arms Regulations — controls defense-related technology exports.' },
      { title: 'FAA AST', description: 'Office of Commercial Space Transportation — licenses commercial launches and reentries.' },
    ],
    keyRegulations: [
      { title: 'Part 135 Air Carrier', description: 'Required for commercial air carrier operations with aircraft under 6,000 lb.' },
      { title: 'Type Certification (TC)', description: 'FAA approval that a new aircraft design is safe for flight.' },
      { title: 'Export Control (EAR/ITAR)', description: 'Restricts export of dual-use and defense-related technologies to foreign nationals.' },
    ],
    resources: [
      { title: 'FAA.gov', description: 'Official regulations, forms, and guidance', url: 'https://www.faa.gov' },
      { title: 'DDTC (ITAR)', description: 'Directorate of Defense Trade Controls', url: 'https://www.pmddtc.state.gov' },
    ],
  },
  healthtech: {
    marketName: 'HealthTech',
    mentorTip: 'The FDA pathway you choose defines your timeline and burn rate. Most digital health tools are Software as a Medical Device (SaMD) — understand this classification first.',
    bodies: [
      { title: 'FDA', description: 'Food and Drug Administration — regulates drugs, devices, and digital health software.' },
      { title: 'HIPAA', description: 'Health Insurance Portability and Accountability Act — governs patient data privacy.' },
      { title: 'CMS', description: 'Centers for Medicare & Medicaid Services — determines reimbursement for digital health.' },
    ],
    keyRegulations: [
      { title: '510(k) Clearance', description: 'For devices substantially equivalent to an existing approved predicate. 3-6 months.' },
      { title: 'De Novo Classification', description: 'For novel low-to-moderate risk devices. Creates a new device classification.' },
      { title: 'HIPAA Compliance', description: 'Any software handling PHI must implement administrative, technical, and physical safeguards.' },
    ],
    resources: [
      { title: 'FDA Device Advice', description: 'Official device guidance', url: 'https://www.fda.gov/medical-devices' },
      { title: 'HHS HIPAA', description: 'HIPAA compliance guidance', url: 'https://www.hhs.gov/hipaa' },
    ],
  },
  biotech: {
    marketName: 'Biotech',
    mentorTip: 'IND applications are your gateway to human trials. File early, engage FDA in pre-IND meetings — it saves years and millions.',
    bodies: [
      { title: 'FDA CDER', description: 'Center for Drug Evaluation & Research — oversees drug approval.' },
      { title: 'FDA CBER', description: 'Center for Biologics Evaluation & Research — oversees biologics, gene therapies, vaccines.' },
      { title: 'NIH', description: 'National Institutes of Health — funds research and governs rDNA research.' },
    ],
    keyRegulations: [
      { title: 'IND Application', description: 'Investigational New Drug — required before testing any drug in humans.' },
      { title: 'NDA / BLA', description: 'New Drug Application / Biologics License Application — required for market approval.' },
      { title: 'GxP Compliance', description: 'Good Manufacturing, Laboratory, and Clinical Practice — quality standards for regulated biotech.' },
    ],
    resources: [
      { title: 'FDA Drug Guidance', description: 'Drug approval process', url: 'https://www.fda.gov/drugs' },
      { title: 'ClinicalTrials.gov', description: 'Clinical trial registry', url: 'https://clinicaltrials.gov' },
    ],
  },
  fintech: {
    marketName: 'Fintech',
    mentorTip: 'Fintech regulation varies radically by product and state. Money transmission licenses alone require 50 separate state applications. Start compliance early and budget 12-18 months.',
    bodies: [
      { title: 'CFPB', description: 'Consumer Financial Protection Bureau — regulates consumer financial products.' },
      { title: 'FinCEN', description: 'Financial Crimes Enforcement Network — governs AML/KYC requirements.' },
      { title: 'OCC', description: 'Office of the Comptroller of the Currency — charters national banks and fintechs.' },
    ],
    keyRegulations: [
      { title: 'Money Transmission License (MTL)', description: 'Required in most states to transmit money. 50-state licensing is costly and slow.' },
      { title: 'AML/KYC Compliance', description: 'Anti-Money Laundering and Know Your Customer requirements for any financial product.' },
      { title: 'PCI DSS', description: 'Payment Card Industry Data Security Standard — required for any card payment processing.' },
    ],
    resources: [
      { title: 'CFPB', description: 'Consumer finance regulations', url: 'https://www.consumerfinance.gov' },
      { title: 'FinCEN', description: 'AML/BSA guidance', url: 'https://www.fincen.gov' },
    ],
  },
  ai: {
    marketName: 'AI & ML',
    mentorTip: 'AI regulation is fast-moving. The EU AI Act is now in force and the US Executive Order on AI shapes federal procurement. Know these before pitching government or healthcare clients.',
    bodies: [
      { title: 'EU AI Act', description: 'World\'s first comprehensive AI regulation — risk-based framework effective 2024-2025.' },
      { title: 'FTC', description: 'Federal Trade Commission — enforces AI-related consumer protection and bias issues.' },
      { title: 'NIST AI RMF', description: 'AI Risk Management Framework — voluntary guidance for trustworthy AI systems.' },
    ],
    keyRegulations: [
      { title: 'EU AI Act Compliance', description: 'High-risk AI systems (HR, healthcare, law enforcement) face mandatory conformity assessments.' },
      { title: 'GDPR for AI', description: 'AI processing EU citizen data must comply with GDPR\'s automated decision-making rules.' },
      { title: 'FTC AI Guidance', description: 'Unfair or deceptive AI claims trigger FTC enforcement. Accuracy claims must be substantiated.' },
    ],
    resources: [
      { title: 'NIST AI RMF', description: 'AI risk framework', url: 'https://airc.nist.gov' },
      { title: 'EU AI Act Portal', description: 'Official EU AI regulation', url: 'https://artificialintelligenceact.eu' },
    ],
  },
  cybersecurity: {
    marketName: 'Cybersecurity',
    mentorTip: 'FedRAMP authorization is the key to selling to US federal agencies — it takes 12-18 months and $500K-$2M but unlocks a massive market.',
    bodies: [
      { title: 'CISA', description: 'Cybersecurity and Infrastructure Security Agency — governs critical infrastructure security.' },
      { title: 'NIST', description: 'National Institute of Standards and Technology — publishes cybersecurity frameworks.' },
      { title: 'FedRAMP', description: 'Federal Risk and Authorization Management Program — cloud security for federal sales.' },
    ],
    keyRegulations: [
      { title: 'NIST CSF 2.0', description: 'Cybersecurity Framework — widely adopted standard for managing cyber risk.' },
      { title: 'SOC 2 Type II', description: 'Security audit report required by most enterprise buyers — plan 6-12 months.' },
      { title: 'FedRAMP Authorization', description: 'Required to sell cloud products to US federal agencies. 12-18 month process.' },
    ],
    resources: [
      { title: 'NIST Cybersecurity', description: 'Frameworks and guidance', url: 'https://www.nist.gov/cyberframework' },
      { title: 'FedRAMP', description: 'Federal cloud authorization', url: 'https://www.fedramp.gov' },
    ],
  },
  ev: {
    marketName: 'Electric Vehicles',
    mentorTip: 'FMVSS compliance is non-negotiable for road vehicles. Start NHTSA engagement 2+ years before your target launch date.',
    bodies: [
      { title: 'NHTSA', description: 'National Highway Traffic Safety Administration — vehicle safety standards.' },
      { title: 'EPA', description: 'Environmental Protection Agency — emissions, fuel economy, and charging standards.' },
      { title: 'DOE', description: 'Department of Energy — EV infrastructure grants and standards.' },
    ],
    keyRegulations: [
      { title: 'FMVSS Compliance', description: 'Federal Motor Vehicle Safety Standards — mandatory for all road vehicles sold in the US.' },
      { title: 'EPA Greenhouse Gas', description: 'EV manufacturers must comply with fleet-wide CO2 emissions standards.' },
      { title: 'IRA Tax Credits', description: 'Inflation Reduction Act EV credits require domestic battery content and assembly rules.' },
    ],
    resources: [
      { title: 'NHTSA', description: 'Vehicle safety regulations', url: 'https://www.nhtsa.gov' },
      { title: 'DOE AFDC', description: 'Alternative fuels data center', url: 'https://afdc.energy.gov' },
    ],
  },
  cleanenergy: {
    marketName: 'Clean Energy',
    mentorTip: 'The IRA created $369B in clean energy incentives — but claiming them requires navigating complex IRS rules, domestic content requirements, and interconnection queues.',
    bodies: [
      { title: 'FERC', description: 'Federal Energy Regulatory Commission — governs wholesale electricity markets and grid access.' },
      { title: 'DOE', description: 'Department of Energy — funds research, loans, and sets energy efficiency standards.' },
      { title: 'EPA', description: 'Environmental Protection Agency — air permits, Clean Power Plan, environmental reviews.' },
    ],
    keyRegulations: [
      { title: 'NEPA Environmental Review', description: 'Required for federally funded or permitted energy projects. Can take 1-5 years.' },
      { title: 'FERC Interconnection', description: 'Grid interconnection queue is 3-6 year backlog in most regions. File early.' },
      { title: 'IRA Investment Tax Credit', description: '30-50% ITC for solar, wind, storage — requires domestic content and prevailing wages.' },
    ],
    resources: [
      { title: 'FERC', description: 'Energy regulatory commission', url: 'https://www.ferc.gov' },
      { title: 'DOE LPO', description: 'DOE loan programs office', url: 'https://www.energy.gov/lpo' },
    ],
  },
  neuroscience: {
    marketName: 'Neuroscience',
    mentorTip: 'Brain data is among the most sensitive personal data. Several states now have neurological data privacy laws — understand them before building consumer BCI products.',
    bodies: [
      { title: 'FDA CDRH', description: 'Center for Devices and Radiological Health — oversees neurostimulation and BCI devices.' },
      { title: 'NIH NINDS', description: 'National Institute of Neurological Disorders — major funder of neurotech research.' },
      { title: 'IRB', description: 'Institutional Review Board — required oversight for any human neuroscience research.' },
    ],
    keyRegulations: [
      { title: '510(k) / De Novo / PMA', description: 'Device pathway depends on risk class. EEG headsets → 510(k); implanted BCIs → PMA.' },
      { title: 'IRB Protocol Approval', description: 'Any human subjects research requires IRB oversight — allows testing to begin.' },
      { title: 'Neural Data Privacy', description: 'Colorado, Texas, and others have neurological privacy laws. Federal rules evolving.' },
    ],
    resources: [
      { title: 'FDA Device Pathways', description: 'Medical device guidance', url: 'https://www.fda.gov/medical-devices' },
      { title: 'NIH NINDS', description: 'Neuro research grants', url: 'https://www.ninds.nih.gov' },
    ],
  },
};

const DEFAULT_REGULATORY: MarketRegulatoryData = {
  marketName: 'Your Industry',
  mentorTip: 'Understanding the regulatory landscape is a founder superpower. Knowing the rules lets you build faster and fundraise more credibly.',
  bodies: [
    { title: 'Federal Agencies', description: 'Industry-specific federal regulators set product standards and market access rules.' },
    { title: 'State Regulators', description: 'State-level permits, licenses, and compliance vary significantly by geography.' },
    { title: 'International Bodies', description: 'EU regulations, ISO standards, and country-specific rules affect global expansion.' },
  ],
  keyRegulations: [
    { title: 'Licensing & Permits', description: 'Most regulated industries require federal and state licenses before operating.' },
    { title: 'Product Standards', description: 'Safety and quality standards are often mandatory for market entry.' },
    { title: 'Data & Privacy', description: 'GDPR, CCPA, and sector-specific rules govern how you handle user data.' },
  ],
  resources: [
    { title: 'Regulations.gov', description: 'US federal regulatory docket', url: 'https://www.regulations.gov' },
    { title: 'USA.gov Businesses', description: 'Federal business licensing guide', url: 'https://www.usa.gov/business' },
  ],
};

export default function RegulatoryHubScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [marketId, setMarketId] = useState<string>('aerospace');

  useEffect(() => {
    const fetchMarket = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market')
        .eq('id', user.id)
        .single();
      if (profile?.selected_market) setMarketId(profile.selected_market);
      setLoading(false);
    };
    fetchMarket();
  }, [user]);

  const data = REGULATORY_DATA[marketId] || { ...DEFAULT_REGULATORY, marketName: getMarketName(marketId) };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.mentorHeader}>
          <View style={styles.mentorAvatar}>
            <Feather name="shield" size={24} color={COLORS.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{data.marketName} Regulatory Hub</Text>
            <Text style={styles.subtitle}>Navigate compliance with confidence</Text>
          </View>
        </View>

        {/* Mentor Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            <Text style={styles.tipLabel}>Mentor Tip: </Text>
            {data.mentorTip}
          </Text>
        </View>

        {/* Regulatory Bodies */}
        <Text style={styles.sectionTitle}>KEY REGULATORY BODIES</Text>
        <View style={{ gap: 8, marginBottom: 24 }}>
          {data.bodies.map((body, idx) => (
            <View key={idx} style={styles.bodyCard}>
              <View style={styles.bodyIcon}>
                <Feather name="shield" size={18} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bodyName}>{body.title}</Text>
                <Text style={styles.bodyDesc}>{body.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Key Regulations */}
        <Text style={styles.sectionTitle}>KEY REGULATIONS</Text>
        <View style={{ gap: 8, marginBottom: 24 }}>
          {data.keyRegulations.map((reg, idx) => (
            <View key={idx} style={styles.regCard}>
              <View style={styles.regNumber}>
                <Text style={styles.regNumberText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.regTitle}>{reg.title}</Text>
                <Text style={styles.regDesc}>{reg.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Resources */}
        <Text style={styles.sectionTitle}>RESOURCES</Text>
        <View style={{ gap: 8 }}>
          {data.resources.map((resource, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.resourceCard}
              onPress={() => resource.url && Linking.openURL(resource.url)}
              activeOpacity={0.7}
            >
              <Image source={APP_ICONS.news} style={{ width: 22, height: 22, resizeMode: 'contain' }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <Text style={styles.resourceDesc}>{resource.description}</Text>
              </View>
              <Text style={{ fontSize: 16, color: COLORS.accent }}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  backText: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 12 },
  mentorHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  mentorAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 2, borderColor: 'rgba(139,92,246,0.4)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  tipCard: { backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', borderRadius: 14, padding: 14, marginBottom: 20 },
  tipText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  tipLabel: { fontWeight: '600', color: COLORS.accent },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10 },
  bodyCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  bodyIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.1)', alignItems: 'center', justifyContent: 'center' },
  bodyName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  bodyDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  regCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  regNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.1)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  regNumberText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  regTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 3 },
  regDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  resourceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.05)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)' },
  resourceTitle: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  resourceDesc: { fontSize: 11, color: COLORS.textMuted },
});
