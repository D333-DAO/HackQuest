import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, ChevronUp, Lock, Circle, ExternalLink, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const diffColors = {
  easy:   { bg: 'bg-primary/10',     text: 'text-primary',     border: 'border-primary/20' },
  medium: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-400/20' },
  hard:   { bg: 'bg-destructive/10', text: 'text-destructive',  border: 'border-destructive/20' },
};

export default function RoadmapStep({ room, index, isCompleted, isLocked, isLast }) {
  const [expanded, setExpanded] = useState(false);

  const diff = diffColors[room.difficulty] || diffColors.easy;

  return (
    <div className="flex gap-4">
      {/* Connector column */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => !isLocked && setExpanded(e => !e)}
          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 z-10 ${
            isCompleted
              ? 'bg-primary border-primary text-primary-foreground'
              : isLocked
              ? 'bg-secondary border-border text-muted-foreground cursor-not-allowed'
              : 'bg-card border-border hover:border-primary/60 text-muted-foreground cursor-pointer'
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : isLocked ? (
            <Lock className="w-4 h-4" />
          ) : (
            <span className="text-sm font-bold">{index + 1}</span>
          )}
        </button>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[2rem] mt-1 ${isCompleted ? 'bg-primary/40' : 'bg-border'}`} />
        )}
      </div>

      {/* Content card */}
      <div className={`flex-1 mb-4 rounded-xl border transition-all duration-200 overflow-hidden ${
        isCompleted
          ? 'border-primary/30 bg-primary/5'
          : isLocked
          ? 'border-border bg-card/40 opacity-60'
          : 'border-border bg-card hover:border-primary/30'
      }`}>
        {/* Header row */}
        <button
          onClick={() => !isLocked && setExpanded(e => !e)}
          disabled={isLocked}
          className="w-full text-left px-4 py-3 flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${isCompleted ? 'text-primary' : 'text-foreground'}`}>
              {room.title}
            </p>
            {!expanded && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{room.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-[10px] hidden sm:flex ${diff.bg} ${diff.text} ${diff.border}`}>
              {room.difficulty}
            </Badge>
            <span className="text-xs text-muted-foreground">{room.points} pts</span>
            {!isLocked && (
              expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded detail */}
        {expanded && !isLocked && (
          <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
            <p className="text-sm text-muted-foreground">{room.description}</p>

            {/* Tasks preview */}
            {room.tasks?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Tasks in this room</p>
                {room.tasks.slice(0, 4).map((task, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Circle className="w-2.5 h-2.5 shrink-0 text-primary/50" />
                    <span className="truncate">{task.title}</span>
                    {task.questions?.length > 0 && (
                      <span className="text-[10px] text-primary/60 ml-auto shrink-0">{task.questions.length}q</span>
                    )}
                  </div>
                ))}
                {room.tasks.length > 4 && (
                  <p className="text-[10px] text-muted-foreground">+{room.tasks.length - 4} more tasks</p>
                )}
              </div>
            )}

            <Link
              to={`/RoomDetail?id=${room.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {isCompleted ? 'Review Room' : 'Start Room'} <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}