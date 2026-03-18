import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const diffColors = {
  easy: 'bg-primary/10 text-primary border-primary/20',
  medium: 'bg-accent/10 text-accent border-accent/20',
  hard: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function RoomCard({ room, isCompleted }) {
  return (
    <Link
      to={`/RoomDetail?id=${room.id}`}
      className={`group bg-card border rounded-2xl p-5 transition-all duration-300 flex flex-col ${
        isCompleted ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-primary/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{room.title}</h3>
        <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${diffColors[room.difficulty] || diffColors.easy}`}>
          {room.difficulty}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">{room.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">{room.points} pts</span>
          {isCompleted && (
            <Badge className="bg-primary/20 text-primary text-[10px] border-0">Completed</Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground capitalize">{room.category?.replace(/_/g, ' ')}</span>
      </div>
    </Link>
  );
}