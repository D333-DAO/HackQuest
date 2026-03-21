import React from 'react';
import { Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SimulatorLaunchPanel({ node, scenario, isRunning, phaseIdx, onLaunch }) {
  const ready = node && scenario && !isRunning;
  const phases = scenario?.phases || [];

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground mb-1">3. Launch Attack</p>
          {!node && !scenario && (
            <p className="text-xs text-muted-foreground">Select a target node and attack scenario above to begin.</p>
          )}
          {node && !scenario && (
            <p className="text-xs text-muted-foreground">Now choose an attack scenario for <span className="text-foreground font-medium">{node.name}</span>.</p>
          )}
          {node && scenario && (
            <p className="text-xs text-muted-foreground">
              Ready to launch <span className={`font-semibold ${scenario.color}`}>{scenario.name}</span> against{' '}
              <span className="text-foreground font-medium">{node.name} ({node.ip})</span> — {phases.length} phases
            </p>
          )}
        </div>

        <Button
          onClick={onLaunch}
          disabled={!ready}
          className={`gap-2 shrink-0 ${scenario ? `bg-amber-500 hover:bg-amber-600 text-black` : ''}`}
        >
          {isRunning
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Running…</>
            : <><Zap className="w-4 h-4" /> Launch Attack</>
          }
        </Button>
      </div>

      {/* Phase progress bar */}
      {scenario && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            {phases.map((p, i) => {
              const done    = phaseIdx > i;
              const active  = phaseIdx === i;
              return (
                <div key={i} className="flex-1 min-w-0">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${
                    done   ? 'bg-primary' :
                    active ? 'bg-amber-400 animate-pulse' :
                             'bg-secondary'
                  }`} />
                  <p className={`text-[9px] mt-1 truncate text-center transition-colors ${
                    active ? 'text-amber-400 font-semibold' :
                    done   ? 'text-primary' :
                             'text-muted-foreground'
                  }`}>{p.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}