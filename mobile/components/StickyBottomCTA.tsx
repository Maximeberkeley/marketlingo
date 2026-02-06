import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../lib/constants';

interface StickyBottomCTAProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  secondaryButton?: {
    title: string;
    onPress: () => void;
  };
}

export function StickyBottomCTA({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  secondaryButton,
}: StickyBottomCTAProps) {
  const insets = useSafeAreaInsets();

  const isPrimary = variant === 'primary';
  const buttonStyles = [
    styles.button,
    isPrimary ? styles.primaryButton : styles.secondaryButton,
    disabled && styles.disabledButton,
  ];

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 16) },
        style,
      ]}
    >
      {secondaryButton && (
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { marginBottom: 12 }]}
          onPress={secondaryButton.onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>{secondaryButton.title}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={buttonStyles}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={[styles.buttonText, !isPrimary && styles.secondaryButtonText]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: COLORS.bg0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
  },
  secondaryButton: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
  },
});
