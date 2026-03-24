import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Server, Map, MessageSquare, Loader2 } from 'lucide-react';

const CATEGORY_META = {
  room:       { icon: Server,        label: 'Room',       color: 'text-primary' },
  path:       { icon: Map,           label: 'Path',       color: 'text-accent' },
  discussion: { icon: MessageSquare, label: 'Discussion', color: 'text-amber-400' },
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
    staleTime: 60_000,
  });
  const { data: paths = [] } = useQuery({
    queryKey: ['paths'],
    queryFn: () => base44.entities.LearningPath.list(),
    staleTime: 60_000,
  });
  const { data: discussions = [] } = useQuery({
    queryKey: ['discussions'],
    queryFn: () => base44.entities.Discussion.list('-created_date', 50),
    staleTime: 60_000,
  });

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const match = (text) => text?.toLowerCase().includes(q);

    const roomHits = rooms
      .filter(r => match(r.title) || match(r.description) || match(r.category))
      .slice(0, 4)
      .map(r => ({ id: r.id, title: r.title, subtitle: r.category?.replace('_', ' '), type: 'room', href: `/RoomDetail?id=${r.id}` }));

    const pathHits = paths
      .filter(p => match(p.title) || match(p.description) || match(p.category))
      .slice(0, 3)
      .map(p => ({ id: p.id, title: p.title, subtitle: p.difficulty, type: 'path', href: `/PathDetail?id=${p.id}` }));

    const discHits = discussions
      .filter(d => match(d.title) || match(d.description) || (d.tags || []).some(match))
      .slice(0, 3)
      .map(d => ({ id: d.id, title: d.title, subtitle: (d.tags || []).slice(0, 2).join(', ') || 'Discussion', type: 'discussion', href: `/Discussion?id=${d.id}` }));

    return [...roomHits, ...pathHits, ...discHits];
  }, [query, rooms, paths, discussions]);

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery('');
  }, [open]);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (href) => {
    navigate(href);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden lg:inline text-xs">Search...</span>
        <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded bg-background border border-border font-mono text-muted-foreground">⌘K</kbd>
      </button>

      {/* Overlay + dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search rooms, paths, discussions..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border font-mono text-muted-foreground">ESC</kbd>
              </div>

              {/* Results */}
              {query.trim() ? (
                <div className="max-h-80 overflow-y-auto">
                  {results.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No results for "<span className="text-foreground">{query}</span>"
                    </div>
                  ) : (
                    <ul className="py-2">
                      {results.map(item => {
                        const meta = CATEGORY_META[item.type];
                        const Icon = meta.icon;
                        return (
                          <li key={`${item.type}-${item.id}`}>
                            <button
                              onClick={() => handleSelect(item.href)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 transition-colors text-left"
                            >
                              <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                                {item.subtitle && (
                                  <p className="text-xs text-muted-foreground capitalize truncate">{item.subtitle}</p>
                                )}
                              </div>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                item.type === 'room' ? 'bg-primary/10 border-primary/20 text-primary' :
                                item.type === 'path' ? 'bg-accent/10 border-accent/20 text-accent' :
                                'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              }`}>
                                {meta.label}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="px-4 py-5 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground mb-2">Quick access</p>
                  {[
                    { label: 'Browse Rooms', href: '/Rooms', icon: Server },
                    { label: 'Learning Paths', href: '/Paths', icon: Map },
                    { label: 'Community', href: '/Community', icon: MessageSquare },
                  ].map(({ label, href, icon: Icon }) => (
                    <button
                      key={href}
                      onClick={() => handleSelect(href)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}