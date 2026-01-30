# iOS App Store Submission Guide for MarketLingo

## Complete Step-by-Step Guide for First-Time Publishers

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

## 🖥️ PHASE 1: Apple Developer Account Setup

### Step 1.1: Create Apple Developer Account
**If you don't have one yet:**

1. Go to [developer.apple.com/enroll](https://developer.apple.com/enroll)
2. Sign in with your Apple ID (or create one)
3. Choose account type:
   - **Individual** ($99/year) - For solo developers
   - **Organization** ($99/year) - For companies (requires D-U-N-S number)
4. Complete payment
5. **Wait 24-48 hours** for account approval

### Step 1.2: Verify Account Access
Once approved, log into:
- [Apple Developer Portal](https://developer.apple.com/account)
- [App Store Connect](https://appstoreconnect.apple.com)

---

## 🔧 PHASE 2: Development Environment Setup

### Step 2.1: Install Required Software (Mac Only)

```bash
# 1. Install Xcode from Mac App Store
# Open App Store → Search "Xcode" → Install (takes 30-60 minutes, ~25GB)

# 2. After Xcode installs, open it once to complete setup
open -a Xcode
# Accept the license agreement when prompted

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

## 📥 PHASE 3: Export & Build Project

### Step 3.1: Export from Lovable

1. In Lovable, click the GitHub icon (top right)
2. Click **"Connect to GitHub"** if not connected
3. Click **"Push to GitHub"** 
4. Choose repository name (e.g., `marketlingo-ios`)
5. Wait for export to complete

### Step 3.2: Clone & Setup on Mac

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/marketlingo-ios.git
cd marketlingo-ios

# Install dependencies
npm install

# Build for production
npm run build

# Add iOS platform (first time only)
npx cap add ios

# Sync web code to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

---

## 🍎 PHASE 4: Xcode Configuration

### Step 4.1: Configure Signing

1. In Xcode, select **"App"** in the left sidebar (blue icon)
2. Select **"App"** target in the middle panel
3. Go to **"Signing & Capabilities"** tab
4. Check **"Automatically manage signing"**
5. Team: Select your Apple Developer account
6. Bundle Identifier: `app.marketlingo.aerospace`

### Step 4.2: App Icons

1. In Xcode, expand **App → App → Assets**
2. Click **"AppIcon"**
3. Drag your 1024x1024 icon to the large square
4. Xcode will auto-generate all sizes

### Step 4.3: Build Settings

1. Select **"App"** target
2. Go to **"Build Settings"** tab
3. Search for **"iOS Deployment Target"**
4. Set to **15.0** (or higher for modern features)

---

## 💰 PHASE 5: RevenueCat Setup (In-App Purchases)

### Step 5.1: Create RevenueCat Account

1. Go to [app.revenuecat.com](https://app.revenuecat.com)
2. Sign up (free account works for testing)
3. Create new project → Name: "MarketLingo"

### Step 5.2: Connect App Store

1. In RevenueCat → Project Settings → Apps
2. Click **"+ New"** → Select **"App Store"**
3. Enter:
   - App Name: `MarketLingo`
   - Bundle ID: `app.marketlingo.aerospace`
4. **Get App Store Connect API Key:**
   - Go to [App Store Connect → Users & Access → Keys](https://appstoreconnect.apple.com/access/api)
   - Click "+" to create new key
   - Name: `RevenueCat`
   - Access: `App Manager`
   - Download the .p8 file
   - Copy Key ID and Issuer ID
5. Upload to RevenueCat

### Step 5.3: Create Products in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app (create first if needed - see Phase 6)
3. **Subscriptions** → **Subscription Groups** → Create group: `Premium`
4. Create subscriptions:

**Monthly ($9.99):**
- Reference Name: `MarketLingo Pro Monthly`
- Product ID: `marketlingo_pro_monthly`
- Duration: 1 Month
- Price: $9.99

**Annual ($79.99):**
- Reference Name: `MarketLingo Pro Annual`
- Product ID: `marketlingo_pro_annual`
- Duration: 1 Year
- Price: $79.99

5. For each subscription, add:
   - Display Name
   - Description
   - Screenshot (for review)

### Step 5.4: Configure RevenueCat Entitlements

1. RevenueCat → Products → Add products from App Store
2. RevenueCat → Entitlements → Create: `pro`
3. Attach both products to `pro` entitlement
4. RevenueCat → API Keys → Copy **Public API Key**
5. Update your code:

```typescript
// In src/hooks/useSubscription.tsx, update the API key:
await Purchases.configure({ apiKey: 'YOUR_REVENUECAT_PUBLIC_KEY' });
```

---

## 📱 PHASE 6: App Store Connect Setup

### Step 6.1: Create App Listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. **My Apps** → **"+"** → **New App**
3. Fill in:
   - **Platforms**: iOS
   - **Name**: MarketLingo
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: app.marketlingo.aerospace
   - **SKU**: marketlingo-v1

### Step 6.2: App Information

Navigate to each section and fill in:

**Version Information:**
- Screenshots (6.7" display required, 5.5" recommended)
- App Previews (optional video)
- Description: (see template below)
- Keywords: `aerospace, learning, education, industry, professional, investing`
- Support URL: Your website or email
- Marketing URL: Your website

**General Information:**
- Subtitle: "Master Industries in 6 Months"
- Category: Education
- Secondary Category: Business

**Age Rating:**
- Complete the questionnaire (most answers will be "No")
- Expected rating: 4+

### Step 6.3: Pricing

1. **Pricing and Availability**
2. Base price: Free (IAP handles subscriptions)
3. Availability: All countries

### Step 6.4: App Privacy

1. Go to **App Privacy**
2. Click **Get Started**
3. Answer: "Yes, we collect data"
4. Data types collected:
   - **Contact Info**: Email (for account)
   - **Usage Data**: Product interaction
5. Mark as "Linked to user"
6. Mark as "Not used for tracking"

---

## 📝 App Store Description Template

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

💼 INVESTMENT LAB (Pro)
• Learn valuation methodologies
• Practice due diligence scenarios
• Risk assessment training
• Portfolio construction skills
• Earn Investment Readiness Certificate

Start your 6-month journey to industry mastery today!

---
SUBSCRIPTION INFORMATION:

MarketLingo Pro unlocks the Investment Lab module with advanced investment training scenarios.

• Monthly: $9.99/month
• Annual: $79.99/year (save 33%)

Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your App Store account settings after purchase.

Privacy Policy: [Your URL]
Terms of Use: [Your URL]
```

---

## 🏗️ PHASE 7: Build & Submit

### Step 7.1: Prepare for Release

1. **Remove test code:**
   - In `src/hooks/useInvestmentLab.tsx`, change:
   ```typescript
   // Change this:
   const unlocked = true; // TEMPORARY
   // To this:
   const unlocked = (userProgress?.current_day || 0) >= 30;
   ```

2. **Rebuild:**
```bash
npm run build
npx cap sync ios
```

### Step 7.2: Archive & Upload

1. In Xcode, select **"Any iOS Device (arm64)"** as target (top toolbar)
2. **Product → Archive** (takes 2-5 minutes)
3. Organizer window opens automatically
4. Select your archive → **"Distribute App"**
5. Choose **"App Store Connect"** → Next
6. Choose **"Upload"** → Next
7. Leave all options checked → Next
8. **"Upload"** (takes 5-10 minutes)

### Step 7.3: Submit for Review

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Click **"+ Version or Platform"** if no version exists
4. In **"Build"** section, click **"+"** and select your uploaded build
5. Fill in "What's New in This Version"
6. **Add for Review** button (bottom right)
7. Answer export compliance: Usually "No" for standard apps
8. **Submit for Review**

---

## ⏱️ PHASE 8: Post-Submission

### What to Expect

| Timeline | Action |
|----------|--------|
| 0-24 hours | "Waiting for Review" status |
| 24-48 hours | Review begins |
| 48-72 hours | Decision (Approved/Rejected) |

### If Rejected

Common reasons and fixes:
- **Missing privacy policy** → Add Privacy Policy URL
- **Broken features** → Fix and resubmit
- **Guideline violation** → Read feedback, adjust app
- **IAP issues** → Verify products are properly configured

### If Approved

1. Set release date (immediate or scheduled)
2. App goes live within 24 hours
3. Monitor App Store Connect for:
   - Downloads
   - Crash reports
   - User reviews

---

## 🔧 Quick Reference

### Terminal Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Build production web app |
| `npx cap sync ios` | Sync web → iOS |
| `npx cap open ios` | Open in Xcode |
| `npx cap run ios` | Run on device/simulator |

### Key URLs

| Resource | URL |
|----------|-----|
| Apple Developer | developer.apple.com |
| App Store Connect | appstoreconnect.apple.com |
| RevenueCat | app.revenuecat.com |
| Capacitor Docs | capacitorjs.com/docs/ios |
| App Review Guidelines | developer.apple.com/app-store/review/guidelines |

### Bundle Identifiers

| Item | Value |
|------|-------|
| App Bundle ID | `app.marketlingo.aerospace` |
| Monthly Product ID | `marketlingo_pro_monthly` |
| Annual Product ID | `marketlingo_pro_annual` |
| RevenueCat Entitlement | `pro` |

---

## 📞 Troubleshooting

### "No signing certificate found"
→ Xcode → Preferences → Accounts → Download certificates

### "Provisioning profile doesn't include capability"
→ Xcode → Signing → Uncheck/recheck "Automatically manage signing"

### "App rejected for missing metadata"
→ Complete all required fields in App Store Connect

### "Binary rejected - ITMS-90809"
→ Update SDK to latest, remove deprecated APIs

### Build fails with CocoaPods error
```bash
cd ios/App
pod install --repo-update
```

---

*Last updated: January 2026*
