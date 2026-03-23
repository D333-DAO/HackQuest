import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuizQuestion({ question, questionNumber, total, selectedIndex, onSelect, revealed }) {
  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>Question {questionNumber} of {total}</span>
        <span>{question.points || 10} pts</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(questionNumber / total) * 100}%` }}
        />
      </div>

      {/* Question text */}
      <p className="text-base font-semibold text-foreground leading-relaxed pt-2">{question.question}</p>

      {/* Options */}
      <div className="space-y-2.5">
        {question.options.map((option, i) => {
          const isSelected = selectedIndex === i;
          const isCorrect = i === question.correct_index;

          let style = 'border-border bg-secondary/20 hover:border-muted-foreground/40 hover:bg-secondary/40 cursor-pointer';
          if (revealed) {
            if (isCorrect) style = 'border-primary/50 bg-primary/10 cursor-default';
            else if (isSelected && !isCorrect) style = 'border-destructive/50 bg-destructive/10 cursor-default';
            else style = 'border-border/40 bg-secondary/10 opacity-50 cursor-default';
          } else if (isSelected) {
            style = 'border-primary/60 bg-primary/10 cursor-pointer';
          }

          return (
            <button
              key={i}
              disabled={revealed}
              onClick={() => !revealed && onSelect(i)}
              className={cn('w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150', style)}
            >
              <span className={cn(
                'w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 transition-colors',
                revealed && isCorrect ? 'border-primary bg-primary text-primary-foreground' :
                revealed && isSelected && !isCorrect ? 'border-destructive bg-destructive text-destructive-foreground' :
                isSelected ? 'border-primary bg-primary/20 text-primary' :
                'border-muted-foreground/40 text-muted-foreground'
              )}>
                {revealed
                  ? isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" />
                  : isSelected ? <XCircle className="w-3.5 h-3.5" />
                  : String.fromCharCode(65 + i)
                  : String.fromCharCode(65 + i)}
              </span>
              <span className={cn(
                'text-sm',
                revealed && isCorrect ? 'text-primary font-medium' :
                revealed && isSelected && !isCorrect ? 'text-destructive' :
                'text-foreground'
              )}>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {revealed && question.explanation && (
        <div className="flex items-start gap-2.5 bg-secondary/30 border border-border rounded-xl px-4 py-3 mt-2">
          <span className="text-base shrink-0">💡</span>
          <p className="text-xs text-muted-foreground leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}