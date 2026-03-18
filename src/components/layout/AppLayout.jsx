import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: progressList } = useQuery({
    queryKey: ['all-progress'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.UserProgress.filter({ user_email: user.email });
    },
    initialData: [],
  });

  const totalPoints = progressList.reduce((sum, p) => sum + (p.points_earned || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="lg:ml-64">
        <TopBar onMenuClick={() => setSidebarOpen(true)} userPoints={totalPoints} streak={progressList.length} />
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}