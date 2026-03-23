import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookmarkX, Loader2, Brain, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuizCard from '@/components/quiz/QuizCard';

export default function SavedQuizzes() {
  const [user, setUser] = useState(null);
  const [filterReason, setFilterReason] = useState('all');
  const queryClient = useQueryClient();

  // Fetch current user
  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Fetch bookmarks
  const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery({
    queryKey: ['quizBookmarks', user?.email],
    queryFn: () => user?.email ? base44.entities.QuizBookmark.filter({ user_email: user.email }) : [],
    enabled: !!user?.email,
  });

  // Fetch all quizzes to match with bookmarks
  const { data: allQuizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => base44.entities.Quiz.list(),
  });

  // Create map of quiz details
  const quizMap = useMemo(() => {
    const map = {};
    allQuizzes.forEach(q => { map[q.id] = q; });
    return map;
  }, [allQuizzes]);

  // Get quiz details for each bookmark
  const savedQuizzes = useMemo(() => {
    return bookmarks
      .map(bm => ({
        ...quizMap[bm.quiz_id],
        bookmarkId: bm.id,
        reason: bm.reason,
        notes: bm.notes,
      }))
      .filter(q => q.id); // Only quizzes that still exist
  }, [bookmarks, quizMap]);

  const filtered = useMemo(() => {
    if (filterReason === 'all') return savedQuizzes;
    return savedQuizzes.filter(q => q.reason === filterReason);
  }, [savedQuizzes, filterReason]);

  // Delete bookmark mutation
  const deleteBookmark = useMutation({
    mutationFn: (bookmarkId) => base44.entities.QuizBookmark.delete(bookmarkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizBookmarks', user?.email] });
    },
  });

  const handleStart = (quiz) => {
    window.location.href = `/QuizEngine?quiz=${quiz.id}`;
  };

  const handleRemoveBookmark = (bookmarkId) => {
    deleteBookmark.mutate(bookmarkId);
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          📌 Saved Quizzes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your collection of quizzes to revisit, master, or retry later
        </p>
      </div>

      {/* Filter */}
      {savedQuizzes.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {['all', 'favorite', 'too_hard', 'revisit', 'other'].map(reason => (
            <button
              key={reason}
              onClick={() => setFilterReason(reason)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                filterReason === reason
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {reason === 'all' ? 'All Saved' : reason === 'too_hard' ? 'Too Hard' : reason}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {bookmarksLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">
            {savedQuizzes.length === 0
              ? 'No saved quizzes yet. Bookmark quizzes from the Quiz Engine to save them here!'
              : 'No quizzes match this filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(quiz => (
            <div key={quiz.id} className="relative group">
              <QuizCard
                quiz={quiz}
                onStart={handleStart}
                onLinkLab={() => {}}
              />
              {/* Remove bookmark button */}
              <button
                onClick={() => handleRemoveBookmark(quiz.bookmarkId)}
                disabled={deleteBookmark.isPending}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 rounded-lg p-2 text-destructive"
                title="Remove from saved"
              >
                <BookmarkX className="w-4 h-4" />
              </button>
              {/* Reason badge */}
              {quiz.reason && (
                <div className="absolute bottom-3 left-3 text-xs bg-primary/20 border border-primary/30 text-primary px-2 py-1 rounded-full capitalize">
                  {quiz.reason === 'too_hard' ? '🔥 Too Hard' : quiz.reason === 'favorite' ? '❤️ Favorite' : '📌 Revisit'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}