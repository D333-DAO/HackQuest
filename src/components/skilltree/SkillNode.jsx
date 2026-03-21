import React from 'react';
import { Lock, CheckCircle2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SkillNode({ node, unlocked, complete, stats, accentColor, selected, onSelect }) {
  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex-1 min-w-[140px] text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
        complete
          ? 'bg-primary/10 border-primary/40 hover:border-primary/60'
          : unlocked
          ? 'bg-secondary/60 border-border hover:border-accent/40'
          : 'bg-secondary/20 border-border/40 opacity-60 cursor-not-allowed',
        selected && 'ring-2 ring-offset-2 ring-offset-background',
      )}
      style={selected ? { ringColor: accentColor } : {}}
      disabled={!unlocked}
    >
      <div className="flex items-start justify-between mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ background: unlocked ? `${accentColor}20` : undefined }}
        >
          {complete ? (
            <CheckCircle2 className="w-4 h-4 text-primary" />
          ) : unlocked ? (
            <Zap className="w-4 h-4" style={{ color: accentColor }} />
          ) : (
            <Lock className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        {!unlocked && (
          <span className="text-xs text-muted-foreground font-mono">{node.points}pts</span>
        )}
      </div>

      <p className="text-sm font-semibold text-foreground leading-tight mb-1">{node.title}</p>
      <p className="text-xs text-muted-foreground line-clamp-2">{node.description}</p>

      {unlocked && stats.total > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">{stats.completed}/{stats.total} rooms</span>
            <span className="text-xs font-mono" style={{ color: accentColor }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: accentColor }}
            />
          </div>
        </div>
      )}

      {!unlocked && (
        <p className="mt-2 text-xs text-muted-foreground">Earn {node.points} pts to unlock</p>
      )}
    </button>
  );
}