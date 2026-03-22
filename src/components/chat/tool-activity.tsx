"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Check, ChevronDown } from "lucide-react";

interface ToolActivityProps {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  state: "call" | "partial-call" | "result";
}

function humanizeToolName(name: string): string {
  const mapping: Record<string, string> = {
    META_ADS_GET_INSIGHTS: "Fetching ad insights",
    META_ADS_GET_CAMPAIGNS: "Fetching campaigns",
    META_ADS_GET_ADSETS: "Fetching ad sets",
    META_ADS_GET_ADS: "Fetching ads",
    META_ADS_CREATE_CAMPAIGN: "Creating campaign",
    META_ADS_UPDATE_CAMPAIGN: "Updating campaign",
    SHOPIFY_GET_ORDERS: "Fetching orders",
    SHOPIFY_GET_PRODUCTS: "Fetching products",
    SHOPIFY_GET_CUSTOMERS: "Fetching customers",
  };

  if (mapping[name]) return mapping[name];

  // Fallback: humanize underscore-separated name
  return name
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/^(Get|Fetch|List|Create|Update|Delete)\s/i, (match) => {
      const verb = match.trim().toLowerCase();
      const mapping: Record<string, string> = {
        get: "Fetching",
        fetch: "Fetching",
        list: "Listing",
        create: "Creating",
        update: "Updating",
        delete: "Deleting",
      };
      return (mapping[verb] || match) + " ";
    });
}

export function ToolActivity({ toolName, args, result, state }: ToolActivityProps) {
  const [expanded, setExpanded] = useState(false);
  const isLoading = state === "call" || state === "partial-call";
  const displayName = humanizeToolName(toolName);

  return (
    <div className="my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm",
          "bg-muted/30 border border-border/50",
          "hover:bg-muted/50 transition-colors duration-150"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400 shrink-0" />
        ) : (
          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        )}
        <span className="text-muted-foreground flex-1 truncate">
          {isLoading ? `${displayName}...` : displayName}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground/50 shrink-0 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="mt-1 px-3 py-2 rounded-lg bg-muted/20 border border-border/30 text-xs">
          <div className="space-y-2">
            <div>
              <span className="text-muted-foreground font-medium">Args:</span>
              <pre className="mt-1 overflow-x-auto text-muted-foreground/80 whitespace-pre-wrap">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
            {result !== undefined && (
              <div>
                <span className="text-muted-foreground font-medium">
                  Result:
                </span>
                <pre className="mt-1 overflow-x-auto text-muted-foreground/80 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {typeof result === "string"
                    ? result
                    : JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
