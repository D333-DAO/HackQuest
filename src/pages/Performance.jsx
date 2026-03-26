import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import CategoryRadar from '../components/performance/CategoryRadar';
import MasteryBars from '../components/performance/MasteryBars';
import DifficultyBreakdown from '../components/performance/DifficultyBreakdown';
import ProgressTimeline from '../components/performance/ProgressTimeline';
import CategoryScoreCards from '../components/performance/CategoryScoreCards';
import { Trophy, Target, Zap, TrendingUp } from 'lucide-react';

const CATEGORY_META = {
  web_hacking:          { label: 'Web Hacking',          color: '#f59e0b', icon: '🕸️' },
  networking:           { label: 'Networking',            color: '#3b82f6', icon: '🌐' },
  linux:                { label: 'Linux',                 color: '#22c55e', icon: '🐧' },
  windows:              { label: 'Windows',               color: '#60a5fa', icon: '🪟' },
  privilege_escalation: { label: 'Privilege Escalation',  color: '#a855f7', icon: '⬆️' },
  cryptography:         { label: 'Cryptography',          color: '#ec4899', icon: '🔐' },
  forensics:            { label: 'Forensics',             color: '#14b8a6', icon: '🔬' },
  reverse_engineering:  { label: 'Reverse Engineering',   color: '#f97316', icon: '⚙️' },
  osint:                { label: 'OSINT',                 color: '#84cc16', icon: '🕵️' },
  other:                { label: 'Other',                 color: '#6b7280', icon: '📦' },
};

export function buildCategoryStats(rooms, progress) {
  const completedIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));
  const progressMap = Object.fromEntries(progress.map(p => [p.room_id, p]));

  const stats = {};

  rooms.forEach(room => {
    const cat = room.category || 'other';
    if (!stats[cat]) {
      stats[cat] = { total: 0, completed: 0, points: 0, maxPoints: 0, started: 0 };
    }
    stats[cat].total++;
    stats[cat].maxPoints += room.points || 100;
    if (completedIds.has(room.id)) {
      stats[cat].completed++;
      stats[cat].points += progressMap[room.id]?.points_earned || 0;
    } else if (progressMap[room.id]) {
      stats[cat].started++;
    }
  });

  return stats;
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center`} style={{ background: `${color}20` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-primary mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Performance() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const { data: progress = [], isLoading: loadingProgress } = useQuery({
    queryKey: ['my-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ['quiz-attempts', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const isLoading = loadingRooms || loadingProgress;

  const categoryStats = useMemo(() => buildCategoryStats(rooms, progress), [rooms, progress]);

  const totalPoints = progress.reduce((s, p) => s + (p.points_earned || 0), 0);
  const completedRooms = progress.filter(p => p.completed).length;
  const quizzesPassed = quizAttempts.filter(a => a.passed).length;
  const topCategory = Object.entries(categoryStats).sort((a, b) => b[1].points - a[1].points)[0];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Your skill mastery across all cybersecurity domains</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Trophy} label="Total Points" value={totalPoints.toLocaleString()} color="#84cc16" />
        <StatCard icon={Target} label="Rooms Completed" value={completedRooms} sub={`of ${rooms.length} total`} color="#3b82f6" />
        <StatCard icon={Zap} label="Quizzes Passed" value={quizzesPassed} color="#a855f7" />
        <StatCard
          icon={TrendingUp}
          label="Top Category"
          value={topCategory ? CATEGORY_META[topCategory[0]]?.label || topCategory[0] : '—'}
          sub={topCategory ? `${topCategory[1].points} pts` : ''}
          color="#f59e0b"
        />
      </div>

      {/* Score Cards row */}
      <CategoryScoreCards categoryStats={categoryStats} categoryMeta={CATEGORY_META} />

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryRadar categoryStats={categoryStats} categoryMeta={CATEGORY_META} />
        <DifficultyBreakdown rooms={rooms} progress={progress} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MasteryBars categoryStats={categoryStats} categoryMeta={CATEGORY_META} />
        <ProgressTimeline progress={progress} />
      </div>
    </div>
  );
}