import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopNav from './TopNav';

export default function AppLayout() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['my-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const totalPoints = progress.reduce((sum, p) => sum + (p.points_earned || 0), 0);
  const streak = progress.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav user={user} userPoints={totalPoints} streak={streak} />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1400px] mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}