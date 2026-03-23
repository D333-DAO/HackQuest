import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Eye, CheckCircle2, Tag } from 'lucide-react';

export default function DiscussionCard({ discussion }) {
  return (
    <Link to={`/Discussion?id=${discussion.id}`}>
      <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors cursor-pointer">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground truncate">{discussion.title}</h3>
                {discussion.solved && (
                  <span className="flex items-center gap-1 text-[10px] bg-primary/10 border border-primary/20 text-primary rounded-full px-2 py-0.5 shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Solved
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{discussion.description}</p>
            </div>
          </div>

          {/* Tags */}
          {discussion.tags && discussion.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {discussion.tags.slice(0, 2).map(tag => (
                <span key={tag} className="flex items-center gap-1 text-[10px] bg-secondary/50 border border-border text-muted-foreground rounded-full px-2 py-0.5">
                  <Tag className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
              {discussion.tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground">+{discussion.tags.length - 2} more</span>
              )}
            </div>
          )}

          {/* Context badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {discussion.path_title && (
              <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2 py-1 rounded">
                Path: {discussion.path_title}
              </span>
            )}
            {discussion.quiz_title && (
              <span className="text-[10px] bg-accent/10 border border-accent/20 text-accent px-2 py-1 rounded">
                Quiz: {discussion.quiz_title}
              </span>
            )}
            {discussion.lab_title && (
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-1 rounded">
                Lab: {discussion.lab_title}
              </span>
            )}
          </div>

          {/* Footer stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> {discussion.reply_count || 0} replies
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {discussion.view_count || 0} views
            </span>
            <span className="text-muted-foreground/70">by {discussion.author_name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}