import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";

const principles = [
  "Ads buy attention — product, site, and CX close the loop.",
  "Platform metrics ≠ your bank account — reconcile Meta with Shopify.",
  "Fix efficiency before you brute-force budget; slow ramps beat surfing spend.",
  "Runway and patience — early volatility is normal while the system learns.",
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SmartAds</span>
          </div>
          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="border-b border-border px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center sm:text-left">
            <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Simple scales. Complexity fails.
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.6rem] md:leading-[1.12]">
              Your Meta + Shopify co-pilot for{" "}
              <span className="text-primary">DTC operators</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:mx-0 sm:max-w-2xl mx-auto">
              One chat to align what Meta reports with what hits your store.
              Built for founders and lean teams who would rather scale a simple
              system than chase a dozen dashboards.
            </p>
            <p className="mx-auto mt-4 max-w-xl border-l-2 border-primary/40 pl-4 text-left font-mono text-xs leading-relaxed text-muted-foreground/90 sm:mx-0">
              It&apos;s Ads Manager — you&apos;re still the manager. SmartAds
              helps the machine do the heavy lifting while you set runway, goals,
              and creative direction.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:items-start sm:flex-row sm:gap-4">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-muted-foreground">
                Connect Meta Ads and Shopify from settings after sign-in.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/25 px-4 py-10 sm:py-12">
          <div className="mx-auto max-w-3xl border-l-4 border-primary pl-5 sm:pl-6">
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Operating principles
            </h2>
            <ul className="mt-4 space-y-3 font-mono text-sm leading-relaxed text-foreground/90 md:text-[0.9375rem]">
              {principles.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="shrink-0 text-primary">—</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl space-y-12">
            <div className="sm:grid sm:grid-cols-[7rem_1fr] sm:gap-8 sm:items-start">
              <span className="font-mono text-xs font-medium text-muted-foreground">
                01 / Meta
              </span>
              <div className="mt-2 sm:mt-0 space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">
                  Campaigns in plain language
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Ask what&apos;s working, what&apos;s eating budget, and where
                  delivery looks thin — without clicking through every ad set.
                  Built around the idea that your ads work as a portfolio, not
                  one magic winner.
                </p>
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="sm:grid sm:grid-cols-[7rem_1fr] sm:gap-8 sm:items-start">
              <span className="font-mono text-xs font-medium text-muted-foreground">
                02 / Shopify
              </span>
              <div className="mt-2 sm:mt-0 space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">
                  Store truth next to ad truth
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Orders and customers where you need them to sanity-check
                  ROAS stories. Profit volume matters more than a perfect number
                  in the Ads UI on pocket change.
                </p>
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="sm:grid sm:grid-cols-[7rem_1fr] sm:gap-8 sm:items-start">
              <span className="font-mono text-xs font-medium text-muted-foreground">
                03 / Coach
              </span>
              <div className="mt-2 sm:mt-0 space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">
                  Continuity, not jargon
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Guidance that matches how you actually sell: same language on
                  the ad and the landing page, creative that earns attention, and
                  pacing you can hold for a month — not just today&apos;s panic
                  move.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} SmartAds. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
