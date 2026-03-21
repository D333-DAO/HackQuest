import React from 'react';
import { Globe, Server, Monitor, Cpu } from 'lucide-react';

const ICONS = {
  'web-server':          Globe,
  'db-server':           Server,
  'windows-workstation': Monitor,
  'iot-device':          Cpu,
};

const COLORS = {
  'web-server':          'text-blue-400',
  'db-server':           'text-purple-400',
  'windows-workstation': 'text-cyan-400',
  'iot-device':          'text-amber-400',
};

export default function SimulatorNodeSelector({ nodes, selected, onSelect }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">1. Select Target Node</h3>
      <div className="grid grid-cols-2 gap-2">
        {nodes.map(n => {
          const Icon = ICONS[n.id] || Server;
          const isSelected = selected?.id === n.id;
          return (
            <button
              key={n.id}
              onClick={() => onSelect(n)}
              className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-secondary/30 border-border hover:border-primary/20 hover:bg-secondary/60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : COLORS[n.id]}`} />
                <span className="text-xs font-semibold text-foreground">{n.name}</span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground">{n.ip}</p>
              <p className="text-[10px] text-muted-foreground">{n.os}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {n.services.map(s => (
                  <span key={s} className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-mono">{s}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}