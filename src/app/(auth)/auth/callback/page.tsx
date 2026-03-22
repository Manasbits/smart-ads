"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOLKIT_LABELS: Record<string, string> = {
  METAADS: "Meta Ads",
  SHOPIFY: "Shopify",
};

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"syncing" | "success" | "error">(
    "syncing"
  );

  const toolkit = searchParams.get("toolkit") || "";
  const from = searchParams.get("from") || "/settings";
  const label = TOOLKIT_LABELS[toolkit] || toolkit;

  useEffect(() => {
    if (!toolkit) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/integrations/sync-connection", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolkit }),
        });

        if (cancelled) return;

        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setTimeout(() => {
            if (!cancelled) router.push(from);
          }, 2000);
        } else {
          setStatus("error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toolkit, from, router]);

  const handleRetry = async () => {
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolkit, from }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch {
      // Stay on error state
    }
  };

  return (
    <div className="max-w-sm w-full text-center space-y-4 px-4">
      {status === "syncing" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h1 className="text-lg font-semibold">Connecting {label}...</h1>
          <p className="text-sm text-muted-foreground">
            Verifying your connection
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h1 className="text-lg font-semibold">
            {label} connected successfully!
          </h1>
          <p className="text-sm text-muted-foreground">
            Redirecting you back...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-lg font-semibold">Connection failed</h1>
          <p className="text-sm text-muted-foreground">
            Could not connect {label}. The OAuth flow may have been cancelled
            or timed out.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" onClick={() => router.push(from)}>
              Go back
            </Button>
            <Button onClick={handleRetry}>Try again</Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Suspense
        fallback={
          <div className="max-w-sm w-full text-center space-y-4 px-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-lg font-semibold">Loading...</h1>
          </div>
        }
      >
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
