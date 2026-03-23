import React from 'react';
import { Clock, Play, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SEVERITY_COLORS = {
  critical: 'text-destructive bg-destructive/10 border-destructive/20',
  high:     'text-orange-400 bg-orange-500/10 border-orange-400/20',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-400/20',
};

export default function SavedSessions({ sessions, onReplay, onDelete }) {
  if (sessions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
        <FileText className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">No saved sessions yet</p>
        <p className="text-xs text-muted-foreground/70">Run an attack simulation and save the session to replay it later.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Saved Sessions
        </span>
        <span className="text-xs text-muted-foreground">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="divide-y divide-border">
        {sessions.map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground truncate">{s.attack?.name || 'Unknown Attack'}</span>
                <ChevronSep />
                <span className="text-xs text-muted-foreground">{s.target?.name} ({s.target?.ip})</span>
                {s.attack?.severity && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[s.attack.severity] || SEVERITY_COLORS.medium}`}>
                    {s.attack.severity.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                <span><Clock className="w-2.5 h-2.5 inline mr-1" />{new Date(s.savedAt).toLocaleString()}</span>
                <span>{s.logs?.length || 0} log entries</span>
                {s.metrics && (
                  <>
                    <span className="text-primary">{s.metrics.blocked} blocked</span>
                    <span className="text-amber-400">{s.metrics.detected} detected</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onReplay(s)}>
                <Play className="w-3 h-3" /> Replay
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(i)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChevronSep() {
  return <span className="text-muted-foreground/40 text-xs">›</span>;
}