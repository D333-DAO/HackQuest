import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PathLearningMaterial({ material }) {
  const [expanded, setExpanded] = useState(false);

  if (!material) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Tools & Techniques Guide</p>
            <p className="text-xs text-muted-foreground">Comprehensive learning material for this path</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-border">
          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none mt-4">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-xl font-bold text-foreground mb-4 mt-6 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground mb-3 mt-5 border-b border-border pb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold text-primary mb-2 mt-4">{children}</h3>,
                p: ({ children }) => <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="text-sm text-muted-foreground mb-3 ml-4 space-y-1 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="text-sm text-muted-foreground mb-3 ml-4 space-y-1 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                code: ({ inline, children }) => 
                  inline ? (
                    <code className="px-1.5 py-0.5 bg-secondary rounded text-xs font-mono text-primary">{children}</code>
                  ) : (
                    <code className="block bg-secondary/50 border border-border rounded-lg p-3 text-xs font-mono text-foreground overflow-x-auto my-3">{children}</code>
                  ),
                pre: ({ children }) => <pre className="bg-secondary/50 border border-border rounded-lg p-4 overflow-x-auto my-4 text-xs">{children}</pre>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-4">{children}</blockquote>,
              }}
            >
              {material}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}