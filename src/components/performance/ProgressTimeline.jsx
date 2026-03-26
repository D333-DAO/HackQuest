import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

export default function ProgressTimeline({ progress }) {
  if (!progress.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">No activity yet — complete rooms to see your timeline.</p>
      </div>
    );
  }

  // Build cumulative points over time
  const sorted = [...progress]
    .filter(p => p.created_date)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  let cumPoints = 0;
  let cumRooms = 0;
  const data = sorted.map(p => {
    cumPoints += p.points_earned || 0;
    if (p.completed) cumRooms++;
    return {
      date: format(new Date(p.created_date), 'MMM d'),
      Points: cumPoints,
      Rooms: cumRooms,
    };
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-base font-semibold text-foreground mb-4">Points Over Time</h2>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
          <defs>
            <linearGradient id="pointsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Area
            type="monotone"
            dataKey="Points"
            stroke="hsl(var(--primary))"
            fill="url(#pointsGrad)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}