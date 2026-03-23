import React, { useEffect, useRef } from 'react';
import { Terminal, Loader2 } from 'lucide-react';

const LOG_STYLES = {
  attacker: { color: 'text-red-400', prefix: '[ATTACKER]' },
  firewall: { color: 'text-green-400', prefix: '[FIREWALL]' },
  ids: { color: 'text-amber-400', prefix: '[IDS]    ' },
  siem: { color: 'text-blue-400', prefix: '[SIEM]   ' },
  system: { color: 'text-muted-foreground', prefix: '[SYSTEM] ' },
  info: { color: 'text-cyan-400', prefix: '[INFO]   ' },
};

export default function SandboxTerminal({ logs, isLoading }) {
  const bottomRef = useRef(null);

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour12: false });
    } catch { return ''; }
  };

  return (
    <div className="bg-[#0d1117] border border-border rounded-2xl overflow-hidden flex flex-col min-h-80 max-h-96">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/70" />
          <div className="w-3 h-3 rounded-full bg-amber-400/70" />
          <div className="w-3 h-3 rounded-full bg-primary/70" />
        </div>
        <div className="flex items-center gap-2 ml-2">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono">sandbox@kali:~$ — Defense Log Monitor</span>
        </div>
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin ml-auto" />}
      </div>

      {/* Log output */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-0.5">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full py-8">
            <p className="text-muted-foreground text-xs">Launch an attack to see real-time logs...</p>
          </div>
        ) : (
          logs.map((log, i) => {
            const style = LOG_STYLES[log.type] || LOG_STYLES.system;
            return (
              <div key={i} className="flex gap-2 leading-relaxed">
                <span className="text-muted-foreground/50 flex-shrink-0 w-20">{formatTime(log.time)}</span>
                <span className={`flex-shrink-0 ${style.color} font-semibold`}>{style.prefix}</span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}