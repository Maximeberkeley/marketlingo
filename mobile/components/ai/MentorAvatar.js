import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';
const MENTOR_IMAGES = {
    sophia: require('../../assets/mentors/mentor-sophia.png'),
    kai: require('../../assets/mentors/mentor-kai.png'),
    maya: require('../../assets/mentors/mentor-maya.png'),
    alex: require('../../assets/mentors/mentor-alex.png'),
};
export function MentorAvatar({ mentorId, emoji, name, size = 'md', showName = false, color }) {
    const sizeMap = { sm: 32, md: 44, lg: 60 };
    const dim = sizeMap[size];
    // Resolve image by mentorId or name (lowercase)
    const resolvedId = mentorId || name.toLowerCase();
    const imageSource = MENTOR_IMAGES[resolvedId];
    const borderColor = color || 'rgba(139, 92, 246, 0.4)';
    const bgColor = color ? color + '15' : 'rgba(139, 92, 246, 0.15)';
    return (<View style={styles.container}>
      <View style={[styles.avatar, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bgColor, borderColor }]}>
        {imageSource ? (<Image source={imageSource} style={{ width: dim - 4, height: dim - 4, borderRadius: (dim - 4) / 2, resizeMode: 'cover' }}/>) : (<Text style={{ fontSize: dim * 0.5 }}>{emoji || name.charAt(0)}</Text>)}
      </View>
      {showName && <Text style={styles.name}>{name}</Text>}
    </View>);
}
const styles = StyleSheet.create({
    container: { alignItems: 'center' },
    avatar: {
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    name: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
});
