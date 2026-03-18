import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Leaderboard() {
  const { data: allProgress, isLoading } = useQuery({
    queryKey: ['all-progress-leaderboard'],
    queryFn: () => base44.entities.UserProgress.list(),
    initialData: [],
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  // Aggregate points per user
  const userMap = {};
  users.forEach(u => { userMap[u.email] = u; });

  const leaderboard = {};
  allProgress.forEach(p => {
    if (!leaderboard[p.user_email]) {
      leaderboard[p.user_email] = { email: p.user_email, points: 0, rooms: 0 };
    }
    leaderboard[p.user_email].points += (p.points_earned || 0);
    if (p.completed) leaderboard[p.user_email].rooms += 1;
  });

  const sorted = Object.values(leaderboard).sort((a, b) => b.points - a.points);

  const rankIcons = [
    <Trophy className="w-6 h-6 text-yellow-400" />,
    <Medal className="w-6 h-6 text-gray-300" />,
    <Award className="w-6 h-6 text-orange-400" />,
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Top hackers ranked by points</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No rankings yet. Complete rooms to climb the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((entry, idx) => {
            const user = userMap[entry.email];
            const isTopThree = idx < 3;
            return (
              <div
                key={entry.email}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  isTopThree ? 'bg-card border-primary/20' : 'bg-card border-border'
                }`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary">
                  {idx < 3 ? rankIcons[idx] : (
                    <span className="text-sm font-bold text-muted-foreground">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.full_name || entry.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.rooms} rooms completed</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{entry.points}</p>
                  <p className="text-[10px] text-muted-foreground">points</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}