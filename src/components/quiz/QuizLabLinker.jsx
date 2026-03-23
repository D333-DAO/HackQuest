import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, FlaskConical, X, Check, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORY_COLORS = {
  networking:           'text-cyan-400',
  web_hacking:         'text-orange-400',
  linux:               'text-primary',
  windows:             'text-blue-400',
  cryptography:        'text-purple-400',
  forensics:           'text-yellow-400',
  reverse_engineering: 'text-red-400',
  privilege_escalation:'text-pink-400',
  osint:               'text-teal-400',
  other:               'text-muted-foreground',
};

export default function QuizLabLinker({ quiz, onClose }) {
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms_all'],
    queryFn: () => base44.entities.Room.list('-created_date', 100),
  });

  const filtered = rooms.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleLink = async (room) => {
    setSaving(true);
    await base44.entities.Quiz.update(quiz.id, {
      linked_room_id: room.id,
      linked_room_name: room.title,
    });
    queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    setSaving(false);
    onClose();
  };

  const handleUnlink = async () => {
    setSaving(true);
    await base44.entities.Quiz.update(quiz.id, {
      linked_room_id: '',
      linked_room_name: '',
    });
    queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Link2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Link Lab to Quiz</h2>
              <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">{quiz.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current link */}
        {quiz.linked_room_id && (
          <div className="mx-5 mt-4 flex items-center justify-between gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-primary">Currently linked</p>
                <p className="text-xs text-muted-foreground">{quiz.linked_room_name || quiz.linked_room_id}</p>
              </div>
            </div>
            <button
              onClick={handleUnlink}
              disabled={saving}
              className="text-[10px] font-bold text-destructive hover:text-destructive/80 px-2 py-1 rounded border border-destructive/20 hover:bg-destructive/10 transition-colors"
            >
              Remove
            </button>
          </div>
        )}

        {/* Search */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <p className="text-xs text-muted-foreground mb-2">
            Select a lab/room to recommend when a user fails this quiz:
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search labs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-secondary/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-1.5">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-8">Loading labs...</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No labs found.</p>
          ) : (
            filtered.map(room => {
              const isLinked = quiz.linked_room_id === room.id;
              const catColor = CATEGORY_COLORS[room.category] || CATEGORY_COLORS.other;
              return (
                <button
                  key={room.id}
                  disabled={saving}
                  onClick={() => handleLink(room)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                    isLinked
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-secondary/20 border-border hover:border-primary/30 hover:bg-secondary/40'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <FlaskConical className={`w-4 h-4 ${catColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{room.title}</p>
                    <p className={`text-[10px] capitalize ${catColor}`}>{room.category?.replace('_', ' ') || 'General'}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                    room.difficulty === 'hard' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    room.difficulty === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-primary/10 border-primary/20 text-primary'
                  }`}>
                    {room.difficulty || 'easy'}
                  </span>
                  {isLinked && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}