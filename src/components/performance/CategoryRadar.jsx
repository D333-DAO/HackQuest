import React from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

export default function CategoryRadar({ categoryStats, categoryMeta }) {
  const data = Object.entries(categoryStats)
    .filter(([, s]) => s.total > 0)
    .map(([cat, s]) => ({
      category: categoryMeta[cat]?.label || cat,
      mastery: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
    }));

  if (data.length < 3) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center h-72">
        <p className="text-sm text-muted-foreground">Complete rooms in at least 3 categories to see the radar.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-base font-semibold text-foreground mb-4">Category Mastery Radar</h2>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <Radar
            name="Mastery %"
            dataKey="mastery"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 3 }}
          />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(v) => [`${v}%`, 'Mastery']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}