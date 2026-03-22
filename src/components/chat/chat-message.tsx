"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ToolActivity } from "@/components/chat/tool-activity";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Zap, User } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import type { UIMessage } from "ai";

interface ChatMessageProps {
  role: "user" | "assistant";
  parts: UIMessage["parts"];
  userPhotoURL?: string;
}

export function ChatMessage({
  role,
  parts,
  userPhotoURL,
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
              <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-code:text-emerald-400 prose-code:before:content-none prose-code:after:content-none prose-th:text-left prose-table:border prose-table:border-border prose-td:border prose-td:border-border prose-th:border prose-th:border-border prose-td:px-3 prose-td:py-1.5 prose-th:px-3 prose-th:py-1.5 prose-a:text-blue-400">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    pre: ({
                      children,
                      ...props
                    }: ComponentPropsWithoutRef<"pre">) => (
                      <pre
                        className="rounded-lg bg-muted/50 border border-border p-3 overflow-x-auto"
                        {...props}
                      >
                        {children}
                      </pre>
                    ),
                    code: ({
                      children,
                      className,
                      ...props
                    }: ComponentPropsWithoutRef<"code">) => {
                      const isInline = !className;
                      return isInline ? (
                        <code
                          className="rounded bg-muted/50 px-1.5 py-0.5 text-xs"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {textContent}
                </ReactMarkdown>
              </div>
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
