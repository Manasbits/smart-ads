import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - SmartAds",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-semibold">SmartAds</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight mb-8">
          Privacy Policy
        </h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Last updated:</strong> March 22,
            2026
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              1. Information We Collect
            </h2>
            <p>
              When you use SmartAds, we collect information you provide directly,
              including your name, email address, and Google account details used
              for authentication. We also collect data from third-party services
              you connect, such as Meta Ads and Shopify, solely to provide the
              functionality you request.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              2. How We Use Your Information
            </h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide, maintain, and improve SmartAds services</li>
              <li>
                Authenticate your identity and manage your connected accounts
              </li>
              <li>
                Execute actions on Meta Ads and Shopify on your behalf through
                our AI assistant
              </li>
              <li>Communicate with you about your account and service updates</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              3. Third-Party Services
            </h2>
            <p>
              SmartAds integrates with Meta Ads and Shopify using OAuth
              authentication managed by Composio. Your credentials for these
              services are stored securely by Composio and are never stored
              directly on our servers. We only retain connection identifiers
              necessary to access these services on your behalf.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              4. Data Storage and Security
            </h2>
            <p>
              Your data is stored using Firebase and protected with
              industry-standard security measures. We use encrypted connections,
              secure session management, and access controls to protect your
              information. Conversation data and AI interactions are stored to
              provide continuity in your experience.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              5. Data Sharing
            </h2>
            <p>
              We do not sell your personal information. We share data only with
              the third-party services you explicitly connect (Meta Ads,
              Shopify) and with infrastructure providers necessary to operate
              SmartAds (Firebase, Composio, AI model providers).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              6. Your Rights
            </h2>
            <p>
              You can disconnect your Meta Ads and Shopify accounts at any time
              from the Settings page, which revokes our access. You may request
              deletion of your account and associated data by contacting us.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              7. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the updated policy
              on this page with a revised date.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              8. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
              through our platform.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} SmartAds. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
