import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import UserBanner from '../components/dashboard/UserBanner';
import DailyStreak from '../components/dashboard/DailyStreak';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import FeaturedPaths from '../components/dashboard/FeaturedPaths';
import NetworkTopology from '../components/dashboard/NetworkTopology';
import GlobalThreatFeed from '../components/dashboard/GlobalThreatFeed';
import ForYou from '../components/dashboard/ForYou';
import { Skeleton } from '@/components/ui/skeleton';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export default function Dashboard() {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  const { containerRef, pullDistance, refreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(handleRefresh);

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
    <div
      ref={containerRef}
      className="space-y-6 max-w-7xl mx-auto overflow-y-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: pullDistance, overflow: 'hidden' }}
        >
          <div className={`w-7 h-7 rounded-full border-2 border-primary/40 border-t-primary ${refreshing ? 'animate-spin' : ''} transition-transform`}
            style={{ transform: `rotate(${(pullDistance / 72) * 360}deg)` }}
          />
        </div>
      )}
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
          {!isLoading && (
            <ForYou progress={progress} rooms={rooms} paths={paths} />
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