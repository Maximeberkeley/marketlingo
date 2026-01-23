import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.94df7a7687ec45218c7386e5aa46d211',
  appName: 'MarketLingo',
  webDir: 'dist',
  server: {
    url: 'https://94df7a76-87ec-4521-8c73-86e5aa46d211.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#3B82F6',
      sound: 'notification.wav',
    },
  },
};

export default config;