import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import StatsGrid from '../components/dashboard/StatsGrid';
import RecentActivity from '../components/dashboard/RecentActivity';
import FeaturedPaths from '../components/dashboard/FeaturedPaths';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ['my-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: rooms, isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
    initialData: [],
  });

  const { data: paths, isLoading: loadingPaths } = useQuery({
    queryKey: ['paths'],
    queryFn: () => base44.entities.LearningPath.list(),
    initialData: [],
  });

  const totalPoints = progress.reduce((sum, p) => sum + (p.points_earned || 0), 0);
  const completedRooms = progress.filter(p => p.completed).length;

  const isLoading = loadingProgress || loadingRooms || loadingPaths;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Continue your cyber security journey</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <StatsGrid
          points={totalPoints}
          rooms={completedRooms}
          streak={progress.length}
          rank={1}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <FeaturedPaths paths={paths} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity progress={progress} rooms={rooms} />
        </div>
      </div>
    </div>
  );
}