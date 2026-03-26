import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Trophy, Brain, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AssessmentQuizCard({ quiz, isUnlocked, hasPassed }) {
  return (
    <div className="flex gap-4">
      {/* Connector node — final */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          hasPassed
            ? 'bg-primary border-primary text-primary-foreground'
            : isUnlocked
            ? 'bg-amber-500/20 border-amber-400 text-amber-400 animate-pulse'
            : 'bg-secondary border-border text-muted-foreground'
        }`}>
          {hasPassed ? <Trophy className="w-5 h-5" /> : isUnlocked ? <Brain className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
        </div>
      </div>

      {/* Card */}
      <div className={`flex-1 mb-4 rounded-xl border-2 p-5 transition-all duration-300 ${
        hasPassed
          ? 'border-primary/50 bg-primary/10'
          : isUnlocked
          ? 'border-amber-400/50 bg-amber-500/5 shadow-lg shadow-amber-500/10'
          : 'border-border bg-card/40 opacity-50'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isUnlocked && !hasPassed && (
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Unlocked!
                </span>
              )}
              {hasPassed && (
                <span className="text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Passed
                </span>
              )}
              {!isUnlocked && (
                <span className="text-[10px] font-bold bg-secondary text-muted-foreground border border-border px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Complete all rooms to unlock
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {quiz ? quiz.title : 'Final Assessment Quiz'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {quiz?.description || 'Prove your mastery of this learning path by passing the final assessment.'}
            </p>
            {quiz && (
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{quiz.questions?.length || 0} questions</span>
                <span>·</span>
                <span>{quiz.time_limit_minutes || 10} min</span>
                <span>·</span>
                <span>Pass: {quiz.pass_threshold || 70}%</span>
              </div>
            )}
          </div>
        </div>

        {isUnlocked && quiz && (
          <Link
            to={`/QuizEngine?quiz_id=${quiz.id}`}
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              hasPassed
                ? 'bg-primary/20 text-primary hover:bg-primary/30'
                : 'bg-amber-500 text-black hover:bg-amber-400'
            }`}
          >
            {hasPassed ? 'Retake Quiz' : 'Take Assessment'} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}