# iOS App Store Submission Guide for MarketLingo

## Complete Step-by-Step Guide for Mac Users

---

## 📋 Pre-Submission Checklist

### ✅ Content Completeness (REQUIRED)
- [ ] All 20 industries have full 6-month curriculum
- [ ] 15+ Key Players per industry with complete profiles
- [ ] News/Industry Intel populated for all markets
- [ ] All trainer scenarios have Pro Reasoning, Common Mistakes, Mental Models
- [ ] All content reviewed for quality (no truncated sentences, all terms defined)

### ✅ App Assets Ready
| Asset | Location | Size | Status |
|-------|----------|------|--------|
| App Icon | `public/appstore/app-icon-1024.png` | 1024x1024 | ✓ |
| Feature Graphic | `public/appstore/feature-graphic.png` | 1920x1080 | ✓ |
| Screenshots (5) | `public/appstore/screenshot-*.png` | 1080x1920 | ✓ |
| OG Image | `public/og-image.png` | 1200x630 | ✓ |

---

## 🔧 Step 1: Development Environment Setup

### Install Required Software (One-time)

```bash
# 1. Install Xcode from Mac App Store
# Open App Store → Search "Xcode" → Install (takes 30-60 minutes)

# 2. After Xcode installs, open it once to complete setup
open -a Xcode

# 3. Install Xcode Command Line Tools
xcode-select --install

# 4. Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 5. Install Node.js (if not installed)
brew install node

# 6. Install CocoaPods (required for iOS dependencies)
sudo gem install cocoapods
```

---

## 📥 Step 2: Export Project from Lovable

1. In Lovable, click **"Export to GitHub"** button
2. Choose your GitHub account and create new repository
3. Wait for export to complete
4. Clone to your Mac:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# Install dependencies
npm install
```

---

## 📱 Step 3: Set Up iOS Project

```bash
# Add iOS platform
npx cap add ios

# Sync the project
npx cap sync ios
```

---

## 🔑 Step 4: Firebase Cloud Messaging Setup (For Push Notifications)

### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" → Name it "MarketLingo"
3. Disable Google Analytics (optional) → Create project

### B. Add iOS App to Firebase
1. In Firebase Console → Click iOS icon
2. Bundle ID: `app.marketlingo.aerospace`
3. App nickname: `MarketLingo`
4. Download `GoogleService-Info.plist`

### C. Add Config File to Project
```bash
# Move the downloaded file to your iOS project
mv ~/Downloads/GoogleService-Info.plist ios/App/App/
```

### D. Get APNs Key from Apple Developer
1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Certificates, Identifiers & Profiles → Keys
3. Create new key → Enable "Apple Push Notifications service (APNs)"
4. Download the .p8 file (save it securely!)
5. Note down: Key ID, Team ID

### E. Upload APNs Key to Firebase
1. Firebase Console → Project Settings → Cloud Messaging
2. iOS app configuration → Upload APNs Key (.p8 file)
3. Enter Key ID and Team ID

---

## ⚙️ Step 5: Configure Xcode Project

```bash
# Open project in Xcode
npx cap open ios
```

### In Xcode:

1. **Select the App target** (left sidebar → App)

2. **Signing & Capabilities tab:**
   - Team: Select your Apple Developer account
   - Bundle Identifier: `app.marketlingo.aerospace`
   - Signing Certificate: Automatically manage signing ✓

3. **Add Capabilities:**
   - Click "+ Capability"
   - Add "Push Notifications"
   - Add "Background Modes" → Check "Remote notifications"

4. **Info.plist additions** (already configured in project):
   - UIBackgroundModes: fetch, remote-notification

---

## 🏗️ Step 6: Build for Production

```bash
# Build the web app for production
npm run build

# Sync to iOS
npx cap sync ios
```

### In Xcode:

1. **Select build target**: "Any iOS Device (arm64)"
2. **Product → Build** (or ⌘B) to verify no errors
3. **Product → Archive** (creates distributable build)

---

## 🚀 Step 7: Submit to App Store Connect

### After Archive completes:

1. **Xcode Organizer** opens automatically
2. Select your archive → Click **"Distribute App"**
3. Choose **"App Store Connect"** → Next
4. Choose **"Upload"** → Next
5. Select signing options → Upload

### In App Store Connect:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. My Apps → "+" → New App
3. Fill in details:

| Field | Value |
|-------|-------|
| Platform | iOS |
| Name | MarketLingo |
| Primary Language | English (U.S.) |
| Bundle ID | app.marketlingo.aerospace |
| SKU | marketlingo-v1 |
| User Access | Full Access |

4. **App Information:**
   - Subtitle: "Master Industries in 6 Months"
   - Category: Education
   - Content Rights: Original content

5. **Pricing & Availability:**
   - Price: Free (or your choice)
   - Available in all territories

6. **App Privacy:**
   - Data collected: Email (for account)
   - Data linked to user: Yes
   - Used for tracking: No

7. **Version Information:**
   - Screenshots: Upload for all required device sizes
   - Description: (see below)
   - Keywords: aerospace, learning, education, industry, professional
   - Support URL: Your website
   - Marketing URL: Your website

---

## 📝 App Store Description

```
MarketLingo: Industry Mastery

Master any industry in just 6 months with bite-sized daily lessons, interactive games, and real-time news.

🚀 20 INDUSTRIES TO MASTER
• Aerospace & Defense
• AI & Machine Learning  
• Neuroscience & BCI
• Fintech & Banking
• Electric Vehicles
• Biotech & Pharma
• Cybersecurity
• Space Technology
• HealthTech
• Robotics & Automation
• Clean Energy
• Climate Tech
• AgTech
• Logistics
• Web3 & Crypto
...and more!

📚 DAILY LEARNING
• 5-minute micro-lessons with expert insights
• Interactive games and speed drills
• Real-world scenario training with pro reasoning
• Curated industry news and analysis

🎯 DESIGNED FOR PROFESSIONALS
• Job seekers researching industries
• Aspiring founders validating markets
• Investors understanding sectors
• Professionals transitioning careers

🔥 STREAK-BASED MOTIVATION
• Daily streak tracking
• XP and level progression
• Achievement badges
• Personal notebook for insights

💡 MENTOR-GUIDED LEARNING
• AI mentors provide personalized tips
• Industry-specific guidance
• Real company case studies
• Expert mental models

Start your 6-month journey to industry mastery today!
```

---

## ⏱️ Step 8: Post-Submission

1. **Review Time**: Typically 24-48 hours
2. **Respond Promptly**: Check for reviewer questions
3. **Common Rejection Reasons**:
   - Incomplete metadata
   - Broken links
   - Missing privacy policy
   - Performance issues

4. **Once Approved**: 
   - Release immediately or schedule
   - Set up app analytics
   - Monitor crash reports

---

## 🔧 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run build` | Build production web app |
| `npx cap sync ios` | Sync web → iOS |
| `npx cap open ios` | Open in Xcode |
| `npx cap run ios` | Run on device/simulator |

| Secret | Description | Location |
|--------|-------------|----------|
| FCM_SERVER_KEY | Firebase push notifications | Lovable Cloud |
| APNs Key (.p8) | Apple push certificate | Firebase Console |

---

## 📞 Support Resources

- [Capacitor iOS Docs](https://capacitorjs.com/docs/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Apple Developer Portal](https://developer.apple.com)

---

*Last updated: January 2026*
