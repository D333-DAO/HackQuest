import React from 'react';
import { Trophy, Target, Flame, Zap } from 'lucide-react';

const stats = [
  { label: 'Total Points', icon: Trophy, color: 'text-primary', bg: 'bg-primary/10', key: 'points' },
  { label: 'Rooms Completed', icon: Target, color: 'text-accent', bg: 'bg-accent/10', key: 'rooms' },
  { label: 'Current Streak', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/10', key: 'streak' },
  { label: 'Rank', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10', key: 'rank' },
];

export default function StatsGrid({ points, rooms, streak, rank }) {
  const values = { points, rooms, streak, rank: `#${rank}` };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <div key={stat.key} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/20 transition-all duration-300">
          <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <p className="text-2xl font-bold text-foreground">{values[stat.key] || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}