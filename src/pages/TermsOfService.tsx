import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import appIcon from "@/assets/app-icon.png";

export default function TermsOfService() {
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
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <p className="text-muted-foreground text-sm mb-6">Last updated: March 9, 2026</p>

        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          Please read these Terms of Service ("Terms") carefully before using the MarketLingo mobile application operated by MarketLingo ("us", "we", or "our").
        </p>

        <Section title="1. Acceptance of Terms">
          By accessing or using MarketLingo, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
        </Section>

        <Section title="2. Description of Service">
          MarketLingo is an educational platform that provides industry-specific learning content across multiple sectors including aerospace, AI, fintech, biotech, and more. The app offers daily lessons, practice exercises, industry news summaries, and gamified learning features.
        </Section>

        <Section title="3. User Accounts">
          <BulletList items={[
            "You must provide accurate and complete information when creating an account.",
            "You are responsible for safeguarding your account credentials.",
            "You must notify us immediately of any unauthorized access to your account.",
          ]} />
        </Section>

        <Section title="4. Pricing">
          <BulletList items={[
            "MarketLingo is completely free to use.",
            "There are no paid tiers, subscriptions, or premium content.",
            "We never ask for payment details.",
          ]} />
        </Section>

        <Section title="5. No In-App Purchases">
          <p className="text-muted-foreground text-sm leading-relaxed">
            The app contains no in-app purchases and no subscriptions. All features and content are unlocked for every user at no cost.
          </p>
        </Section>

        <Section title="6. Intellectual Property">
          All content, features, and functionality of MarketLingo — including text, graphics, logos, and curriculum materials — are owned by MarketLingo and protected by intellectual property laws.
        </Section>

        <Section title="7. User Content">
          <BulletList items={[
            "Notes, saved insights, and other content you create within the app remain yours.",
            "By using the app, you grant us a license to store and display your content to provide the service.",
          ]} />
        </Section>

        <Section title="8. Acceptable Use">
          <p className="text-muted-foreground text-sm leading-relaxed mb-2">You agree not to:</p>
          <BulletList items={[
            "Use the service for any illegal purpose",
            "Attempt to gain unauthorized access to any part of the service",
            "Interfere with the proper working of the service",
            "Share your account credentials with others",
          ]} />
        </Section>

        <Section title="9. Educational Disclaimer">
          MarketLingo provides educational content for informational purposes only. Content should not be construed as professional financial, investment, career, or legal advice. Always consult qualified professionals before making important decisions.
        </Section>

        <Section title="10. Limitation of Liability">
          MarketLingo shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
        </Section>

        <Section title="11. Termination">
          We may terminate or suspend your account at any time for violations of these Terms. You may delete your account at any time through the app's Settings page.
        </Section>

        <Section title="12. Changes to Terms">
          We reserve the right to modify these Terms at any time. Continued use of the app after changes constitutes acceptance of the new Terms.
        </Section>

        <Section title="13. Governing Law">
          These Terms shall be governed by the laws of the State of California, United States.
        </Section>

        <Section title="Contact Us">
          If you have questions about these Terms, please contact us at{" "}
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
