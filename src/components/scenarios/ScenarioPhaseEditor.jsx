import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ScenarioPhaseEditor({ phases, onChange }) {
  const addPhase = () => onChange([...phases, { label: '', duration: 1000 }]);
  const removePhase = (i) => onChange(phases.filter((_, idx) => idx !== i));
  const updatePhase = (i, field, value) => {
    const updated = phases.map((p, idx) => idx === i ? { ...p, [field]: value } : p);
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-muted-foreground">Attack Phases</label>
        <Button type="button" variant="outline" size="sm" onClick={addPhase} className="h-7 gap-1 text-xs">
          <Plus className="w-3 h-3" /> Add Phase
        </Button>
      </div>

      <div className="space-y-2">
        {phases.map((phase, i) => (
          <div key={i} className="flex items-center gap-2 bg-secondary/40 border border-border rounded-lg px-3 py-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <Input
              value={phase.label}
              onChange={e => updatePhase(i, 'label', e.target.value)}
              placeholder="Phase name, e.g. Reconnaissance"
              className="flex-1 h-7 text-xs bg-transparent border-0 focus-visible:ring-0 px-0"
            />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-muted-foreground">ms</span>
              <Input
                type="number"
                min={500} max={5000} step={100}
                value={phase.duration}
                onChange={e => updatePhase(i, 'duration', Number(e.target.value))}
                className="w-20 h-7 text-xs text-center"
              />
            </div>
            {phases.length > 1 && (
              <button type="button" onClick={() => removePhase(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground mt-1.5">Duration is in milliseconds (500–5000). Total attack time: {phases.reduce((s, p) => s + (p.duration || 0), 0).toLocaleString()}ms</p>
    </div>
  );
}