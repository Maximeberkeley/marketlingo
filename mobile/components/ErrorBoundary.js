import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../lib/constants';
import { log } from '../lib/logger';
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        log.error('[ErrorBoundary] Caught error:', error.message);
        log.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
    render() {
        if (this.state.hasError) {
            return (<View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message || 'Unknown error'}</Text>
          <TouchableOpacity style={styles.button} onPress={() => this.setState({ hasError: false, error: null })}>
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
    message: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24 },
    button: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});
