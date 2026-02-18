import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { useAuth } from '../hooks/useAuth';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, resetPassword } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);

  const handleResetPassword = async () => {
    if (!user?.email) return;
    Alert.alert(
      'Reset Password',
      `Send a password reset email to ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            const { success, error } = await resetPassword(user.email!);
            if (success) {
              Alert.alert('Sent', 'Check your email for the reset link.');
            } else {
              Alert.alert('Error', error || 'Failed to send reset email.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Contact Support', 'Please email support@marketlingo.app to delete your account.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Settings</Text>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Receive updates and reminders</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: COLORS.bg1, true: COLORS.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Daily Reminder</Text>
              <Text style={styles.settingDesc}>Get reminded to complete your lesson</Text>
            </View>
            <Switch
              value={dailyReminder}
              onValueChange={setDailyReminder}
              trackColor={{ false: COLORS.bg1, true: COLORS.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Streak Alerts</Text>
              <Text style={styles.settingDesc}>Warning when streak is at risk</Text>
            </View>
            <Switch
              value={streakAlerts}
              onValueChange={setStreakAlerts}
              trackColor={{ false: COLORS.bg1, true: COLORS.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'Not signed in'}</Text>
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={handleResetPassword}>
            <Text style={{ fontSize: 18 }}>🔑</Text>
            <Text style={styles.menuText}>Reset Password</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/subscription' as any)}>
            <Text style={{ fontSize: 18 }}>👑</Text>
            <Text style={styles.menuText}>Manage Subscription</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={{ fontSize: 18 }}>📜</Text>
            <Text style={styles.menuText}>Terms of Service</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={{ fontSize: 18 }}>🔒</Text>
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DANGER ZONE</Text>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}
            onPress={handleDeleteAccount}
          >
            <Text style={{ fontSize: 18 }}>⚠️</Text>
            <Text style={[styles.menuText, { color: '#EF4444' }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  scrollContent: { paddingHorizontal: 16 },
  backText: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  settingLabel: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  settingDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  chevron: { fontSize: 22, color: COLORS.textMuted },
});
