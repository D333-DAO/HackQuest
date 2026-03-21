import React from 'react';

const SEV_BADGE = {
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
  high:     'bg-orange-500/10 text-orange-400 border-orange-400/30',
  medium:   'bg-amber-500/10 text-amber-400 border-amber-400/30',
};

export default function SimulatorScenarioCard({ scenario, selected, onSelect, disabled }) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`text-left p-3 rounded-xl border transition-all duration-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' :
        selected
          ? `${scenario.bg} ${scenario.border}`
          : 'bg-secondary/30 border-border hover:border-border/80 hover:bg-secondary/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base leading-none">{scenario.icon}</span>
        <span className={`text-xs font-semibold ${selected ? scenario.color : 'text-foreground'}`}>
          {scenario.name}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed mb-2 line-clamp-2">{scenario.description}</p>
      <div className="flex items-center gap-2">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${SEV_BADGE[scenario.severity] || SEV_BADGE.medium}`}>
          {scenario.severity.toUpperCase()}
        </span>
        <span className="text-[9px] text-muted-foreground">{scenario.category}</span>
        <span className="text-[9px] text-muted-foreground ml-auto">{scenario.phases.length} phases</span>
      </div>
    </button>
  );
}