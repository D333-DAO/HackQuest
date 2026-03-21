import React from 'react';
import { Lock, CheckCircle2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SkillNode({ node, unlocked, complete, stats, accentColor, selected, onSelect }) {
  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <button
      onClick={onSelect}
      disabled={!unlocked}
      className={cn(
        'flex-1 min-w-[150px] text-left p-4 rounded-xl border-2 transition-all duration-200',
        complete
          ? 'bg-primary/10 border-primary/40 hover:border-primary/60'
          : unlocked
          ? 'bg-secondary/60 border-border hover:border-accent/40 cursor-pointer'
          : 'bg-secondary/20 border-border/30 opacity-50 cursor-not-allowed',
        selected && 'ring-2 ring-inset',
      )}
      style={selected ? { outline: `2px solid ${accentColor}`, outlineOffset: 2 } : {}}
    >
      {/* Icon + lock pts */}
      <div className="flex items-start justify-between mb-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: unlocked ? `${accentColor}20` : 'rgba(51,65,85,0.4)' }}
        >
          {complete ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : unlocked ? (
            <Zap className="w-4 h-4" style={{ color: accentColor }} />
          ) : (
            <Lock className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        {!unlocked && (
          <span className="text-[10px] font-mono text-muted-foreground bg-secondary border border-border/60 rounded px-1.5 py-0.5">
            {node.points}pts
          </span>
        )}
        {complete && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">✓</span>
        )}
      </div>

      <p className="text-sm font-semibold text-foreground leading-tight mb-1">{node.title}</p>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{node.description}</p>

      {/* Progress bar (only when unlocked and has rooms) */}
      {unlocked && stats.total > 0 && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{stats.completed}/{stats.total} rooms</span>
            <span className="text-[10px] font-mono font-semibold" style={{ color: accentColor }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: accentColor }}
            />
          </div>
        </div>
      )}

      {/* Unlock hint */}
      {!unlocked && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          🔒 Earn {node.points - 0} pts to unlock
        </p>
      )}
    </button>
  );
}