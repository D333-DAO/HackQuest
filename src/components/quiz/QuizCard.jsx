import React from 'react';
import { BookOpen, Clock, Trophy, Link2, FlaskConical, Play, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuizBookmarkButton from '@/components/quiz/QuizBookmarkButton';

const DIFF_STYLE = {
  easy:   { color: 'text-primary',    bg: 'bg-primary/10 border-primary/20' },
  medium: { color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  hard:   { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
};

export default function QuizCard({ quiz, onStart, onLinkLab, bestScore = null, user = null, isBookmarked = false }) {
  const diff = DIFF_STYLE[quiz.difficulty] || DIFF_STYLE.medium;
  
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${diff.bg} ${diff.color}`}>
            {quiz.difficulty}
          </span>
          {user && <QuizBookmarkButton quiz={quiz} user={user} isBookmarked={isBookmarked} />}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground">{quiz.title}</h3>
        {quiz.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{quiz.description}</p>}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{quiz.questions?.length || 0} questions</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{quiz.time_limit_minutes} min</span>
        <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" />Pass: {quiz.pass_threshold}%</span>
      </div>

      {/* Linked lab badge */}
      {quiz.linked_room_id ? (
        <div className="flex items-center gap-1.5 text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg px-2.5 py-1.5 font-medium">
          <FlaskConical className="w-3 h-3 shrink-0" />
          <span className="truncate">Lab: {quiz.linked_room_name || quiz.linked_room_id}</span>
        </div>
      ) : (
        <button
          onClick={() => onLinkLab(quiz)}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary/40 rounded-lg px-2.5 py-1.5 transition-colors w-full"
        >
          <Link2 className="w-3 h-3 shrink-0" /> Link a practice lab
        </button>
      )}

      {bestScore != null && (
        <div className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
          bestScore >= quiz.pass_threshold
            ? 'bg-primary/10 border-primary/20 text-primary'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          Best score: {bestScore}% — {bestScore >= quiz.pass_threshold ? '✓ Passed' : 'Not passed yet'}
        </div>
      )}
      <div className="flex gap-2 mt-auto">
        <Button className="flex-1 gap-2" onClick={() => onStart(quiz)}>
          <Play className="w-4 h-4" />
          {bestScore != null ? 'Retake' : 'Start'}
        </Button>
        <Button variant="outline" size="icon" onClick={() => onLinkLab(quiz)} title="Link lab">
          <Link2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}