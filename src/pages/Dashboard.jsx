import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import UserBanner from '../components/dashboard/UserBanner';
import DailyStreak from '../components/dashboard/DailyStreak';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import FeaturedPaths from '../components/dashboard/FeaturedPaths';
import NetworkTopology from '../components/dashboard/NetworkTopology';
import GlobalThreatFeed from '../components/dashboard/GlobalThreatFeed';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: progress = [], isLoading: loadingProgress } = useQuery({
    queryKey: ['my-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const { data: paths = [], isLoading: loadingPaths } = useQuery({
    queryKey: ['paths'],
    queryFn: () => base44.entities.LearningPath.list(),
  });

  const totalPoints    = progress.reduce((sum, p) => sum + (p.points_earned || 0), 0);
  const completedRooms = progress.filter(p => p.completed).length;
  const streak         = progress.length;
  const isLoading      = loadingProgress || loadingRooms || loadingPaths;

  return (
    <div className="space-y-6">
      {/* User Banner */}
      {isLoading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : (
        <UserBanner
          user={user}
          points={totalPoints}
          completedRooms={completedRooms}
          streak={streak}
        />
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left col — topology + threat feed */}
        <div className="xl:col-span-2 space-y-6">
          <NetworkTopology />
          <GlobalThreatFeed />
        </div>

        {/* Right col — streak, quick access, activity */}
        <div className="space-y-6">
          <DailyStreak streak={streak} />
          <QuickActions />
          {isLoading ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : (
            <RecentActivity progress={progress} rooms={rooms} />
          )}
        </div>
      </div>

      {/* Featured paths */}
      {!loadingPaths && paths.length > 0 && (
        <FeaturedPaths paths={paths} />
      )}
    </div>
  );
}