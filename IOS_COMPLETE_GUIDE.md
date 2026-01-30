# Complete iOS App Store Submission Guide for MarketLingo

## Overview

This guide covers the **complete** workflow to publish MarketLingo to the Apple App Store, including:
1. Development environment setup
2. App Store Connect configuration
3. In-App Purchases (RevenueCat + Apple)
4. Push notifications (optional, deferred for V1)
5. Building and submitting

---

## 📋 Prerequisites

| Requirement | Cost | Notes |
|-------------|------|-------|
| Mac computer | Required | Xcode only runs on macOS |
| Apple Developer Account | $99/year | [developer.apple.com](https://developer.apple.com) |
| RevenueCat Account | Free tier | [revenuecat.com](https://www.revenuecat.com) |
| Xcode 15+ | Free | Download from Mac App Store |

---

## 🔧 Step 1: Development Environment

```bash
# Install Xcode from Mac App Store (takes 30-60 mins)
# Then install command line tools:
xcode-select --install

# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install CocoaPods
sudo gem install cocoapods
```

---

## 📥 Step 2: Export & Setup Project

### A. Export from Lovable

1. In Lovable, click **"Export to GitHub"**
2. Clone to your Mac:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Install dependencies
npm install

# Add iOS platform
npx cap add ios

# Build and sync
npm run build
npx cap sync ios
```

---

## 🍎 Step 3: App Store Connect Setup

### A. Create App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. Click **+** → **App IDs** → **App**
4. Fill in:
   - Description: `MarketLingo`
   - Bundle ID: `app.marketlingo.aerospace` (Explicit)
   - Capabilities: Check **In-App Purchase**
5. Click **Continue** → **Register**

### B. Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. **My Apps** → **+** → **New App**
3. Fill in:

| Field | Value |
|-------|-------|
| Platform | iOS |
| Name | MarketLingo |
| Primary Language | English (U.S.) |
| Bundle ID | app.marketlingo.aerospace |
| SKU | marketlingo-v1 |
| User Access | Full Access |

---

## 💳 Step 4: In-App Purchases (Apple + RevenueCat)

### A. Create Products in App Store Connect

1. In your app → **Monetization** → **In-App Purchases**
2. Click **+** → **Auto-Renewable Subscription**
3. Create Subscription Group: `MarketLingo Pro`
4. Add products:

| Product ID | Reference Name | Price |
|------------|----------------|-------|
| `marketlingo_pro_monthly` | Pro Monthly | $9.99/month |
| `marketlingo_pro_annual` | Pro Annual | $79.99/year |

5. For each product, add:
   - Display Name: "MarketLingo Pro"
   - Description: "Full access to Investment Lab, unlimited trainer, and premium features"

### B. Setup RevenueCat

RevenueCat handles receipt validation and subscription management (so you don't have to build a server).

1. Create account at [revenuecat.com](https://www.revenuecat.com)
2. **Create New Project** → Name: "MarketLingo"
3. **Apps** → **+ New App**
   - Platform: **iOS**
   - App Name: MarketLingo
   - Bundle ID: `app.marketlingo.aerospace`

4. **App Store Connect API Key** (for RevenueCat to verify receipts):
   - Go to App Store Connect → **Users and Access** → **Integrations** → **Keys**
   - Click **+** → Name: "RevenueCat"
   - Access: **Admin**
   - Download the .p8 key file (save securely!)
   - Note the **Key ID** and **Issuer ID**
   - Back in RevenueCat: **App Store Connect API** → Add key

5. **Products** → Import from App Store Connect
   - RevenueCat will auto-detect your subscriptions

6. **Entitlements** → Create entitlement:
   - Identifier: `pro`
   - Attach both subscription products

7. **Offerings** → Create offering:
   - Identifier: `default`
   - Add packages:
     - `$rc_monthly` → `marketlingo_pro_monthly`
     - `$rc_annual` → `marketlingo_pro_annual`

### C. Get API Key

1. In RevenueCat → **API Keys**
2. Copy your **iOS Public API Key**
3. Add to Lovable Cloud secrets:
   - Key: `VITE_REVENUECAT_API_KEY`
   - Value: `appl_xxxxxxxxxxxxxxxx`

---

## ⚙️ Step 5: Configure Xcode

```bash
npx cap open ios
```

### In Xcode:

1. **Select App target** (left sidebar → App)

2. **Signing & Capabilities**:
   - Team: Select your Apple Developer account
   - Bundle Identifier: `app.marketlingo.aerospace`
   - ✅ Automatically manage signing

3. **Add Capabilities** (click **+ Capability**):
   - **In-App Purchase** (required)
   - ~~Push Notifications~~ (deferred for V1)
   - ~~Background Modes~~ (deferred for V1)

4. **General** tab:
   - Display Name: MarketLingo
   - Version: 1.0.0
   - Build: 1

---

## 🏗️ Step 6: Build for Production

```bash
# In your project directory
npm run build
npx cap sync ios
```

### In Xcode:

1. Select **Any iOS Device (arm64)** as build target
2. **Product** → **Archive**
3. Wait for build to complete
4. **Organizer** window opens → Select archive → **Distribute App**
5. Choose **App Store Connect** → **Upload**
6. Wait for upload and processing

---

## 📱 Step 7: App Store Listing

In App Store Connect → Your App → **App Information**:

### Screenshots (Required)

Create screenshots for:
- 6.7" (iPhone 15 Pro Max): 1290 × 2796
- 6.5" (iPhone 14 Plus): 1284 × 2778
- 5.5" (iPhone 8 Plus): 1242 × 2208

Use the screenshots from `/public/appstore/`:
- screenshot-1-home.png
- screenshot-2-trainer.png
- screenshot-3-roadmap.png
- screenshot-4-news.png
- screenshot-5-progress.png

### App Information

| Field | Value |
|-------|-------|
| Category | Education |
| Subtitle | Master Industries in 6 Months |
| Promotional Text | Transform from industry novice to expert with daily micro-lessons |
| Keywords | aerospace, learning, education, industry, investment, professional, career |
| Support URL | https://marketlingo.app/support |
| Marketing URL | https://marketlingo.app |

### Description

```
MarketLingo: Industry Mastery

Master any industry in just 6 months with bite-sized daily lessons, interactive games, and real-world training scenarios.

🚀 20 INDUSTRIES TO MASTER
• Aerospace & Defense
• AI & Machine Learning  
• Fintech & Banking
• Electric Vehicles
• Biotech & Pharma
• Cybersecurity
• Space Technology
• And 13 more...

📚 DAILY LEARNING (5 minutes/day)
• Micro-lessons with expert insights
• Interactive games and speed drills
• Real-world scenario training
• Curated industry news

💼 INVESTMENT LAB (PRO)
• Valuation model training
• Due diligence scenarios
• Risk assessment practice
• Shareable certificates

🎯 PERFECT FOR
• Job seekers researching industries
• Founders validating markets
• Investors understanding sectors
• Professionals transitioning careers

🔥 STAY MOTIVATED
• Daily streak tracking
• XP and level progression
• Achievement badges
• Personal notebook

Start your journey to industry mastery today!

---

SUBSCRIPTION INFORMATION:
• MarketLingo Pro Monthly: $9.99/month
• MarketLingo Pro Annual: $79.99/year (save 33%)

Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in Account Settings after purchase.

Terms: https://marketlingo.app/terms
Privacy: https://marketlingo.app/privacy
```

### App Privacy

| Data Type | Collected | Linked to User | Used for Tracking |
|-----------|-----------|----------------|-------------------|
| Email Address | Yes | Yes | No |
| User ID | Yes | Yes | No |
| Purchase History | Yes | Yes | No |

---

## ✅ Step 8: Submit for Review

1. **Version Information** → Fill all fields
2. **Build** → Select your uploaded build
3. **App Review Information**:
   - Demo account (if needed for testing)
   - Contact info
   - Notes for reviewer: "This is an educational app for learning about various industries. The Investment Lab feature requires completing 30 days of content (for testing, we've temporarily unlocked it)."

4. Click **Submit for Review**

---

## ⏱️ Review Timeline

- **Initial Review**: 24-48 hours typically
- **First App**: May take longer (up to 7 days)
- **Subscription Apps**: Extra scrutiny on payment flows

### Common Rejection Reasons

1. **Broken features** - Test everything!
2. **Missing privacy policy** - Add to settings/website
3. **Subscription issues** - Ensure restore works
4. **Incomplete metadata** - Fill all required fields

---

## 🚀 Post-Launch

### After Approval:

1. **Release immediately** or schedule release
2. **Monitor** App Store Connect for:
   - Crash reports
   - User reviews
   - Sales/subscription metrics

3. **RevenueCat Dashboard**:
   - Track MRR (Monthly Recurring Revenue)
   - Monitor churn rate
   - View subscription analytics

---

## 📞 Resources

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [RevenueCat iOS Docs](https://docs.revenuecat.com/docs/ios-installation)
- [Capacitor iOS Docs](https://capacitorjs.com/docs/ios)
- [Apple Developer Portal](https://developer.apple.com)

---

*Last updated: January 2026*
