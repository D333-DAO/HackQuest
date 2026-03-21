import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ArrowRight, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RecentActivity({ progress, rooms }) {
  const roomMap = {};
  rooms.forEach(r => { roomMap[r.id] = r; });

  const sorted = [...progress]
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 6);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <span className="text-sm font-bold text-foreground">Recent Activity</span>
        <Link to="/Rooms" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium">
          All rooms <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <div className="w-10 h-10 rounded-2xl bg-secondary mx-auto flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No activity yet</p>
          <p className="text-xs text-muted-foreground mb-4">Start a room to begin tracking your progress</p>
          <Link to="/Rooms" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
            Browse Rooms <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {sorted.map(p => {
            const room = roomMap[p.room_id];
            return (
              <Link
                key={p.id}
                to={`/RoomDetail?id=${p.room_id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  p.completed ? 'bg-primary/15 border border-primary/25' : 'bg-secondary border border-border'
                }`}>
                  {p.completed
                    ? <CheckCircle2 className="w-4 h-4 text-primary" />
                    : <Clock className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {room?.title || 'Unknown Room'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold ${p.completed ? 'text-primary' : 'text-amber-400'}`}>
                      {p.completed ? 'Completed' : 'In Progress'}
                    </span>
                    {p.points_earned > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5" /> +{p.points_earned} pts
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(p.updated_date), { addSuffix: true })}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}