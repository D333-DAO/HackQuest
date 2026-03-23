import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import ReplyCard from '@/components/discussion/ReplyCard';

export default function DiscussionDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const discussionId = urlParams.get('id');
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: discussion, isLoading } = useQuery({
    queryKey: ['discussion', discussionId],
    queryFn: () => base44.entities.Discussion.filter({ id: discussionId }).then(r => r[0]),
    enabled: !!discussionId,
  });

  const { data: replies = [] } = useQuery({
    queryKey: ['replies', discussionId],
    queryFn: () => base44.entities.DiscussionReply.filter({ discussion_id: discussionId }, '-created_date'),
    enabled: !!discussionId,
  });

  // Increment view count
  useEffect(() => {
    if (discussion && user) {
      base44.entities.Discussion.update(discussion.id, {
        view_count: (discussion.view_count || 0) + 1,
      });
    }
  }, [discussion?.id]);

  const submitReplyMutation = useMutation({
    mutationFn: async (content) => {
      const reply = await base44.entities.DiscussionReply.create({
        discussion_id: discussionId,
        content,
        author_email: user.email,
        author_name: user.full_name,
      });

      // Update reply count
      await base44.entities.Discussion.update(discussionId, {
        reply_count: (discussion.reply_count || 0) + 1,
      });

      return reply;
    },
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['replies', discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });
    },
  });

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    await submitReplyMutation.mutateAsync(replyContent);
    setIsSubmitting(false);
  };

  const handleMarkSolution = async (replyId) => {
    await base44.entities.DiscussionReply.update(replyId, { is_solution: true });
    await base44.entities.Discussion.update(discussionId, { solved: true });
    queryClient.invalidateQueries({ queryKey: ['replies', discussionId] });
    queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Discussion not found</p>
      </div>
    );
  }

  const isAuthor = user?.email === discussion.author_email;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/Community" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Community
      </Link>

      {/* Discussion header */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground flex-1">{discussion.title}</h1>
            {discussion.solved && (
              <span className="text-xs bg-primary/10 border border-primary/20 text-primary rounded-full px-3 py-1 shrink-0">
                ✓ Solved
              </span>
            )}
          </div>
          <p className="text-muted-foreground">{discussion.description}</p>
        </div>

        {/* Context */}
        {(discussion.path_title || discussion.quiz_title || discussion.lab_title) && (
          <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-border/50">
            {discussion.path_title && (
              <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-2.5 py-1 rounded">
                Path: {discussion.path_title}
              </span>
            )}
            {discussion.quiz_title && (
              <span className="text-xs bg-accent/10 border border-accent/20 text-accent px-2.5 py-1 rounded">
                Quiz: {discussion.quiz_title}
              </span>
            )}
            {discussion.lab_title && (
              <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded">
                Lab: {discussion.lab_title}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {discussion.tags && discussion.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2">
            {discussion.tags.map(tag => (
              <span key={tag} className="text-xs bg-secondary/50 border border-border text-muted-foreground rounded-full px-2.5 py-1">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="text-xs text-muted-foreground pt-3 border-t border-border/50">
          Posted by {discussion.author_name} • {discussion.view_count || 0} views • {discussion.reply_count || 0} replies
        </div>
      </div>

      {/* Replies section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          Answers ({replies.length})
        </h2>

        {/* Solution first */}
        {replies.filter(r => r.is_solution).map(reply => (
          <ReplyCard
            key={reply.id}
            reply={reply}
            isAuthor={user?.email === reply.author_email}
            isSolution={true}
            onMarkSolution={handleMarkSolution}
            userEmail={user?.email}
          />
        ))}

        {/* Other replies */}
        {replies.filter(r => !r.is_solution).map(reply => (
          <ReplyCard
            key={reply.id}
            reply={reply}
            isAuthor={user?.email === reply.author_email}
            isSolution={false}
            onMarkSolution={handleMarkSolution}
            userEmail={user?.email}
          />
        ))}
      </div>

      {/* Reply form */}
      {user ? (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h3 className="font-semibold text-foreground">Your Answer</h3>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Share your solution or insight..."
            className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/40 resize-none min-h-[120px]"
          />
          <Button
            onClick={handleSubmitReply}
            disabled={isSubmitting || !replyContent.trim()}
            className="gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post Answer
          </Button>
        </div>
      ) : (
        <div className="bg-secondary/30 border border-border rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">Sign in to post an answer</p>
          <Button variant="outline">Sign In</Button>
        </div>
      )}
    </div>
  );
}