import React from 'react';
import { CheckCircle2, XCircle, Trophy, RotateCcw, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function QuizResults({ quiz, attempt, onRetry, onNext }) {
  const passed = attempt.passed;
  const pct = Math.round(attempt.score);

  const correctCount = attempt.answers.filter(a => a.correct).length;
  const total = attempt.answers.length;

  return (
    <div className="space-y-6 text-center">
      {/* Score ring */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center ${
          passed ? 'border-primary bg-primary/10' : 'border-destructive bg-destructive/10'
        }`}>
          <div>
            <p className={`text-3xl font-black ${passed ? 'text-primary' : 'text-destructive'}`}>{pct}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Score</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold ${
          passed
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          {passed ? <><Trophy className="w-4 h-4" /> PASSED</> : <><XCircle className="w-4 h-4" /> FAILED</>}
        </div>
        <p className="text-sm text-muted-foreground">
          {passed
            ? 'Great work! You cleared the pass threshold.'
            : `You need ${quiz.pass_threshold}% to pass. Keep practicing!`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-left">
        {[
          { icon: CheckCircle2, label: 'Correct', value: `${correctCount}/${total}`, color: 'text-primary' },
          { icon: Trophy, label: 'Points', value: `${attempt.points_earned}/${attempt.points_possible}`, color: 'text-amber-400' },
          { icon: Clock, label: 'Time', value: formatTime(attempt.time_taken_seconds), color: 'text-cyan-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-secondary/30 border border-border rounded-xl p-3">
            <Icon className={`w-4 h-4 mb-1 ${color}`} />
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
          </div>
        ))}
      </div>

      {/* Question breakdown */}
      <div className="bg-secondary/20 border border-border rounded-xl p-4 text-left space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Answer Breakdown</p>
        <div className="grid grid-cols-10 gap-1.5">
          {attempt.answers.map((a, i) => (
            <div
              key={i}
              title={`Q${i + 1}: ${a.correct ? 'Correct' : 'Wrong'}`}
              className={`h-6 rounded flex items-center justify-center text-[9px] font-bold ${
                a.correct
                  ? 'bg-primary/20 border border-primary/30 text-primary'
                  : 'bg-destructive/20 border border-destructive/30 text-destructive'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2" onClick={onRetry}>
          <RotateCcw className="w-4 h-4" /> Retry Quiz
        </Button>
        {onNext && (
          <Button className="flex-1 gap-2" onClick={onNext}>
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}