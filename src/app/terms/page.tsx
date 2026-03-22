import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms & Conditions - SmartAds",
};

export default function TermsPage() {
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
          Terms &amp; Conditions
        </h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Last updated:</strong> March 22,
            2026
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using SmartAds, you agree to be bound by these
              Terms &amp; Conditions. If you do not agree, you may not use our
              service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              2. Description of Service
            </h2>
            <p>
              SmartAds is an AI-powered marketing assistant that allows you to
              manage Meta Ads campaigns and Shopify stores through a
              conversational interface. The service acts on your behalf based on
              your instructions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              3. Account Responsibilities
            </h2>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Maintaining the security of your account and connected services
              </li>
              <li>
                All actions taken through SmartAds on your connected Meta Ads
                and Shopify accounts
              </li>
              <li>
                Reviewing and confirming AI-suggested actions before they are
                executed on your accounts
              </li>
              <li>
                Ensuring your use complies with Meta, Shopify, and applicable
                advertising policies
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              4. Connected Accounts
            </h2>
            <p>
              When you connect your Meta Ads or Shopify accounts, you grant
              SmartAds permission to access and manage those accounts on your
              behalf. You may revoke this access at any time from the Settings
              page. Revoking access will immediately prevent SmartAds from
              taking further actions on that account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              5. AI-Generated Actions
            </h2>
            <p>
              SmartAds uses AI to interpret your instructions and execute
              actions. While we strive for accuracy, AI-generated suggestions
              and actions may not always be perfect. You acknowledge that you are
              ultimately responsible for reviewing and approving actions that
              affect your advertising spend, product listings, or store
              configuration.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              6. Limitation of Liability
            </h2>
            <p>
              SmartAds is provided &ldquo;as is&rdquo; without warranties of
              any kind. We are not liable for any damages arising from the use
              of our service, including but not limited to financial losses from
              advertising campaigns, incorrect AI actions, or service
              interruptions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              7. Prohibited Use
            </h2>
            <p>You may not use SmartAds to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Violate any applicable laws or advertising platform policies
              </li>
              <li>Create misleading or deceptive advertisements</li>
              <li>
                Attempt to gain unauthorized access to other users&apos;
                accounts
              </li>
              <li>Interfere with or disrupt the service</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              8. Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your access to
              SmartAds at our discretion if you violate these terms. You may
              also terminate your account at any time by disconnecting all
              services and requesting account deletion.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              9. Changes to Terms
            </h2>
            <p>
              We may modify these terms at any time. Continued use of SmartAds
              after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">
              10. Contact
            </h2>
            <p>
              For questions about these Terms &amp; Conditions, please contact
              us through our platform.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} SmartAds. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-foreground">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
