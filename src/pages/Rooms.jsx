import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import RoomCard from '../components/rooms/RoomCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Rooms() {
  const [difficulty, setDifficulty] = useState('all');
  const [category, setCategory] = useState('all');

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

  const completedIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));

  const filtered = rooms.filter(r => {
    if (difficulty !== 'all' && r.difficulty !== difficulty) return false;
    if (category !== 'all' && r.category !== category) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Rooms</h1>
        <p className="text-sm text-muted-foreground mt-1">Hands-on labs and challenges</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-36 bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulty</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44 bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="networking">Networking</SelectItem>
            <SelectItem value="web_hacking">Web Hacking</SelectItem>
            <SelectItem value="cryptography">Cryptography</SelectItem>
            <SelectItem value="linux">Linux</SelectItem>
            <SelectItem value="windows">Windows</SelectItem>
            <SelectItem value="forensics">Forensics</SelectItem>
            <SelectItem value="osint">OSINT</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
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