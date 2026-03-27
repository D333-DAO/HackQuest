import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Target, TrendingUp, BookOpen, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CATEGORY_LABELS = {
  networking: 'Networking',
  web_hacking: 'Web Hacking',
  cryptography: 'Cryptography',
  linux: 'Linux',
  windows: 'Windows',
  forensics: 'Forensics',
  reverse_engineering: 'Reverse Engineering',
  privilege_escalation: 'Privilege Escalation',
  osint: 'OSINT',
  other: 'General',
};

const DIFF_STYLE = {
  easy:   'bg-primary/10 text-primary border-primary/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-400/20',
  hard:   'bg-destructive/10 text-destructive border-destructive/20',
};

function RoomCard({ room, reason }) {
  return (
    <Link
      to={`/RoomDetail?id=${room.id}`}
      className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
    >
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
        <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{room.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{reason}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className={`text-[10px] ${DIFF_STYLE[room.difficulty] || DIFF_STYLE.easy}`}>
            {room.difficulty}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{room.points} pts</span>
          <span className="text-[10px] text-muted-foreground capitalize">{CATEGORY_LABELS[room.category] || room.category}</span>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
    </Link>
  );
}

function PathCard({ path, reason }) {
  return (
    <Link
      to={`/PathDetail?id=${path.id}`}
      className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
    >
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
        <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{path.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{reason}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-[10px] capitalize">{path.difficulty}</Badge>
          <span className="text-[10px] text-muted-foreground capitalize">{path.category}</span>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
    </Link>
  );
}

export default function ForYou({ progress, rooms, paths }) {
  const recommendations = useMemo(() => {
    const completedRoomIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));
    const startedRoomIds = new Set(progress.map(p => p.room_id));
    const unfinishedRooms = rooms.filter(r => !completedRoomIds.has(r.id));

    // ── Category mastery: points earned per category ──────────────────────────
    const categoryPoints = {};
    const categoryTotal = {};
    rooms.forEach(r => {
      categoryTotal[r.category] = (categoryTotal[r.category] || 0) + r.points;
    });
    progress.forEach(p => {
      const room = rooms.find(r => r.id === p.room_id);
      if (!room) return;
      categoryPoints[room.category] = (categoryPoints[room.category] || 0) + (p.points_earned || 0);
    });

    // Mastery % per category (only categories with rooms)
    const masteryMap = {};
    Object.keys(categoryTotal).forEach(cat => {
      masteryMap[cat] = categoryTotal[cat] > 0
        ? Math.round(((categoryPoints[cat] || 0) / categoryTotal[cat]) * 100)
        : 0;
    });

    // ── Recently completed categories ────────────────────────────────────────
    const recentCompleted = [...progress]
      .filter(p => p.completed)
      .sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date))
      .slice(0, 5);
    const recentCategories = [...new Set(
      recentCompleted.map(p => rooms.find(r => r.id === p.room_id)?.category).filter(Boolean)
    )];

    const suggestions = [];

    // ── 1. Follow-up rooms in recently completed categories ───────────────────
    recentCategories.forEach(cat => {
      const followUp = unfinishedRooms
        .filter(r => r.category === cat)
        .sort((a, b) => {
          // Prefer rooms they started but haven't finished
          const aStarted = startedRoomIds.has(a.id) ? -1 : 1;
          const bStarted = startedRoomIds.has(b.id) ? -1 : 1;
          return aStarted - bStarted;
        })[0];
      if (followUp && suggestions.length < 3) {
        suggestions.push({
          type: 'room',
          item: followUp,
          reason: `Continue your ${CATEGORY_LABELS[cat] || cat} journey`,
          tag: 'follow-up',
        });
      }
    });

    // ── 2. Weakest category rooms ─────────────────────────────────────────────
    const weakCategories = Object.entries(masteryMap)
      .filter(([cat]) => unfinishedRooms.some(r => r.category === cat))
      .sort((a, b) => a[1] - b[1]) // lowest mastery first
      .slice(0, 3)
      .map(([cat]) => cat);

    weakCategories.forEach(cat => {
      if (suggestions.length >= 5) return;
      // Skip if already covered by follow-up
      if (suggestions.some(s => s.item.category === cat)) return;
      const room = unfinishedRooms
        .filter(r => r.category === cat)
        .sort((a, b) => {
          const order = { easy: 0, medium: 1, hard: 2 };
          return (order[a.difficulty] || 0) - (order[b.difficulty] || 0);
        })[0];
      if (room) {
        suggestions.push({
          type: 'room',
          item: room,
          reason: `Boost your ${CATEGORY_LABELS[cat] || cat} mastery (${masteryMap[cat]}%)`,
          tag: 'weak-area',
        });
      }
    });

    // ── 3. Recommended paths (not yet started) ────────────────────────────────
    const pathSuggestions = [];
    paths.forEach(path => {
      const pathRooms = (path.room_ids || []).map(id => rooms.find(r => r.id === id)).filter(Boolean);
      if (pathRooms.length === 0) return;
      const completed = pathRooms.filter(r => completedRoomIds.has(r.id)).length;
      const pct = Math.round((completed / pathRooms.length) * 100);

      if (pct === 100) return; // already done

      // Score: prefer paths aligned with weak categories or in-progress paths
      const inProgress = pct > 0 && pct < 100;
      const pathCategories = [...new Set(pathRooms.map(r => r.category))];
      const weakScore = pathCategories.reduce((s, c) => s + (100 - (masteryMap[c] || 100)), 0);
      pathSuggestions.push({ path, pct, inProgress, weakScore });
    });

    pathSuggestions
      .sort((a, b) => {
        if (a.inProgress !== b.inProgress) return a.inProgress ? -1 : 1;
        return b.weakScore - a.weakScore;
      })
      .slice(0, 2)
      .forEach(({ path, pct, inProgress }) => {
        const reason = inProgress
          ? `${pct}% complete — keep going!`
          : `Covers your weakest skill areas`;
        pathSuggestions.push({ type: 'path', item: path, reason });
      });

    // Combine: up to 2 path suggestions at the end
    const pathRecs = pathSuggestions
      .filter(s => s.type === 'path')
      .slice(0, 2);

    return [...suggestions.slice(0, 4), ...pathRecs];
  }, [progress, rooms, paths]);

  // If brand new user with no progress, show starter rooms
  const starterRecs = useMemo(() => {
    if (progress.length > 0) return [];
    return rooms
      .filter(r => r.difficulty === 'easy')
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 3)
      .map(r => ({
        type: 'room',
        item: r,
        reason: 'Great starting point',
        tag: 'starter',
      }));
  }, [progress, rooms]);

  const items = progress.length === 0 ? starterRecs : recommendations;

  if (items.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-base font-bold text-foreground">For You</h2>
        <span className="text-xs text-muted-foreground ml-1">— personalized picks</span>
      </div>

      <div className="space-y-2">
        {items.map((rec, i) =>
          rec.type === 'path' ? (
            <PathCard key={rec.item.id + i} path={rec.item} reason={rec.reason} />
          ) : (
            <RoomCard key={rec.item.id + i} room={rec.item} reason={rec.reason} />
          )
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Target className="w-3.5 h-3.5" />
        Based on your activity and skill gaps
      </div>
    </div>
  );
}