import Link from "next/link";
import { Zap, ArrowRight, BarChart3, ShoppingBag, Bot } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-semibold">SmartAds</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Your AI-Powered
            <br />
            Marketing Assistant
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Manage Meta Ads campaigns and Shopify stores with a single
            AI&nbsp;chatbot. Built for agencies and teams.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start for Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-20 grid max-w-3xl gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-medium">Meta Ads</h3>
            <p className="text-xs text-muted-foreground">
              Create, manage, and optimize your ad campaigns through
              conversation.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-medium">Shopify</h3>
            <p className="text-xs text-muted-foreground">
              Monitor products, orders, and store analytics — all from chat.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <Bot className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-medium">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              Ask questions, get insights, and take actions with natural
              language.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} SmartAds. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
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
