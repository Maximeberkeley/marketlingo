import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../lib/constants';
import { log } from '../lib/logger';
const CRASH_REPORT_KEY = 'ml_last_crash_report';
/** First meaningful component-stack line, e.g. "in CourseJourney (at home.tsx:447)". */
function stackLocation(errorInfo) {
    const lines = (errorInfo.componentStack || '')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('in ') && !line.startsWith('in ErrorBoundary'));
    return lines.slice(0, 3).join(' · ');
}
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, location: '' };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        const location = stackLocation(errorInfo);
        this.setState({ location });
        log.error('[ErrorBoundary] Caught error:', error.message);
        log.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
        // Persist so the next launch (or a screenshot of this screen) tells us exactly
        // which component failed — release builds have no console access.
        void AsyncStorage.setItem(CRASH_REPORT_KEY, JSON.stringify({
            message: error.message,
            location,
            stack: (error.stack || '').split('\n').slice(0, 6).join('\n'),
            at: new Date().toISOString(),
        })).catch(() => { });
    }
    render() {
        if (this.state.hasError) {
            return (<View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message || 'Unknown error'}</Text>
          {!!this.state.location && (<Text style={styles.location} numberOfLines={3}>
              {this.state.location}
            </Text>)}
          <TouchableOpacity style={styles.button} onPress={() => this.setState({ hasError: false, error: null, location: '' })}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>);
        }
        return this.props.children;
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg0,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emoji: { fontSize: 48, marginBottom: 16 },
    title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
    message: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 8 },
    location: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24, opacity: 0.7 },
    button: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});
