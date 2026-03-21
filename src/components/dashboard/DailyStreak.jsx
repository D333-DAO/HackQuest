import React from 'react';
import { Flame, Calendar } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DailyStreak({ streak }) {
  // Simulate which days were active (last 7 days based on streak count)
  const today = new Date().getDay(); // 0 = Sun
  // Convert to Mon-first index
  const todayIdx = (today + 6) % 7;
  const activeDays = new Set();
  for (let i = 0; i < Math.min(streak, 7); i++) {
    activeDays.add((todayIdx - i + 7) % 7);
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-bold text-foreground">Daily Streak</span>
        </div>
        <span className="text-2xl font-black text-orange-400">{streak || 0}
          <span className="text-sm text-muted-foreground font-normal ml-1">days</span>
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day, i) => {
          const isActive = activeDays.has(i);
          const isToday = i === todayIdx;
          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-base transition-all ${
                isActive
                  ? 'bg-orange-500/20 border border-orange-500/40'
                  : 'bg-secondary border border-border'
              } ${isToday ? 'ring-2 ring-orange-400/50' : ''}`}>
                {isActive ? '🔥' : <span className="w-1.5 h-1.5 rounded-full bg-border" />}
              </div>
              <span className={`text-[9px] font-medium ${isToday ? 'text-foreground' : 'text-muted-foreground'}`}>{day}</span>
            </div>
          );
        })}
      </div>
      {streak === 0 && (
        <p className="text-xs text-muted-foreground text-center mt-3">Complete a room today to start your streak!</p>
      )}
    </div>
  );
}