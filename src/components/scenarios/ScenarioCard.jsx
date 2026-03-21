import React from 'react';
import { Pencil, Trash2, Zap } from 'lucide-react';

const SEV_STYLE = {
  critical: 'text-destructive bg-destructive/10 border-destructive/20',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

export default function ScenarioCard({ scenario, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 group hover:border-accent/30 transition-colors">
      <div className="text-2xl shrink-0">{scenario.icon || '🔥'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{scenario.name}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEV_STYLE[scenario.severity] || SEV_STYLE.medium}`}>
            {scenario.severity?.toUpperCase()}
          </span>
          {scenario.category && (
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{scenario.category}</span>
          )}
        </div>
        {scenario.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{scenario.description}</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-2">
          <span>{scenario.phases?.length || 0} phases</span>
          <span>·</span>
          <span>{scenario.compatible_targets?.length || 0} targets</span>
          <span>·</span>
          <Zap className="w-3 h-3 text-accent inline" />
          <span className="text-accent">Custom</span>
        </p>
      </div>
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}