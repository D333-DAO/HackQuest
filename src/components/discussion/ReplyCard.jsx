import React, { useState } from 'react';
import { ThumbsUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ReplyCard({ reply, isAuthor, isSolution, onMarkSolution, userEmail }) {
  const [isUpvoting, setIsUpvoting] = useState(false);
  const queryClient = useQueryClient();

  const { data: upvotes = [] } = useQuery({
    queryKey: ['upvotes', reply.id],
    queryFn: () => base44.entities.DiscussionUpvote.filter({ reply_id: reply.id }),
  });

  const hasUpvoted = upvotes.some(u => u.user_email === userEmail);

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      if (hasUpvoted) {
        const existing = upvotes.find(u => u.user_email === userEmail);
        if (existing) await base44.entities.DiscussionUpvote.delete(existing.id);
      } else {
        await base44.entities.DiscussionUpvote.create({
          reply_id: reply.id,
          user_email: userEmail,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upvotes', reply.id] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });

  const handleUpvote = async () => {
    setIsUpvoting(true);
    await upvoteMutation.mutateAsync();
    setIsUpvoting(false);
  };

  return (
    <div className={`bg-card border rounded-xl p-4 space-y-3 ${isSolution ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm text-foreground leading-relaxed">{reply.content}</p>
          <p className="text-xs text-muted-foreground mt-2">by {reply.author_name}</p>
        </div>
        {isSolution && (
          <span className="flex items-center gap-1 text-xs bg-primary/10 border border-primary/20 text-primary rounded-full px-2 py-1 shrink-0">
            <Check className="w-3 h-3" /> Solution
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
        <Button
          size="sm"
          variant={hasUpvoted ? 'default' : 'outline'}
          onClick={handleUpvote}
          disabled={isUpvoting}
          className="gap-1.5 h-7"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span className="text-xs">{upvotes.length}</span>
        </Button>
        {isAuthor && !isSolution && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMarkSolution(reply.id)}
            className="gap-1.5 h-7 ml-auto text-xs"
          >
            <Check className="w-3 h-3" /> Mark as Solution
          </Button>
        )}
      </div>
    </div>
  );
}