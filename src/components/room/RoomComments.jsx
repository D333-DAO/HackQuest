import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, ThumbsUp, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function RoomComments({ roomId }) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['room-comments', roomId],
    queryFn: () => base44.entities.RoomComment.filter({ room_id: roomId }, '-created_date', 100),
    enabled: !!roomId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content) => {
      return base44.entities.RoomComment.create({
        room_id: roomId,
        content,
        author_email: user.email,
        author_name: user.full_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-comments', roomId] });
      setCommentText('');
    },
  });

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
      alert('Please log in to comment');
      return;
    }

    setIsSubmitting(true);
    await createCommentMutation.mutateAsync(commentText);
    setIsSubmitting(false);
  };

  const handleHelpful = async (commentId) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    await base44.entities.RoomComment.update(commentId, {
      helpful_count: (comment.helpful_count || 0) + 1,
    });

    queryClient.invalidateQueries({ queryKey: ['room-comments', roomId] });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Discussion ({comments.length})</h2>
      </div>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-6 pb-6 border-b border-border">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share tips, ask for help, or discuss the challenge..."
            className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/40 resize-none mb-3 min-h-[100px]"
            maxLength={500}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{commentText.length}/500</span>
            <Button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-6 pb-6 border-b border-border">
          <p className="text-sm text-muted-foreground">Please log in to join the discussion.</p>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="p-4 bg-secondary/30 border border-border rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{comment.author_name || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">
                    {comment.created_date ? format(new Date(comment.created_date), 'MMM d, yyyy') : ''}
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">{comment.content}</p>
              <button
                onClick={() => handleHelpful(comment.id)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Helpful ({comment.helpful_count || 0})
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}