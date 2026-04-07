"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ToolActivity } from "@/components/chat/tool-activity";
import { ThinkingBlock } from "@/components/chat/thinking-block";
import { RichMarkdown } from "@/components/chat/rich-markdown";
import { Zap, User } from "lucide-react";
import type { UIMessage } from "ai";

interface ChatMessageProps {
  role: "user" | "assistant";
  parts: UIMessage["parts"];
  userPhotoURL?: string;
  messageId: string;
  reasoningStartedAt?: number;
}

export function ChatMessage({
  role,
  parts,
  userPhotoURL,
  messageId: _messageId,
  reasoningStartedAt,
}: ChatMessageProps) {
  const isUser = role === "user";

  // Extract text content from parts
  const textContent = parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");

  // Extract tool invocations from parts (dynamic-tool type)
  const toolParts = parts.filter(
    (p): p is Extract<typeof p, { type: "dynamic-tool" }> =>
      p.type === "dynamic-tool"
  );

  // Extract reasoning parts
  const reasoningParts = parts.filter(
    (p): p is Extract<typeof p, { type: "reasoning" }> => p.type === "reasoning"
  );
  const isReasoningStreaming = reasoningParts.some(
    (p) => (p as any).state === "streaming"
  );
  const reasoningText = reasoningParts.map((p) => (p as any).text ?? "").join("");

  return (
    <div
      className={cn(
        "flex gap-3 py-4 px-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Zap className="h-3.5 w-3.5" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[85%] md:max-w-[75%]",
          isUser ? "order-first" : ""
        )}
      >
        {/* ThinkingBlock — shown before tool activity and text */}
        {!isUser && reasoningParts.length > 0 && reasoningText && (
          <ThinkingBlock
            text={reasoningText}
            isStreaming={isReasoningStreaming}
            startedAt={reasoningStartedAt ?? Date.now()}
          />
        )}

        {/* Tool invocations — shown before assistant text */}
        {!isUser && toolParts.length > 0 && (
          <div className="mb-2">
            {toolParts.map((tool) => (
              <ToolActivity
                key={tool.toolCallId}
                toolName={tool.toolName}
                args={
                  tool.state === "input-streaming"
                    ? {}
                    : (tool.input as Record<string, unknown>) ?? {}
                }
                result={
                  tool.state === "output-available"
                    ? tool.output
                    : undefined
                }
                state={
                  tool.state === "output-available"
                    ? "result"
                    : tool.state === "input-available"
                      ? "call"
                      : "partial-call"
                }
              />
            ))}
          </div>
        )}

        {/* Message content */}
        {textContent && (
          <div
            className={cn(
              "rounded-2xl text-sm leading-relaxed",
              isUser
                ? "bg-primary text-primary-foreground px-4 py-2.5"
                : "text-foreground"
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{textContent}</p>
            ) : (
              <RichMarkdown content={textContent} />
            )}
          </div>
        )}
      </div>

      {isUser && (
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarImage src={userPhotoURL} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="h-3.5 w-3.5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
