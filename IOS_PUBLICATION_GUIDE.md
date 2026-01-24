# iOS Publication Checklist for MarketLingo

## ✅ Generated Assets

All assets are in the `public/appstore/` folder:

| Asset | File | Size | Purpose |
|-------|------|------|---------|
| App Icon | `app-icon-1024.png` | 1024x1024 | App Store icon |
| Feature Graphic | `feature-graphic.png` | 1920x1080 | Marketing banner |
| Screenshot 1 | `screenshot-1-home.png` | 1080x1920 | Home screen |
| Screenshot 2 | `screenshot-2-trainer.png` | 1080x1920 | Quiz/Trainer |
| Screenshot 3 | `screenshot-3-roadmap.png` | 1080x1920 | Learning path |
| Screenshot 4 | `screenshot-4-news.png` | 1080x1920 | News feed |
| Screenshot 5 | `screenshot-5-progress.png` | 1080x1920 | Profile stats |
| OG Image | `og-image.png` | 1200x630 | Social sharing |
| Apple Touch Icon | `apple-touch-icon.png` | 512x512 | iOS home screen |

**Note:** The AI-generated screenshots have placeholder text. For App Store submission, you should capture real screenshots from the app running on a device.

## 1. Firebase Cloud Messaging Setup

### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project "MarketLingo"
3. Add iOS app with bundle ID: `app.marketlingo.aerospace`

### B. Get FCM Server Key
1. Go to Project Settings → Cloud Messaging
2. Copy the "Server key" (legacy)
3. Add it as `FCM_SERVER_KEY` secret in Lovable (already done ✓)

### C. Download GoogleService-Info.plist
1. Download from Firebase Console → Project Settings → iOS app
2. Place in `ios/App/App/GoogleService-Info.plist`

### D. Update iOS Capabilities
In Xcode, enable:
- Push Notifications
- Background Modes → Remote notifications

## 3. Capacitor iOS Setup

```bash
# After cloning the repo
npm install
npx cap add ios
npx cap sync ios
```

### Edit ios/App/App/Info.plist
Add these keys:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

## 4. Push Notification Certificates (Required for Production)

### A. Apple Push Notification Service (APNs)
1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Certificates, IDs & Profiles → Keys
3. Create new key with "Apple Push Notifications service (APNs)"
4. Download the .p8 key file
5. Upload to Firebase Console → Project Settings → Cloud Messaging → iOS app configuration

### B. App ID Configuration
1. In Apple Developer Portal, create App ID: `app.marketlingo.aerospace`
2. Enable Push Notifications capability
3. Create provisioning profile with this App ID

## 5. App Store Connect Preparation

### App Information
- **App Name**: MarketLingo
- **Subtitle**: Master Aerospace in 6 Months
- **Category**: Education
- **Content Rating**: 4+

### App Privacy
- Data collected: Email (for account)
- Data linked to user: Yes
- Data used for tracking: No

### Screenshots Required
- 6.7" Display (iPhone 15 Pro Max): 1290 x 2796
- 6.5" Display (iPhone 14 Plus): 1242 x 2688
- 5.5" Display (iPhone 8 Plus): 1242 x 2208

### Description (Draft)
```
MarketLingo: Aerospace Edition

Master the aerospace industry in just 6 months with bite-sized daily lessons, interactive games, and real-time news.

FEATURES:
📚 Daily micro-lessons on aerospace concepts
🎮 Interactive games to test your knowledge
📰 Real-time industry news and analysis
🔥 Streak tracking to keep you motivated
📝 Personal notebook for insights
🏆 Progress tracking through 180-day journey

Perfect for:
• Aspiring aerospace professionals
• Industry newcomers
• Finance professionals covering aerospace
• Anyone curious about the space and defense sector

Learn like Duolingo, but for aerospace industry knowledge!
```

## 6. Build & Submit

```bash
# Build for production
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios

# In Xcode:
# 1. Select "Any iOS Device" as build target
# 2. Product → Archive
# 3. Distribute App → App Store Connect
# 4. Upload
```

## 7. Post-Submission

- Wait for App Review (typically 24-48 hours)
- Respond to any reviewer questions promptly
- Once approved, release to App Store

---

## Quick Reference

| Secret | Description | Status |
|--------|-------------|--------|
| FCM_SERVER_KEY | Firebase Cloud Messaging server key | ✓ Added |

| Capability | Required | Notes |
|------------|----------|-------|
| Push Notifications | Yes | For daily reminders |
| Background Modes | Yes | Remote notifications |

| File | Location | Purpose |
|------|----------|---------|
| GoogleService-Info.plist | ios/App/App/ | Firebase config |
| capacitor.config.ts | / | Capacitor config |
