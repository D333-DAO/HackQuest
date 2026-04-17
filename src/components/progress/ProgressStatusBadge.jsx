import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const CONFIG = {
  not_started: { label: 'Not Started', icon: Circle, className: 'bg-secondary text-muted-foreground border-border' },
  in_progress:  { label: 'In Progress', icon: Clock,   className: 'bg-amber-500/10 text-amber-400 border-amber-400/30' },
  completed:    { label: 'Completed',   icon: CheckCircle2, className: 'bg-primary/10 text-primary border-primary/30' },
};

export default function ProgressStatusBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG.not_started;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}