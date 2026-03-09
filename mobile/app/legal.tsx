import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const PRIVACY_POLICY = `
Last updated: March 9, 2026

MarketLingo ("we", "our", or "us") operates the MarketLingo mobile application. This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our app.

**Information We Collect**

• Account Information: When you create an account, we collect your email address and optional username.
• Usage Data: We collect information on how you interact with the app, including lessons completed, XP earned, streaks, and feature usage. This helps us improve your learning experience.
• Device Information: We may collect device type, operating system version, and push notification tokens to deliver notifications you've opted into.

**How We Use Your Information**

• To provide and maintain the MarketLingo service
• To personalize your learning experience based on your selected industry and goals
• To track your progress, streaks, and achievements
• To send push notifications you've opted into (daily reminders, streak alerts, news)
• To process subscription purchases through Apple's In-App Purchase system

**Data Storage & Security**

Your data is stored securely using industry-standard encryption and hosted on secure cloud infrastructure. We use Supabase for backend services, which provides enterprise-grade security including row-level security policies and encrypted data transmission.

**Third-Party Services**

• Apple In-App Purchases: For subscription management
• Push Notification Services: For delivering opted-in notifications
• AI Services: For generating personalized learning content (no personal data is sent to AI providers)

**Data Retention**

We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time through the app's Settings page.

**Children's Privacy**

MarketLingo is not directed to children under 13. We do not knowingly collect personal information from children under 13.

**Changes to This Policy**

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the app.

**Contact Us**

If you have questions about this Privacy Policy, please contact us at privacy@marketlingo.app.
`;

const TERMS_OF_SERVICE = `
Last updated: March 9, 2026

Please read these Terms of Service ("Terms") carefully before using the MarketLingo mobile application operated by MarketLingo ("us", "we", or "our").

**1. Acceptance of Terms**

By accessing or using MarketLingo, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.

**2. Description of Service**

MarketLingo is an educational platform that provides industry-specific learning content across multiple sectors including aerospace, AI, fintech, biotech, and more. The app offers daily lessons, practice exercises, industry news summaries, and gamified learning features.

**3. User Accounts**

• You must provide accurate and complete information when creating an account.
• You are responsible for safeguarding your account credentials.
• You must notify us immediately of any unauthorized access to your account.

**4. Subscriptions & Payments**

• MarketLingo offers free and premium (Pro) tiers.
• Pro subscriptions are billed through Apple's In-App Purchase system.
• Subscription prices are displayed in the app before purchase.
• Free trials, if offered, automatically convert to paid subscriptions unless cancelled before the trial period ends.
• You may cancel your subscription at any time through your Apple ID settings.
• Refunds are handled by Apple according to their refund policies.

**5. Intellectual Property**

All content, features, and functionality of MarketLingo — including text, graphics, logos, and curriculum materials — are owned by MarketLingo and protected by intellectual property laws.

**6. User Content**

• Notes, saved insights, and other content you create within the app remain yours.
• By using the app, you grant us a license to store and display your content to provide the service.

**7. Acceptable Use**

You agree not to:
• Use the service for any illegal purpose
• Attempt to gain unauthorized access to any part of the service
• Interfere with the proper working of the service
• Share your account credentials with others

**8. Educational Disclaimer**

MarketLingo provides educational content for informational purposes only. Content should not be construed as professional financial, investment, career, or legal advice. Always consult qualified professionals before making important decisions.

**9. Limitation of Liability**

MarketLingo shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.

**10. Termination**

We may terminate or suspend your account at any time for violations of these Terms. You may delete your account at any time through the app's Settings page.

**11. Changes to Terms**

We reserve the right to modify these Terms at any time. Continued use of the app after changes constitutes acceptance of the new Terms.

**12. Governing Law**

These Terms shall be governed by the laws of the State of California, United States.

**Contact Us**

If you have questions about these Terms, please contact us at legal@marketlingo.app.
`;

export default function LegalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(
    params.type === 'terms' ? 'terms' : 'privacy'
  );

  const content = activeTab === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE;
  const title = activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service';

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <View key={i} style={{ height: 12 }} />;
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <Text key={i} style={styles.heading}>
            {trimmed.replace(/\*\*/g, '')}
          </Text>
        );
      }
      if (trimmed.startsWith('•')) {
        return (
          <Text key={i} style={styles.bullet}>
            {trimmed}
          </Text>
        );
      }
      return (
        <Text key={i} style={styles.paragraph}>
          {trimmed}
        </Text>
      );
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderContent(content)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORS.bg1, borderRadius: 12, padding: 3,
  },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.accent,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20 },
  heading: {
    fontSize: 16, fontWeight: '700', color: COLORS.textPrimary,
    marginTop: 16, marginBottom: 8,
  },
  paragraph: {
    fontSize: 14, lineHeight: 22, color: COLORS.textSecondary, marginBottom: 4,
  },
  bullet: {
    fontSize: 14, lineHeight: 22, color: COLORS.textSecondary,
    paddingLeft: 8, marginBottom: 4,
  },
});
