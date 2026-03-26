import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';

const DIFF_COLORS = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };

export default function DifficultyBreakdown({ rooms, progress }) {
  const completedIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));

  const buckets = { easy: { total: 0, completed: 0 }, medium: { total: 0, completed: 0 }, hard: { total: 0, completed: 0 } };
  rooms.forEach(r => {
    const d = r.difficulty || 'easy';
    buckets[d].total++;
    if (completedIds.has(r.id)) buckets[d].completed++;
  });

  const data = Object.entries(buckets).map(([diff, v]) => ({
    name: diff.charAt(0).toUpperCase() + diff.slice(1),
    Completed: v.completed,
    Remaining: v.total - v.completed,
    color: DIFF_COLORS[diff],
  }));

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-base font-semibold text-foreground mb-4">Completion by Difficulty</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }} />
          <Bar dataKey="Completed" stackId="a" radius={[0, 0, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.9} />)}
          </Bar>
          <Bar dataKey="Remaining" stackId="a" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}