"use client";

import { useRef, useCallback, type KeyboardEvent, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Loader2 } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustHeight();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit();
        // Reset height
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    }
  };

  return (
    <div className="p-4">
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3",
          "focus-within:ring-1 focus-within:ring-ring/50 transition-all duration-200"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your campaigns, orders, performance..."
          disabled={isLoading}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm leading-relaxed",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none disabled:opacity-50",
            "max-h-[200px]"
          )}
        />
        <Button
          onClick={onSubmit}
          disabled={!value.trim() || isLoading}
          size="icon"
          className="h-8 w-8 shrink-0 rounded-xl"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground/40 mt-2">
        SmartAds AI can make mistakes. Verify important data.
      </p>
    </div>
  );
}
