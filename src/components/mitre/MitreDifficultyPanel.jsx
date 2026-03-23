import React from 'react';
import { EyeOff, Zap, RefreshCw, Volume2 } from 'lucide-react';

const PARAMS = [
  {
    key: 'stealth',
    label: 'Stealth',
    icon: EyeOff,
    color: 'text-cyan-400',
    trackColor: 'accent-cyan-400',
    description: 'How quietly the attacker operates — slow/quiet at 100, noisy/fast at 0.',
    low: 'Noisy',
    high: 'Silent',
  },
  {
    key: 'evasion',
    label: 'Evasion',
    icon: Zap,
    color: 'text-purple-400',
    trackColor: 'accent-purple-400',
    description: 'Use of LOLBins, obfuscation, and AV bypass techniques.',
    low: 'None',
    high: 'Advanced',
  },
  {
    key: 'persistence',
    label: 'Persistence',
    icon: RefreshCw,
    color: 'text-amber-400',
    trackColor: 'accent-amber-400',
    description: 'Number of footholds and backup access mechanisms planted.',
    low: 'Minimal',
    high: 'Deep',
  },
  {
    key: 'noise',
    label: 'Noise',
    icon: Volume2,
    color: 'text-red-400',
    trackColor: 'accent-red-400',
    description: 'Volume of suspicious activity — higher noise triggers more alerts.',
    low: 'Quiet',
    high: 'Loud',
  },
];

const PRESETS = [
  { label: 'Script Kiddie', values: { stealth: 10, evasion: 5, persistence: 10, noise: 90 } },
  { label: 'Red Team Lite', values: { stealth: 55, evasion: 40, persistence: 30, noise: 40 } },
  { label: 'APT Simulation', values: { stealth: 90, evasion: 85, persistence: 80, noise: 15 } },
  { label: 'Ransomware', values: { stealth: 30, evasion: 50, persistence: 70, noise: 80 } },
];

export default function MitreDifficultyPanel({ difficulty, onChange }) {
  const applyPreset = (preset) => onChange({ ...difficulty, ...preset.values });

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">3. Attacker Profile</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Presets */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-2">Quick Presets</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="text-[11px] font-medium px-3 py-2 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 text-foreground text-left transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Sliders */}
        <div className="space-y-4">
          {PARAMS.map(p => {
            const Icon = p.icon;
            const val = difficulty[p.key] ?? 50;
            return (
              <div key={p.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${p.color}`} />
                    <span className="text-xs font-semibold text-foreground">{p.label}</span>
                  </div>
                  <span className={`text-sm font-black ${p.color}`}>{val}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={val}
                  onChange={e => onChange({ ...difficulty, [p.key]: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-full appearance-none bg-secondary cursor-pointer"
                  style={{ accentColor: 'hsl(var(--primary))' }}
                />
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>{p.low}</span>
                  <span className="text-center text-[9px] text-muted-foreground/60 italic hidden sm:block">{p.description}</span>
                  <span>{p.high}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary chip */}
        <div className="bg-secondary/40 border border-border rounded-xl px-3 py-2 text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Profile: </span>
          {difficulty.stealth >= 70 ? 'Highly stealthy' : difficulty.stealth >= 40 ? 'Moderate stealth' : 'Noisy'},{' '}
          {difficulty.evasion >= 70 ? 'advanced AV evasion' : difficulty.evasion >= 40 ? 'some evasion' : 'no evasion'},{' '}
          {difficulty.persistence >= 70 ? 'deep persistence' : difficulty.persistence >= 40 ? 'light persistence' : 'no persistence focus'},{' '}
          {difficulty.noise >= 70 ? 'high alert volume' : difficulty.noise >= 40 ? 'moderate alerts' : 'low alert volume'}.
        </div>
      </div>
    </div>
  );
}