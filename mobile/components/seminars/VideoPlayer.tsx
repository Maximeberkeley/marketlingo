import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

interface Props {
  videoUrl: string | null;
  isLocked: boolean;
  scheduledAt: string;
}

export function VideoPlayer({ videoUrl, isLocked, scheduledAt }: Props) {
  if (isLocked || !videoUrl) {
    const date = new Date(scheduledAt);
    return (
      <View style={styles.locked}>
        <View style={styles.lockIcon}>
          <Feather name="lock" size={28} color="#A5B4FC" />
        </View>
        <Text style={styles.lockTitle}>Video Available Soon</Text>
        <Text style={styles.lockSubtitle}>
          {isLocked
            ? `Unlocks ${date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'No video URL configured'}
        </Text>
      </View>
    );
  }

  // Convert YouTube watch URL to embed if needed
  let embedUrl = videoUrl;
  if (videoUrl.includes('youtube.com/watch')) {
    const videoId = new URL(videoUrl).searchParams.get('v');
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (videoUrl.includes('youtu.be/')) {
    const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  }

  const html = `
    <!DOCTYPE html>
    <html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh}
      iframe{width:100%;height:100%;border:none}</style>
    </head><body>
      <iframe src="${embedUrl}?rel=0&modestbranding=1&playsinline=1" 
        allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>
    </body></html>
  `;

  return (
    <View style={styles.playerContainer}>
      <WebView
        source={{ html }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  playerContainer: { height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  webview: { flex: 1 },
  locked: { height: 220, borderRadius: 16, backgroundColor: '#1E1B4B', alignItems: 'center', justifyContent: 'center', padding: 24 },
  lockIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(165, 180, 252, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  lockTitle: { color: '#E0E7FF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  lockSubtitle: { color: '#A5B4FC', fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
