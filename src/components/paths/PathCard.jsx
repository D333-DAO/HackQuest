import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Signal, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  return (
    <Link
      to={`/PathDetail?id=${path.id}`}
      className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 flex flex-col"
    >
      {path.image_url && (
        <img src={path.image_url} alt={path.title} className="w-full h-36 object-cover rounded-xl mb-4" />
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{path.title}</h3>
        <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${diffColors[path.difficulty] || diffColors.beginner}`}>
          {path.difficulty}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1">{path.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {path.estimated_hours || '?'}h
          </span>
          <span className="flex items-center gap-1">
            <Signal className="w-3.5 h-3.5" /> {path.room_ids?.length || 0} rooms
          </span>
          <span className={`capitalize ${catColors[path.category] || 'text-muted-foreground'}`}>
            {path.category}
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}