import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PathProgressHeader from '../components/paths/PathProgressHeader';
import RoadmapStep from '../components/paths/RoadmapStep';
import AssessmentQuizCard from '../components/paths/AssessmentQuizCard';

export default function PathDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathId = urlParams.get('id');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: path, isLoading } = useQuery({
    queryKey: ['path', pathId],
    queryFn: async () => {
      const paths = await base44.entities.LearningPath.filter({ id: pathId });
      return paths[0];
    },
    enabled: !!pathId,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['my-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => base44.entities.Quiz.list(),
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ['quiz-attempts', user?.email],
    queryFn: () => base44.entities.QuizAttempt.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  if (isLoading || !path) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Build ordered room list
  const pathRooms = (path.room_ids || [])
    .map(id => rooms.find(r => r.id === id))
    .filter(Boolean);

  const completedRoomIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));
  const completedCount = pathRooms.filter(r => completedRoomIds.has(r.id)).length;
  const progressPct = pathRooms.length > 0 ? Math.round((completedCount / pathRooms.length) * 100) : 0;
  const isPathComplete = pathRooms.length > 0 && completedCount === pathRooms.length;

  // Find assessment quiz linked to this path
  const assessmentQuiz = quizzes.find(q => q.path_id === path.id) || null;

  // Check if user passed the assessment
  const hasPassed = assessmentQuiz
    ? quizAttempts.some(a => a.quiz_id === assessmentQuiz.id && a.passed)
    : false;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <Link
        to="/Paths"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Paths
      </Link>

      {/* Header with progress */}
      <PathProgressHeader
        path={path}
        completedCount={completedCount}
        totalRooms={pathRooms.length}
        progressPct={progressPct}
        isComplete={isPathComplete}
      />

      {/* Roadmap */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Learning Roadmap</h2>

        {pathRooms.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">No rooms assigned to this path yet.</p>
          </div>
        ) : (
          <div>
            {pathRooms.map((room, idx) => {
              const isCompleted = completedRoomIds.has(room.id);
              // Each room unlocks when the previous is done (sequential) OR always open
              const isLocked = false; // All rooms visible; change to: idx > 0 && !completedRoomIds.has(pathRooms[idx-1].id) for sequential lock
              return (
                <RoadmapStep
                  key={room.id}
                  room={room}
                  index={idx}
                  isCompleted={isCompleted}
                  isLocked={isLocked}
                  isLast={idx === pathRooms.length - 1}
                />
              );
            })}

            {/* Final Assessment Quiz node */}
            <AssessmentQuizCard
              quiz={assessmentQuiz}
              isUnlocked={isPathComplete}
              hasPassed={hasPassed}
            />
          </div>
        )}
      </div>
    </div>
  );
}