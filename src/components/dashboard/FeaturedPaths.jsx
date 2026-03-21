import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, BookOpen, Lock, CheckCircle2 } from 'lucide-react';

const DIFF_CONFIG = {
  beginner:     { label: 'Beginner',     cls: 'bg-primary/10 text-primary border-primary/25' },
  intermediate: { label: 'Intermediate', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
  advanced:     { label: 'Advanced',     cls: 'bg-destructive/10 text-destructive border-destructive/25' },
};

const PATH_COVERS = [
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&q=80',
  'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=400&q=80',
];

export default function FeaturedPaths({ paths }) {
  if (!paths.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground">Learning Paths</h3>
        <Link to="/Paths" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {paths.slice(0, 4).map((path, idx) => {
          const diff = DIFF_CONFIG[path.difficulty] || DIFF_CONFIG.beginner;
          const coverImg = path.image_url || PATH_COVERS[idx % PATH_COVERS.length];
          return (
            <Link
              key={path.id}
              to={`/PathDetail?id=${path.id}`}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Cover */}
              <div className="relative h-28 overflow-hidden">
                <img src={coverImg} alt={path.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff.cls}`}>
                  {diff.label}
                </span>
              </div>

              {/* Body */}
              <div className="p-4">
                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                  {path.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{path.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {path.room_ids?.length || 0} rooms
                  </span>
                  {path.estimated_hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {path.estimated_hours}h
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}