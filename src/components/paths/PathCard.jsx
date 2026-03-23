import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, Signal, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const diffColors = {
  beginner: 'bg-primary/10 text-primary border-primary/20',
  intermediate: 'bg-accent/10 text-accent border-accent/20',
  advanced: 'bg-destructive/10 text-destructive border-destructive/20',
};

const catColors = {
  offensive: 'text-destructive',
  defensive: 'text-accent',
  general: 'text-primary',
  certification: 'text-purple-400',
};

export default function PathCard({ path }) {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['my-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  // Calculate path progress
  const pathRooms = (path.room_ids || []).map(id => rooms.find(r => r.id === id)).filter(Boolean);
  const completedRoomIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));
  const completedCount = pathRooms.filter(r => completedRoomIds.has(r.id)).length;
  const progressPct = pathRooms.length > 0 ? Math.round((completedCount / pathRooms.length) * 100) : 0;
  const isComplete = completedCount === pathRooms.length && pathRooms.length > 0;

  return (
    <Link
      to={`/PathDetail?id=${path.id}`}
      className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 flex flex-col h-full"
    >
      {/* Image section */}
      {path.image_url && (
        <div className="relative overflow-hidden h-40 bg-secondary/30">
          <img 
            src={path.image_url} 
            alt={path.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isComplete && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
          )}
        </div>
      )}

      {/* Content section */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{path.title}</h3>
          <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${diffColors[path.difficulty] || diffColors.beginner}`}>
            {path.difficulty}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">{path.description}</p>

        {/* Progress indicator */}
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className={`font-medium ${progressPct === 100 ? 'text-primary' : 'text-muted-foreground'}`}>
              {completedCount}/{pathRooms.length}
            </span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {path.estimated_hours || '?'}h
            </span>
            <span className="flex items-center gap-1">
              <Signal className="w-3 h-3" /> {pathRooms.length}
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}