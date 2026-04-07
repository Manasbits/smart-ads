'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import type { ComponentPropsWithoutRef } from 'react';

const MermaidBlock = dynamic(() => import('./mermaid-block').then(m => m.MermaidBlock), { ssr: false });
const ChartBlock = dynamic(() => import('./chart-block').then(m => m.ChartBlock), { ssr: false });

interface RichMarkdownProps {
  content: string;
}

export function RichMarkdown({ content }: RichMarkdownProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-code:text-emerald-400 prose-code:before:content-none prose-code:after:content-none prose-th:text-left prose-table:border-collapse prose-table:border prose-table:border-border prose-td:border prose-td:border-border prose-th:border prose-th:border-border prose-td:px-3 prose-td:py-1.5 prose-th:px-3 prose-th:py-1.5 prose-a:text-blue-400 [&_tbody_tr:nth-child(even)]:bg-muted/10">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children, ...props }: ComponentPropsWithoutRef<'pre'>) => (
            <pre className="rounded-lg bg-muted/50 border border-border p-3 overflow-x-auto" {...props}>
              {children}
            </pre>
          ),
          code: ({ children, className, ...props }: ComponentPropsWithoutRef<'code'>) => {
            const language = className?.replace('language-', '');
            const code = String(children).replace(/\n$/, '');

            if (language === 'mermaid') {
              return <MermaidBlock code={code} />;
            }
            if (language === 'chart') {
              return <ChartBlock code={code} />;
            }

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
