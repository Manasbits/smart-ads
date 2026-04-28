'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ComponentPropsWithoutRef } from 'react';

interface RichMarkdownProps {
  content: string;
}

export function RichMarkdown({ content }: RichMarkdownProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none leading-7 prose-p:my-4 prose-headings:scroll-m-20 prose-headings:font-semibold prose-headings:text-foreground prose-h1:mt-8 prose-h1:mb-4 prose-h1:text-2xl prose-h2:mt-7 prose-h2:mb-3 prose-h2:text-xl prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-lg prose-h4:mt-5 prose-h4:mb-2 prose-h4:text-base prose-ul:my-4 prose-ol:my-4 prose-li:my-1.5 prose-hr:my-6 prose-blockquote:my-4 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-blockquote:border-l-border prose-blockquote:text-muted-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }: ComponentPropsWithoutRef<"thead">) => (
            <thead className="bg-muted/40" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
            <th className="border-b border-border px-3 py-2 text-left font-medium text-foreground" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
            <td className="border-b border-border/60 px-3 py-2 align-top text-foreground/90" {...props}>
              {children}
            </td>
          ),
          tr: ({ children, ...props }: ComponentPropsWithoutRef<"tr">) => (
            <tr className="odd:bg-background even:bg-muted/10" {...props}>
              {children}
            </tr>
          ),
          pre: ({ children, ...props }: ComponentPropsWithoutRef<'pre'>) => (
            <pre className="rounded-lg bg-muted/50 border border-border p-3 overflow-x-auto" {...props}>
              {children}
            </pre>
          ),
          code: ({ children, className, ...props }: ComponentPropsWithoutRef<'code'>) => {
            const isInline = !className;
            return isInline ? (
              <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs" {...props}>
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
        {content}
      </ReactMarkdown>
    </div>
  );
}
