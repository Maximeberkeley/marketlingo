import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import appIcon from "@/assets/app-icon.png";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

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
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <p className="text-muted-foreground text-sm mb-6">Last updated: March 9, 2026</p>

        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          LLC Marketverse ("we", "our", or "us") operates the MarketLingo mobile application. This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our app.
        </p>

        <Section title="Information We Collect">
          <BulletList items={[
            "Account Information: When you create an account, we collect your email address and optional username.",
            "Usage Data: We collect information on how you interact with the app, including lessons completed, XP earned, streaks, and feature usage. This helps us improve your learning experience.",
            "Device Information: We may collect device type, operating system version, and push notification tokens to deliver notifications you've opted into.",
          ]} />
        </Section>

        <Section title="How We Use Your Information">
          <BulletList items={[
            "To provide and maintain the MarketLingo service",
            "To personalize your learning experience based on your selected industry and goals",
            "To track your progress, streaks, and achievements",
            "To send push notifications you've opted into (daily reminders, streak alerts, news)",
            "To process subscription purchases through Apple's In-App Purchase system",
          ]} />
        </Section>

        <Section title="Data Storage & Security">
          Your data is stored securely using industry-standard encryption and hosted on secure cloud infrastructure. We use enterprise-grade security including row-level security policies and encrypted data transmission.
        </Section>

        <Section title="Third-Party Services">
          <BulletList items={[
            "Apple In-App Purchases: For subscription management",
            "Push Notification Services: For delivering opted-in notifications",
            "AI Services: For generating personalized learning content (no personal data is sent to AI providers)",
          ]} />
        </Section>

        <Section title="Data Retention">
          We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time through the app's Settings page.
        </Section>

        <Section title="Children's Privacy">
          MarketLingo is not directed to children under 13. We do not knowingly collect personal information from children under 13.
        </Section>

        <Section title="Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the app.
        </Section>

        <Section title="Contact Us">
          If you have questions about this Privacy Policy, please contact us at{" "}
          <a href="mailto:contactus@marketlingo.net" className="text-primary hover:underline">
            contactus@marketlingo.net
          </a>.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-3">{title}</h2>
      {typeof children === "string" ? (
        <p className="text-muted-foreground text-sm leading-relaxed">{children}</p>
      ) : (
        children
      )}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-muted-foreground text-sm leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-muted-foreground">
          {item}
        </li>
      ))}
    </ul>
  );
}
