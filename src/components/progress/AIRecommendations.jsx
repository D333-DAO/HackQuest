import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PRIORITY_STYLES = {
  high: 'bg-primary/10 border-primary/30 text-primary',
  medium: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  low: 'bg-secondary border-border text-muted-foreground',
};

const DIFFICULTY_STYLES = {
  beginner: 'bg-primary/10 text-primary',
  easy: 'bg-primary/10 text-primary',
  intermediate: 'bg-amber-400/10 text-amber-400',
  medium: 'bg-amber-400/10 text-amber-400',
  advanced: 'bg-destructive/10 text-destructive',
  hard: 'bg-destructive/10 text-destructive',
};

export default function AIRecommendations({ studentName, studentEmail, enrollments, courseProgress }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke('getCourseRecommendations', {
      studentName,
      studentEmail,
      enrollments,
      courseProgress,
    });
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground text-sm">AI Course Recommendations</span>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading} className="gap-1.5 text-xs">
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> {result ? 'Refresh' : 'Get Recommendations'}</>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {!result && !loading && (
        <div className="p-6 text-center text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Click "Get Recommendations" to let AI analyze this student's progress and suggest next steps.</p>
        </div>
      )}

      {loading && (
        <div className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Analyzing learning patterns...</span>
        </div>
      )}

      {result && expanded && (
        <div className="p-4 space-y-4">
          {/* Summary */}
          {result.summary && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="space-y-2">
              {result.recommendations.map((rec, i) => (
                <div key={i} className={`p-3 rounded-xl border ${PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.low}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-foreground">{rec.title}</span>
                        {rec.type && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wide font-medium">
                            {rec.type}
                          </span>
                        )}
                        {rec.difficulty && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DIFFICULTY_STYLES[rec.difficulty] || ''}`}>
                            {rec.difficulty}
                          </span>
                        )}
                        {rec.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {rec.category.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 opacity-40" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}