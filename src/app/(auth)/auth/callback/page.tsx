"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "syncing" | "success" | "error";

function detectProvider(params: URLSearchParams): "meta" | "shopify" | null {
  // Shopify always includes 'shop' and 'hmac' params
  if (params.get("shop") && params.get("hmac")) return "shopify";
  // Meta OAuth includes 'code' and 'state'
  if (params.get("code") && params.get("state")) return "meta";
  return null;
}

const PROVIDER_LABELS: Record<string, string> = {
  meta: "Meta Ads",
  shopify: "Shopify",
};

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("syncing");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const provider = detectProvider(searchParams);
  const label = provider ? PROVIDER_LABELS[provider] : "Account";
  const from = searchParams.get("from") || "/settings";

  useEffect(() => {
    if (!provider) {
      setErrorMsg("Could not determine which provider initiated this callback.");
      setStatus("error");
      return;
    }

    // Check for OAuth error from provider
    const oauthError =
      searchParams.get("error") || searchParams.get("error_description");
    if (oauthError) {
      setErrorMsg(oauthError);
      setStatus("error");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const endpoint =
          provider === "meta"
            ? "/api/auth/meta/exchange"
            : "/api/auth/shopify/exchange";

        // Collect all URL params to send to the exchange route
        const body: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          body[key] = value;
        });

        const res = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (cancelled) return;

        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
          setTimeout(() => {
            if (!cancelled) router.push(from);
          }, 2000);
        } else {
          setErrorMsg(data.error ?? "Connection failed. Please try again.");
          setStatus("error");
        }
      } catch {
        if (!cancelled) {
          setErrorMsg("A network error occurred. Please try again.");
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [provider, searchParams, from, router]);

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
          <p className="text-sm text-muted-foreground">Redirecting you back...</p>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-lg font-semibold">Connection failed</h1>
          <p className="text-sm text-muted-foreground">
            {errorMsg ||
              `Could not connect ${label}. The OAuth flow may have been cancelled or timed out.`}
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" onClick={() => router.push(from)}>
              Go back
            </Button>
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
