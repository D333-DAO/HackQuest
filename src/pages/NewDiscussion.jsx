import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

export default function NewDiscussion() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPath, setSelectedPath] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selectedLab, setSelectedLab] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: paths = [] } = useQuery({
    queryKey: ['paths'],
    queryFn: () => base44.entities.LearningPath.list('-created_date', 50),
  });
  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => base44.entities.Quiz.list('-created_date', 50),
  });
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: async (discussionData) => {
      return base44.entities.Discussion.create(discussionData);
    },
    onSuccess: (newDiscussion) => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      navigate(`/Discussion?id=${newDiscussion.id}`);
    },
  });

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);

    const pathObj = paths.find(p => p.id === selectedPath);
    const quizObj = quizzes.find(q => q.id === selectedQuiz);
    const roomObj = rooms.find(r => r.id === selectedLab);

    await createMutation.mutateAsync({
      title,
      description,
      path_id: selectedPath || null,
      path_title: pathObj?.title || null,
      quiz_id: selectedQuiz || null,
      quiz_title: quizObj?.title || null,
      lab_id: selectedLab || null,
      lab_title: roomObj?.title || null,
      tags,
      author_email: user.email,
      author_name: user.full_name,
      view_count: 0,
      reply_count: 0,
      solved: false,
    });

    setIsSubmitting(false);
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">You need to sign in to create a discussion</p>
        <Button variant="outline">Sign In</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/Community" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Community
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Start a New Discussion</h1>
          <p className="text-sm text-muted-foreground mt-1">Ask a question or share an insight with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Discussion Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question or topic?"
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/40"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context and details..."
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/40 resize-none min-h-[150px]"
            />
          </div>

          {/* Context selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase">Learning Path (optional)</label>
              <select
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/40"
              >
                <option value="">None</option>
                {paths.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase">Quiz (optional)</label>
              <select
                value={selectedQuiz}
                onChange={(e) => setSelectedQuiz(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/40"
              >
                <option value="">None</option>
                {quizzes.map(q => (
                  <option key={q.id} value={q.id}>{q.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase">Lab (optional)</label>
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/40"
              >
                <option value="">None</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Tags</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type and press Enter to add tags..."
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/40"
            />
            {tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {tags.map(tag => (
                  <div key={tag} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full px-3 py-1 text-sm">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : ''}
              {isSubmitting ? 'Creating...' : 'Create Discussion'}
            </Button>
            <Link to="/Community">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}