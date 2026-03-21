import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight, Flame, Target, CheckCircle2 } from 'lucide-react';

export default function NextPathPanel({ allNodes, nodeStats, totalPoints, isUnlocked, isComplete, rooms, completedRoomIds, domains }) {

  const suggestions = useMemo(() => {
    const results = [];

    for (const domain of domains) {
      for (const node of domain.tiers) {
        const unlocked = isUnlocked(node);
        const complete = isComplete(node);
        const stats    = nodeStats[node.id] || { total: 0, completed: 0, rooms: [] };

        if (complete) continue; // skip mastered

        if (unlocked && stats.total > 0) {
          // In-progress or freshly unlocked with rooms to do
          const unfinishedRooms = stats.rooms.filter(r => !completedRoomIds.has(r.id));
          if (unfinishedRooms.length > 0) {
            results.push({
              type: 'continue',
              priority: stats.completed > 0 ? 2 : 1, // in-progress = higher priority
              label: stats.completed > 0 ? 'Continue' : 'Start',
              node,
              domain,
              room: unfinishedRooms[0],
              progress: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
            });
          }
        } else if (!unlocked) {
          // Next locked node — show how many pts away
          const ptsNeeded = node.points - totalPoints;
          if (ptsNeeded > 0 && ptsNeeded <= 300) {
            results.push({
              type: 'upcoming',
              priority: 0,
              label: 'Almost there',
              node,
              domain,
              ptsNeeded,
            });
          }
        }
      }
    }

    // Sort: in-progress first, then start, then upcoming
    return results.sort((a, b) => b.priority - a.priority).slice(0, 4);
  }, [allNodes, nodeStats, totalPoints, completedRoomIds, domains]);

  if (suggestions.length === 0) return null;

  const typeConfig = {
    continue: { icon: Flame, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20' },
    upcoming: { icon: Target, colorClass: 'text-sky-400',  bgClass: 'bg-sky-500/10',   borderClass: 'border-sky-500/20'  },
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Suggested Next Steps</span>
        <span className="ml-auto text-xs text-muted-foreground">Based on your current progress</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
        {suggestions.map((s, i) => {
          const cfg  = typeConfig[s.type];
          const Icon = cfg.icon;
          return (
            <div
              key={i}
              className={`rounded-xl border p-4 flex flex-col gap-2 ${cfg.bgClass} ${cfg.borderClass}`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${cfg.colorClass}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wide ${cfg.colorClass}`}>{s.label}</span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-base">{s.domain.icon}</span>
                  <p className="text-xs font-semibold text-foreground leading-tight">{s.node.title}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">{s.domain.label}</p>
              </div>

              {s.type === 'continue' && s.progress > 0 && (
                <div className="space-y-0.5">
                  <div className="h-1.5 rounded-full bg-secondary/80 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.progress}%`, background: s.domain.accentColor }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">{s.progress}% done</p>
                </div>
              )}

              {s.type === 'upcoming' && (
                <p className="text-[10px] text-muted-foreground">
                  🔒 <span className="font-semibold text-foreground">{s.ptsNeeded} pts</span> away from unlocking
                </p>
              )}

              {s.room && (
                <Link
                  to={`/RoomDetail?id=${s.room.id}`}
                  className="mt-auto flex items-center justify-between gap-1 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-secondary transition-colors group"
                >
                  <span className="text-xs text-foreground font-medium truncate">{s.room.title}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                </Link>
              )}

              {!s.room && s.type === 'upcoming' && (
                <Link
                  to="/Rooms"
                  className="mt-auto flex items-center justify-between gap-1 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-secondary transition-colors group"
                >
                  <span className="text-xs text-foreground font-medium">Browse Rooms</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}