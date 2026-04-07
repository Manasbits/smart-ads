"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Brain, ChevronDown } from "lucide-react";

interface ThinkingBlockProps {
  text: string;
  isStreaming: boolean;
  startedAt: number;
}

export function ThinkingBlock({ text, isStreaming, startedAt }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);

  if (isStreaming) {
    return (
      <div className="my-2 bg-muted/20 border border-border/40 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <Brain className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0 animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Thinking
            <span className="animate-pulse">...</span>
          </span>
        </div>
        {text && (
          <div className="px-3 pb-3 max-h-48 overflow-y-auto">
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground/70">
              {text}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="my-2 bg-muted/20 border border-border/40 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 w-full text-left px-3 py-2 text-sm",
          "hover:bg-muted/30 transition-colors duration-150"
        )}
      >
        <Brain className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
        <span className="text-muted-foreground flex-1">
          Thought for {elapsedSeconds} second{elapsedSeconds !== 1 ? "s" : ""}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground/50 shrink-0 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && text && (
        <div className="px-3 pb-3 max-h-64 overflow-y-auto">
          <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground/70">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
