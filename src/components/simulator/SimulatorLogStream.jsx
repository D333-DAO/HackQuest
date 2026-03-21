import React, { useEffect, useRef } from 'react';
import { Terminal, Loader2 } from 'lucide-react';

const TYPE_STYLE = {
  attacker: { color: 'text-destructive', prefix: '[ATTACKER]' },
  firewall: { color: 'text-primary',     prefix: '[FIREWALL]' },
  ids:      { color: 'text-orange-400',  prefix: '[IDS]     ' },
  siem:     { color: 'text-purple-400',  prefix: '[SIEM]    ' },
  system:   { color: 'text-accent',      prefix: '[SYSTEM]  ' },
  phase:    { color: 'text-amber-400',   prefix: '[PHASE]   ' },
};

function fmt(iso) {
  try { return new Date(iso).toLocaleTimeString(); } catch { return ''; }
}

export default function SimulatorLogStream({ logs, isRunning }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/40">
        <Terminal className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Live Attack Stream</span>
        {isRunning && <Loader2 className="w-3.5 h-3.5 text-destructive animate-spin ml-1" />}
        <span className="ml-auto text-[10px] text-muted-foreground">{logs.length} entries</span>
      </div>
      <div className="p-3 h-64 overflow-y-auto font-mono text-[11px] space-y-0.5">
        {logs.map((log, i) => {
          const style = TYPE_STYLE[log.type] || TYPE_STYLE.system;
          const isPhase = log.source === 'PHASE';
          return (
            <div key={i} className={isPhase ? 'py-1' : ''}>
              {isPhase ? (
                <p className="text-amber-400 font-semibold text-[10px] tracking-wide">{log.message}</p>
              ) : (
                <p className="leading-relaxed">
                  <span className="text-muted-foreground/60">{fmt(log.time)} </span>
                  <span className={`${style.color} font-semibold`}>{style.prefix} </span>
                  <span className="text-foreground/80">{log.message}</span>
                </p>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}