import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Trophy, Target, Zap, ChevronRight } from 'lucide-react';

export default function UserBanner({ user, points, completedRooms, streak }) {
  const rank = points >= 5000 ? 'Elite Hacker' : points >= 2000 ? 'Hacker' : points >= 500 ? 'Script Kiddie' : 'Newbie';
  const rankColor = points >= 5000 ? 'text-red-400' : points >= 2000 ? 'text-primary' : points >= 500 ? 'text-accent' : 'text-muted-foreground';

  // XP progress to next rank
  const rankThresholds = [0, 500, 2000, 5000, 10000];
  const currentThreshIdx = rankThresholds.findIndex(t => points < t) - 1;
  const currentMin = rankThresholds[Math.max(0, currentThreshIdx)] || 0;
  const nextMax = rankThresholds[currentThreshIdx + 1] || rankThresholds[rankThresholds.length - 1];
  const progress = Math.min(100, Math.round(((points - currentMin) / (nextMax - currentMin)) * 100));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Avatar */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 flex items-center justify-center">
            <span className="text-2xl font-black text-primary">
              {user?.full_name ? user.full_name[0].toUpperCase() : '?'}
            </span>
          </div>
          {streak > 0 && (
            <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-0.5 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              <Flame className="w-2.5 h-2.5" /> {streak}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg font-black text-foreground">{user?.full_name || 'Hacker'}</h2>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 ${rankColor}`}>
              {rank}
            </span>
          </div>

          {/* XP bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden max-w-[200px]">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {points.toLocaleString()} / {nextMax.toLocaleString()} XP
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground">{points.toLocaleString()}</span>
              <span className="text-muted-foreground text-xs">pts</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Target className="w-4 h-4 text-accent" />
              <span className="font-bold text-foreground">{completedRooms}</span>
              <span className="text-muted-foreground text-xs">rooms</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-foreground">{streak}</span>
              <span className="text-muted-foreground text-xs">day streak</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          to="/Rooms"
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Continue Learning
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}