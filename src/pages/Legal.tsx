import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import appIcon from "@/assets/app-icon.png";

const PRIVACY_POLICY = `Last updated: March 9, 2026

LLC Marketverse ("we", "our", or "us") operates the MarketLingo mobile application. This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our app.

**Information We Collect**

• Account Information: When you create an account, we collect your email address and optional username.
• Usage Data: We collect information on how you interact with the app, including lessons completed, XP earned, streaks, and feature usage. This helps us improve your learning experience.
• Device Information: We may collect device type, operating system version, and push notification tokens to deliver notifications you've opted into.

**How We Use Your Information**

• To provide and maintain the MarketLingo service
• To personalize your learning experience based on your selected industry and goals
• To track your progress, streaks, and achievements
• To send push notifications you've opted into (daily reminders, streak alerts, news)
• To process subscription purchases through Apple's In-App Purchase system

**Data Storage & Security**

Your data is stored securely using industry-standard encryption and hosted on secure cloud infrastructure. We use enterprise-grade security including row-level security policies and encrypted data transmission.

**Third-Party Services**

• Apple In-App Purchases: For subscription management
• Push Notification Services: For delivering opted-in notifications
• AI Services: For generating personalized learning content (no personal data is sent to AI providers)

**Data Retention**

We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time through the app's Settings page.

**Children's Privacy**

MarketLingo is not directed to children under 13. We do not knowingly collect personal information from children under 13.

**Changes to This Policy**

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the app.

**Contact Us**

If you have questions about this Privacy Policy, please contact us at contactus@marketlingo.net.`;

const TERMS_OF_SERVICE = `Last updated: March 9, 2026

Please read these Terms of Service ("Terms") carefully before using the MarketLingo mobile application operated by MarketLingo ("us", "we", or "our").

**1. Acceptance of Terms**

By accessing or using MarketLingo, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.

**2. Description of Service**

MarketLingo is an educational platform that provides industry-specific learning content across multiple sectors including aerospace, AI, fintech, biotech, and more. The app offers daily lessons, practice exercises, industry news summaries, and gamified learning features.

**3. User Accounts**

• You must provide accurate and complete information when creating an account.
• You are responsible for safeguarding your account credentials.
• You must notify us immediately of any unauthorized access to your account.

**4. Subscriptions & Payments**

• MarketLingo offers free and premium (Pro) tiers.
• Pro subscriptions are billed through Apple's In-App Purchase system.
• Subscription prices are displayed in the app before purchase.
• Free trials, if offered, automatically convert to paid subscriptions unless cancelled before the trial period ends.
• Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
• Payment will be charged to your Apple ID account at confirmation of purchase.
• You may cancel your subscription at any time through your Apple ID settings.
• Refunds are handled by Apple according to their refund policies.

**5. Auto-Renewable Subscription Terms**

MarketLingo Pro is available as an auto-renewable subscription with the following options:
• Monthly: $9.99/month
• Yearly: $79.99/year (equivalent to $6.67/month)

Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your account settings on the App Store after purchase.

**6. Intellectual Property**

All content, features, and functionality of MarketLingo — including text, graphics, logos, and curriculum materials — are owned by MarketLingo and protected by intellectual property laws.

**7. User Content**

• Notes, saved insights, and other content you create within the app remain yours.
• By using the app, you grant us a license to store and display your content to provide the service.

**8. Acceptable Use**

You agree not to:
• Use the service for any illegal purpose
• Attempt to gain unauthorized access to any part of the service
• Interfere with the proper working of the service
• Share your account credentials with others

**9. Educational Disclaimer**

MarketLingo provides educational content for informational purposes only. Content should not be construed as professional financial, investment, career, or legal advice. Always consult qualified professionals before making important decisions.

**10. Limitation of Liability**

MarketLingo shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.

**11. Termination**

We may terminate or suspend your account at any time for violations of these Terms. You may delete your account at any time through the app's Settings page.

**12. Changes to Terms**

We reserve the right to modify these Terms at any time. Continued use of the app after changes constitutes acceptance of the new Terms.

**13. Governing Law**

These Terms shall be governed by the laws of the State of California, United States.

**Contact Us**

If you have questions about these Terms, please contact us at contactus@marketlingo.net.`;

function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-3" />;
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      return (
        <h3 key={i} className="text-lg font-bold text-foreground mt-6 mb-2">
          {trimmed.replace(/\*\*/g, "")}
        </h3>
      );
    }
    if (trimmed.startsWith("•")) {
      return (
        <p key={i} className="text-muted-foreground text-sm leading-relaxed pl-2 mb-1">
          {trimmed}
        </p>
      );
    }
    return (
      <p key={i} className="text-muted-foreground text-sm leading-relaxed mb-1">
        {trimmed}
      </p>
    );
  });
}

export default function Legal() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = params.get("tab") === "terms" ? "terms" : "privacy";
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">(initialTab);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <img src={appIcon} alt="MarketLingo" className="w-8 h-8 rounded-xl shadow-sm" />
            <span className="font-bold text-lg text-foreground">MarketLingo</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-2 mb-8 bg-secondary rounded-xl p-1">
          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === "privacy"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === "terms"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Terms of Service
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-6">
          {activeTab === "privacy" ? "Privacy Policy" : "Terms of Service"}
        </h1>

        {renderContent(activeTab === "privacy" ? PRIVACY_POLICY : TERMS_OF_SERVICE)}
      </div>
    </div>
  );
}
