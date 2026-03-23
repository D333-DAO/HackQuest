import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Signal, CheckCircle2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const diffColors = {
  beginner: 'bg-primary/10 text-primary border-primary/20',
  intermediate: 'bg-accent/10 text-accent border-accent/20',
  advanced: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function PathDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: path, isLoading } = useQuery({
    queryKey: ['path', pathId],
    queryFn: async () => {
      const paths = await base44.entities.LearningPath.filter({ id: pathId });
      return paths[0];
    },
    enabled: !!pathId,
  });

  const { data: rooms } = useQuery({
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

  if (isLoading || !path) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const pathRooms = (path.room_ids || []).map(id => rooms.find(r => r.id === id)).filter(Boolean);
  const completedRoomIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));
  const completedCount = pathRooms.filter(r => completedRoomIds.has(r.id)).length;
  const progressPct = pathRooms.length > 0 ? Math.round((completedCount / pathRooms.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/Paths" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Paths
      </Link>

      {path.image_url && (
        <div className="rounded-2xl overflow-hidden border border-border max-h-80 w-full">
          <img src={path.image_url} alt={path.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{path.title}</h1>
            <p className="text-sm text-muted-foreground mt-2">{path.description}</p>
          </div>
          <Badge variant="outline" className={`flex-shrink-0 ${diffColors[path.difficulty] || diffColors.beginner}`}>
            {path.difficulty}
          </Badge>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {path.estimated_hours || '?'} hours</span>
          <span className="flex items-center gap-1"><Signal className="w-4 h-4" /> {pathRooms.length} rooms</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-primary font-medium">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Rooms in this Path</h2>
        {pathRooms.map((room, idx) => {
          const done = completedRoomIds.has(room.id);
          return (
            <Link
              key={room.id}
              to={`/RoomDetail?id=${room.id}`}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                done
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-card border-border hover:border-primary/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                done ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
              }`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? 'text-primary' : 'text-foreground'}`}>{room.title}</p>
                <p className="text-xs text-muted-foreground truncate">{room.description}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{room.difficulty}</Badge>
              <span className="text-xs text-muted-foreground">{room.points} pts</span>
            </Link>
          );
        })}
        {pathRooms.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No rooms assigned to this path yet.</p>
        )}
      </div>
    </div>
  );
}