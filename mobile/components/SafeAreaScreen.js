import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../lib/constants';
export function SafeAreaScreen({ children, edges = ['top', 'bottom', 'left', 'right'], style, backgroundColor = COLORS.bg0, }) {
    return (<SafeAreaView edges={edges} style={[styles.container, { backgroundColor }, style]}>
      {children}
    </SafeAreaView>);
}
export function ScreenContainer({ children, style, backgroundColor = COLORS.bg0, }) {
    const insets = useSafeAreaInsets();
    return (<View style={[
            styles.container,
            {
                backgroundColor,
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                paddingLeft: insets.left,
                paddingRight: insets.right,
            },
            style,
        ]}>
      {children}
    </View>);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
