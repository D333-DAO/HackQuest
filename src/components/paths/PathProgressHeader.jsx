import React from 'react';
import { Clock, Target, CheckCircle2, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const diffColors = {
  beginner:     'bg-primary/10 text-primary border-primary/20',
  intermediate: 'bg-accent/10 text-accent border-accent/20',
  advanced:     'bg-destructive/10 text-destructive border-destructive/20',
};

export default function PathProgressHeader({ path, completedCount, totalRooms, progressPct, isComplete }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
      {/* Cover image */}
      {path.image_url && (
        <div className="rounded-xl overflow-hidden mb-6 h-44 w-full">
          <img src={path.image_url} alt={path.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-[10px] ${diffColors[path.difficulty] || diffColors.beginner}`}>
              {path.difficulty}
            </Badge>
            <Badge variant="outline" className="text-[10px] capitalize">{path.category}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{path.title}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{path.description}</p>
        </div>
        {isComplete && (
          <div className="flex items-center gap-2 text-primary bg-primary/10 border border-primary/30 px-4 py-2 rounded-xl shrink-0">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-bold">Path Complete!</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-5">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" /> {path.estimated_hours || '?'} hours
        </span>
        <span className="flex items-center gap-1.5">
          <Target className="w-4 h-4" /> {totalRooms} rooms
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-primary" /> {completedCount} completed
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">Overall Progress</span>
          <span className={`font-bold ${isComplete ? 'text-primary' : 'text-foreground'}`}>{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{completedCount} of {totalRooms} rooms done</span>
          {!isComplete && totalRooms > 0 && (
            <span>{totalRooms - completedCount} remaining</span>
          )}
        </div>
      </div>
    </div>
  );
}