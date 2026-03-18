import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Target, Flame, Calendar, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Profile() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: progress } = useQuery({
    queryKey: ['my-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list(),
    initialData: [],
  });

  const totalPoints = progress.reduce((sum, p) => sum + (p.points_earned || 0), 0);
  const completedRooms = progress.filter(p => p.completed).length;
  const earnedBadges = badges.filter(b => totalPoints >= (b.points_required || 0));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold text-foreground">{user?.full_name || 'Hacker'}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {user?.created_date && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-center sm:justify-start">
                <Calendar className="w-3 h-3" /> Joined {format(new Date(user.created_date), 'MMMM yyyy')}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => base44.auth.logout()} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalPoints}</p>
          <p className="text-xs text-muted-foreground">Total Points</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <Target className="w-6 h-6 text-accent mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{completedRooms}</p>
          <p className="text-xs text-muted-foreground">Rooms Done</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{progress.length}</p>
          <p className="text-xs text-muted-foreground">Rooms Started</p>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Badges</h2>
        {earnedBadges.length === 0 ? (
          <p className="text-sm text-muted-foreground">No badges earned yet. Keep hacking!</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {earnedBadges.map(badge => (
              <div key={badge.id} className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                <span className="text-3xl">{badge.icon || '🏅'}</span>
                <p className="text-sm font-semibold text-foreground mt-2">{badge.title}</p>
                <p className="text-[10px] text-muted-foreground">{badge.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Locked badges */}
        {badges.filter(b => totalPoints < (b.points_required || 0)).length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Locked</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.filter(b => totalPoints < (b.points_required || 0)).map(badge => (
                <div key={badge.id} className="p-4 rounded-xl bg-secondary/50 border border-border text-center opacity-50">
                  <span className="text-3xl grayscale">🔒</span>
                  <p className="text-sm font-semibold text-foreground mt-2">{badge.title}</p>
                  <p className="text-[10px] text-muted-foreground">{badge.points_required} pts needed</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}