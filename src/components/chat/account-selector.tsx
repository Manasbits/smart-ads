"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ConnectedAccount } from "@/types";

interface AccountSelectorProps {
  connectedAccounts: ConnectedAccount[];
}

export function AccountSelector({ connectedAccounts }: AccountSelectorProps) {
  const router = useRouter();
  const {
    activeMetaAdsAccountId,
    setActiveMetaAdsAccountId,
    activeShopifyStoreId,
    setActiveShopifyStoreId,
  } = useUIStore();

  const metaAccounts = connectedAccounts.filter(
    (a) => a.provider === "meta_ads"
  );
  const shopifyAccounts = connectedAccounts.filter(
    (a) => a.provider === "shopify"
  );

  if (connectedAccounts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/settings")}
          className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <LinkIcon className="h-3 w-3" />
          Connect accounts to get started
        </Button>
      </div>
    );
  }

  const activeMetaName =
    metaAccounts.find((a) => a.accountId === activeMetaAdsAccountId)
      ?.accountName || "Select account";
  const activeShopifyName =
    shopifyAccounts.find((a) => a.accountId === activeShopifyStoreId)
      ?.accountName || "Select store";

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto">
      {/* Meta Ads selector */}
      {metaAccounts.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs",
                "border border-border bg-muted/30 hover:bg-muted/50 transition-colors",
                activeMetaAdsAccountId &&
                  "ring-1 ring-blue-500/50 border-blue-500/30"
              )}
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              {activeMetaName}
              <ChevronDown className="h-2.5 w-2.5 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setActiveMetaAdsAccountId(null)}>
              All Meta Ads accounts
            </DropdownMenuItem>
            {metaAccounts.map((acc) => (
              <DropdownMenuItem
                key={acc.accountId}
                onClick={() => setActiveMetaAdsAccountId(acc.accountId)}
              >
                {acc.accountName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Shopify selector */}
      {shopifyAccounts.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs",
                "border border-border bg-muted/30 hover:bg-muted/50 transition-colors",
                activeShopifyStoreId &&
                  "ring-1 ring-emerald-500/50 border-emerald-500/30"
              )}
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.337 3.415c-.144-.073-.31-.04-.427.047-.028.02-.06.047-.09.073-.4.33-.845.554-1.3.737.166-.58.31-1.25.31-1.91 0-.047-.004-.093-.007-.14-.003-.046-.01-.093-.016-.14-.09-.68-.53-1.01-.99-1.07h-.09c-.34 0-.75.17-1.14.47-.32.24-.62.56-.88.93-.4-.1-.8-.17-1.18-.2.02-.72.08-1.39.16-1.87.03-.17-.02-.35-.14-.48-.12-.13-.3-.2-.47-.19-.68.04-1.27.58-1.72 1.5-.15.31-.28.67-.38 1.06-.95.22-1.6.38-1.62.38-.47.13-.49.14-.55.58C4.4 5.88 2 21.27 2 21.27l12.31 2.15.14-.02V3.5c-.38-.02-.76-.05-1.11-.08z" />
              </svg>
              {activeShopifyName}
              <ChevronDown className="h-2.5 w-2.5 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setActiveShopifyStoreId(null)}>
              All Shopify stores
            </DropdownMenuItem>
            {shopifyAccounts.map((acc) => (
              <DropdownMenuItem
                key={acc.accountId}
                onClick={() => setActiveShopifyStoreId(acc.accountId)}
              >
                {acc.accountName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
