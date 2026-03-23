import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, StepForward, X, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOG_STYLES = {
  attacker: { color: 'text-red-400',           prefix: '[ATTACKER]' },
  firewall: { color: 'text-green-400',          prefix: '[FIREWALL]' },
  ids:      { color: 'text-amber-400',          prefix: '[IDS]    ' },
  siem:     { color: 'text-blue-400',           prefix: '[SIEM]   ' },
  system:   { color: 'text-muted-foreground',   prefix: '[SYSTEM] ' },
  info:     { color: 'text-cyan-400',           prefix: '[INFO]   ' },
};

const SPEEDS = [0.5, 1, 2, 4];

export default function SessionReplay({ session, onClose }) {
  const [cursor, setCursor]     = useState(0);   // how many logs shown
  const [playing, setPlaying]   = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);   // index into SPEEDS
  const intervalRef             = useRef(null);
  const bottomRef               = useRef(null);
  const { logs, attack, target, metrics, savedAt } = session;

  const speed = SPEEDS[speedIdx];

  const clearTimer = () => { clearInterval(intervalRef.current); intervalRef.current = null; };

  const tick = useCallback(() => {
    setCursor(prev => {
      if (prev >= logs.length) {
        clearTimer();
        setPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [logs.length]);

  useEffect(() => {
    if (playing) {
      clearTimer();
      intervalRef.current = setInterval(tick, Math.round(350 / speed));
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [playing, speed, tick]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cursor]);

  const visibleLogs = logs.slice(0, cursor);
  const progress    = logs.length > 0 ? Math.round((cursor / logs.length) * 100) : 0;

  const formatTime = (iso) => {
    try { return new Date(iso).toLocaleTimeString('en-US', { hour12: false }); }
    catch { return ''; }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-secondary/30">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              {attack?.name || 'Session'} → {target?.name || 'Unknown'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border font-mono">
              {target?.ip}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Saved {new Date(savedAt).toLocaleString()} · {logs.length} log entries
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Log area */}
      <div className="bg-[#0d1117] flex-1 min-h-72 max-h-96 overflow-y-auto p-3 font-mono text-xs space-y-0.5">
        {visibleLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full py-10">
            <p className="text-muted-foreground">Press play to begin replay...</p>
          </div>
        ) : (
          visibleLogs.map((log, i) => {
            const style = LOG_STYLES[log.type] || LOG_STYLES.system;
            const isNew = i === visibleLogs.length - 1;
            return (
              <div key={i} className={`flex gap-2 leading-relaxed ${isNew ? 'opacity-100' : 'opacity-80'}`}>
                <span className="text-muted-foreground/40 flex-shrink-0 w-20">{formatTime(log.time)}</span>
                <span className={`flex-shrink-0 ${style.color} font-semibold`}>{style.prefix}</span>
                <span className="text-slate-300 break-all">{log.message}</span>
                {isNew && <ChevronRight className="w-3 h-3 text-primary animate-pulse ml-auto shrink-0 self-center" />}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-secondary/20">
        {/* Rewind */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPlaying(false); setCursor(0); }}>
          <SkipBack className="w-4 h-4" />
        </Button>

        {/* Step back */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPlaying(false); setCursor(c => Math.max(0, c - 1)); }}>
          <StepForward className="w-4 h-4 rotate-180" />
        </Button>

        {/* Play / Pause */}
        <Button
          size="sm"
          className="gap-1.5 h-8 px-4"
          onClick={() => {
            if (cursor >= logs.length) setCursor(0);
            setPlaying(p => !p);
          }}
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {playing ? 'Pause' : cursor >= logs.length ? 'Replay' : cursor === 0 ? 'Play' : 'Resume'}
        </Button>

        {/* Step forward */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPlaying(false); setCursor(c => Math.min(logs.length, c + 1)); }}>
          <StepForward className="w-4 h-4" />
        </Button>

        {/* Jump to end */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPlaying(false); setCursor(logs.length); }}>
          <SkipForward className="w-4 h-4" />
        </Button>

        {/* Speed selector */}
        <div className="ml-auto flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Speed:</span>
          {SPEEDS.map((s, i) => (
            <button
              key={s}
              onClick={() => setSpeedIdx(i)}
              className={`text-xs px-2 py-1 rounded font-mono transition-colors ${
                speedIdx === i ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Progress label */}
        <span className="text-xs font-mono text-muted-foreground ml-2">{cursor}/{logs.length}</span>
      </div>

      {/* Metrics summary bar */}
      {metrics && (
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-border bg-secondary/10 text-xs flex-wrap">
          <span className="text-muted-foreground">Session summary:</span>
          <span className="text-primary font-semibold">{metrics.blocked} blocked</span>
          <span className="text-amber-400 font-semibold">{metrics.detected} detected</span>
          <span className="text-blue-400 font-semibold">{metrics.connections} connections</span>
          {metrics.alerts?.length > 0 && (
            <span className="text-destructive font-semibold">{metrics.alerts.length} alerts</span>
          )}
        </div>
      )}
    </div>
  );
}