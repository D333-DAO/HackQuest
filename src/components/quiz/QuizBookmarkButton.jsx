import React, { useState } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function QuizBookmarkButton({ quiz, user, isBookmarked = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleBookmark = async (reason) => {
    setIsLoading(true);
    try {
      // Check if already bookmarked (remove if so)
      if (isBookmarked) {
        const existing = await base44.entities.QuizBookmark.filter({
          user_email: user.email,
          quiz_id: quiz.id,
        });
        if (existing.length > 0) {
          await base44.entities.QuizBookmark.delete(existing[0].id);
        }
      } else {
        // Add bookmark
        await base44.entities.QuizBookmark.create({
          user_email: user.email,
          quiz_id: quiz.id,
          quiz_title: quiz.title,
          quiz_difficulty: quiz.difficulty,
          reason,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['quizBookmarks', user.email] });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`${
          isBookmarked
            ? 'bg-primary/15 text-primary border border-primary/30'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        )}
      </Button>

      {/* Dropdown menu */}
      {isOpen && !isLoading && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-max">
          {isBookmarked ? (
            <button
              onClick={() => handleBookmark(null)}
              className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/50 rounded-lg"
            >
              Remove from Saved
            </button>
          ) : (
            <>
              <button
                onClick={() => handleBookmark('favorite')}
                className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/50 rounded-t-lg"
              >
                ❤️ Add as Favorite
              </button>
              <button
                onClick={() => handleBookmark('too_hard')}
                className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/50"
              >
                🔥 Too Hard
              </button>
              <button
                onClick={() => handleBookmark('revisit')}
                className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/50"
              >
                📌 Revisit Later
              </button>
              <button
                onClick={() => handleBookmark('other')}
                className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/50 rounded-b-lg"
              >
                📝 Other
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}