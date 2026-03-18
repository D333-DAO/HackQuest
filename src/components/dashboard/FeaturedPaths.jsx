import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Signal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const diffColors = {
  beginner: 'bg-primary/10 text-primary border-primary/20',
  intermediate: 'bg-accent/10 text-accent border-accent/20',
  advanced: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function FeaturedPaths({ paths }) {
  if (!paths.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Featured Paths</h3>
        <Link to="/Paths" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {paths.slice(0, 4).map(path => (
          <Link
            key={path.id}
            to={`/PathDetail?id=${path.id}`}
            className="group p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{path.title}</h4>
              <Badge variant="outline" className={`text-[10px] ${diffColors[path.difficulty] || diffColors.beginner}`}>
                {path.difficulty}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{path.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {path.estimated_hours || '?'}h
              </span>
              <span className="flex items-center gap-1">
                <Signal className="w-3 h-3" /> {path.room_ids?.length || 0} rooms
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}