import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import RoomCard from '../components/rooms/RoomCard';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileSelect } from '@/components/ui/MobileSelect';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'All Difficulty' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'networking', label: 'Networking' },
  { value: 'web_hacking', label: 'Web Hacking' },
  { value: 'cryptography', label: 'Cryptography' },
  { value: 'linux', label: 'Linux' },
  { value: 'windows', label: 'Windows' },
  { value: 'forensics', label: 'Forensics' },
  { value: 'osint', label: 'OSINT' },
  { value: 'other', label: 'Other' },
];

export default function Rooms() {
  const [difficulty, setDifficulty] = useState('all');
  const [category, setCategory] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
    initialData: [],
  });

  const { data: progress } = useQuery({
    queryKey: ['my-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['rooms'] });
    await queryClient.invalidateQueries({ queryKey: ['my-progress'] });
  };
  const { containerRef, pullDistance, refreshing, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(handleRefresh);

  const completedIds = new Set((progress || []).filter(p => p.completed).map(p => p.room_id));

  const filtered = rooms.filter(r => {
    if (difficulty !== 'all' && r.difficulty !== difficulty) return false;
    if (category !== 'all' && r.category !== category) return false;
    return true;
  });

  return (
    <div
      ref={containerRef}
      className="space-y-6 max-w-7xl mx-auto overflow-y-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {pullDistance > 0 && (
        <div className="flex items-center justify-center transition-all" style={{ height: pullDistance, overflow: 'hidden' }}>
          <div className={`w-7 h-7 rounded-full border-2 border-primary/40 border-t-primary ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${(pullDistance / 72) * 360}deg)` }} />
        </div>
      )}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Rooms</h1>
        <p className="text-sm text-muted-foreground mt-1">Hands-on labs and challenges</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <MobileSelect
          value={difficulty}
          onValueChange={setDifficulty}
          placeholder="All Difficulty"
          options={DIFFICULTY_OPTIONS}
          triggerClassName="w-36 bg-secondary"
        />
        <MobileSelect
          value={category}
          onValueChange={setCategory}
          placeholder="All Categories"
          options={CATEGORY_OPTIONS}
          triggerClassName="w-44 bg-secondary"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(room => (
            <RoomCard key={room.id} room={room} isCompleted={completedIds.has(room.id)} />
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-12">No rooms match your filters.</p>
          )}
        </div>
      )}
    </div>
  );
}