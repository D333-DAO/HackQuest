import React from 'react';

const MASTERY_LEVELS = [
  { min: 0,  max: 25,  label: 'Novice',      color: '#ef4444' },
  { min: 25, max: 50,  label: 'Apprentice',  color: '#f59e0b' },
  { min: 50, max: 75,  label: 'Practitioner',color: '#3b82f6' },
  { min: 75, max: 100, label: 'Expert',      color: '#22c55e' },
];

function getMastery(pct) {
  return MASTERY_LEVELS.find(l => pct >= l.min && pct < l.max) || MASTERY_LEVELS[3];
}

export default function MasteryBars({ categoryStats, categoryMeta }) {
  const rows = Object.entries(categoryStats)
    .filter(([, s]) => s.total > 0)
    .map(([cat, s]) => {
      const pct = Math.round((s.completed / s.total) * 100);
      return { cat, s, pct, mastery: getMastery(pct), meta: categoryMeta[cat] };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-base font-semibold text-foreground mb-5">Mastery by Category</h2>
      <div className="space-y-4">
        {rows.map(({ cat, s, pct, mastery, meta }) => (
          <div key={cat}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{meta?.icon || '📦'}</span>
                <span className="text-sm font-medium text-foreground">{meta?.label || cat}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${mastery.color}20`, color: mastery.color }}
                >
                  {mastery.label}
                </span>
                <span className="text-xs text-muted-foreground">{s.completed}/{s.total}</span>
              </div>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: mastery.color }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">{s.points} pts earned</span>
              <span className="text-[10px] text-muted-foreground">{pct}%</span>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Start rooms to see your mastery progress.</p>
        )}
      </div>
    </div>
  );
}