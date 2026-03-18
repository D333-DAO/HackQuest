import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PathCard from '../components/paths/PathCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Paths() {
  const [filter, setFilter] = useState('all');

  const { data: paths, isLoading } = useQuery({
    queryKey: ['paths'],
    queryFn: () => base44.entities.LearningPath.list(),
    initialData: [],
  });

  const filtered = filter === 'all' ? paths : paths.filter(p => p.category === filter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Learning Paths</h1>
        <p className="text-sm text-muted-foreground mt-1">Structured pathways to master cyber security</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="offensive">Offensive</TabsTrigger>
          <TabsTrigger value="defensive">Defensive</TabsTrigger>
          <TabsTrigger value="certification">Certification</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(path => <PathCard key={path.id} path={path} />)}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-12">No paths found in this category.</p>
          )}
        </div>
      )}
    </div>
  );
}