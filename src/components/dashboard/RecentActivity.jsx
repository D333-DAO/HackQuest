import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function RecentActivity({ progress, rooms }) {
  const roomMap = {};
  rooms.forEach(r => { roomMap[r.id] = r; });

  const sorted = [...progress].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)).slice(0, 8);

  if (sorted.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">No activity yet. Start a room to begin!</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {sorted.map(p => {
          const room = roomMap[p.room_id];
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
              {p.completed ? (
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{room?.title || 'Unknown Room'}</p>
                <p className="text-xs text-muted-foreground">
                  {p.completed ? 'Completed' : 'In progress'} · +{p.points_earned || 0} pts
                </p>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {format(new Date(p.updated_date), 'MMM d')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}