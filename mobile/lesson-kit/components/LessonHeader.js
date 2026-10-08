import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';
import { tokens } from '../theme/tokens';
const LEO_IMAGE = require('../../assets/mascot/leo-reference.png');
export function LessonHeader({ progress, onExit, onAskLeo, onMore, menuOpen, }) {
    return (<View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity onPress={onExit} style={styles.control} accessibilityRole="button" accessibilityLabel="Close lesson">
          <Feather name="x" size={24} color={tokens.color.textMuted}/>
        </TouchableOpacity>

        <ProgressBar progress={progress} accentColor={tokens.color.lessonAccent}/>
        {onMore && (<TouchableOpacity onPress={onMore} style={styles.control} accessibilityRole="button" accessibilityLabel="Lesson actions" accessibilityState={{ expanded: menuOpen }}>
            <Feather name="more-horizontal" size={22} color={tokens.color.textSecondary}/>
          </TouchableOpacity>)}

        {onAskLeo ? (<TouchableOpacity onPress={onAskLeo} accessibilityRole="button" accessibilityLabel="Ask Leo a question" style={styles.control}>
            <Image source={LEO_IMAGE} style={styles.askLeoImage}/>
          </TouchableOpacity>) : null}
      </View>

    </View>);
}
const styles = StyleSheet.create({
    wrap: {
        paddingHorizontal: tokens.space.lg,
        paddingTop: tokens.space.sm,
        paddingBottom: tokens.space.md,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
    control: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    askLeoImage: { width: 30, height: 30, borderRadius: 15 },
});
