import React from 'react';

export default function CategoryScoreCards({ categoryStats, categoryMeta }) {
  const entries = Object.entries(categoryStats)
    .filter(([, s]) => s.total > 0)
    .sort((a, b) => b[1].points - a[1].points);

  if (!entries.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {entries.map(([cat, s]) => {
        const meta = categoryMeta[cat];
        const pct = Math.round((s.completed / s.total) * 100);
        const color = meta?.color || '#6b7280';
        return (
          <div
            key={cat}
            className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{meta?.icon || '📦'}</span>
              <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
            </div>
            <p className="text-xs font-semibold text-foreground leading-tight">{meta?.label || cat}</p>
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
            <p className="text-[10px] text-muted-foreground">{s.completed}/{s.total} rooms · {s.points} pts</p>
          </div>
        );
      })}
    </div>
  );
}