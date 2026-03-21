import React from 'react';
import { ShieldCheck, Eye, Radio, AlertTriangle } from 'lucide-react';

export default function SandboxMetrics({ metrics }) {
  const cards = [
    { label: 'Attacks Blocked', value: metrics.blocked, icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'Threats Detected', value: metrics.detected, icon: Eye, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
    { label: 'Connections Logged', value: metrics.connections, icon: Radio, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
    { label: 'Alerts Raised', value: metrics.alerts.length, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className={`rounded-2xl border p-4 flex items-center gap-3 ${c.bg}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
              <Icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}