import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Filter, Flame } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import DiscussionCard from '@/components/discussion/DiscussionCard';
import { MobileSelect } from '@/components/ui/MobileSelect';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Replies' },
  { value: 'views', label: 'Most Views' },
];

export default function Community() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterSolved, setFilterSolved] = useState('all'); // all, solved, unsolved
  const [filterTag, setFilterTag] = useState('');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: discussions = [], isLoading } = useQuery({
    queryKey: ['discussions'],
    queryFn: () => base44.entities.Discussion.list('-created_date', 100),
  });

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    discussions.forEach(d => {
      (d.tags || []).forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [discussions]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = discussions.filter(d => {
      const matchSearch = !searchTerm || 
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchSolved = filterSolved === 'all' || 
        (filterSolved === 'solved' && d.solved) ||
        (filterSolved === 'unsolved' && !d.solved);
      
      const matchTag = !filterTag || (d.tags && d.tags.includes(filterTag));
      
      return matchSearch && matchSolved && matchTag;
    });

    // Sort
    if (sortBy === 'popular') {
      result.sort((a, b) => (b.reply_count || 0) - (a.reply_count || 0));
    } else if (sortBy === 'views') {
      result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    } else {
      result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    return result;
  }, [discussions, searchTerm, sortBy, filterSolved, filterTag]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/Dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" /> Community Discussions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Ask questions, share solutions, and learn together</p>
        </div>
        {user && (
          <Link to="/NewDiscussion">
            <Button className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Start Discussion
            </Button>
          </Link>
        )}
      </div>

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/40"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          
          {/* Solved filter */}
          <div className="flex items-center gap-1.5">
            {['all', 'solved', 'unsolved'].map(val => (
              <button
                key={val}
                onClick={() => setFilterSolved(val)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                  filterSolved === val
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {val === 'all' ? 'All' : val}
              </button>
            ))}
          </div>

          {/* Sort */}
          <MobileSelect
            value={sortBy}
            onValueChange={setSortBy}
            options={SORT_OPTIONS}
            triggerClassName="text-xs px-3 py-1 rounded-lg bg-secondary border border-border text-foreground h-auto min-h-0"
          />
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Tags:</span>
            <button
              onClick={() => setFilterTag('')}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                !filterTag
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  filterTag === tag
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Discussions list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <Flame className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">No discussions found. Be the first to start one!</p>
          {user && (
            <Link to="/NewDiscussion">
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Create First Discussion
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(discussion => (
            <DiscussionCard key={discussion.id} discussion={discussion} />
          ))}
        </div>
      )}
    </div>
  );
}