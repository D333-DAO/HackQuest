import React, { useState } from 'react';
import { ATTACK_SCENARIOS } from '@/lib/attackScenarios';
import {
  Plus, X, Play, ChevronUp, ChevronDown, GripVertical,
  Loader2, ArrowRight, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SEVERITY_COLOR = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  low:      'text-primary bg-primary/10 border-primary/30',
};

const STAGE_STATUS_ICON = {
  pending:  <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
  running:  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />,
  done:     <CheckCircle2 className="w-3.5 h-3.5 text-primary" />,
  failed:   <AlertCircle className="w-3.5 h-3.5 text-destructive" />,
};

// Pre-built campaign presets
const PRESETS = [
  {
    id: 'apt',
    name: 'APT Campaign',
    description: 'Full Advanced Persistent Threat kill chain',
    stages: ['osint-harvest', 'phishing', 'privilege-escalation', 'data-exfiltration'],
  },
  {
    id: 'ransomware-chain',
    name: 'Ransomware Kill Chain',
    description: 'Recon → exploit → lateral move → encrypt',
    stages: ['port-scan', 'smb-exploit', 'privilege-escalation', 'ransomware'],
  },
  {
    id: 'web-takeover',
    name: 'Web App Takeover',
    description: 'Web recon into full server compromise',
    stages: ['port-scan', 'sql-injection', 'lfi', 'reverse-shell'],
  },
  {
    id: 'ddos-cover',
    name: 'DDoS + Exfil',
    description: 'Distraction flood while exfiltrating data',
    stages: ['ddos', 'credential-stuffing', 'data-exfiltration'],
  },
];

function StageRow({ stage, index, total, status, onRemove, onMoveUp, onMoveDown, disabled }) {
  const scenario = ATTACK_SCENARIOS.find(s => s.id === stage);
  if (!scenario) return null;
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all ${
      status === 'running' ? 'border-primary/40 bg-primary/5' :
      status === 'done'    ? 'border-primary/20 bg-primary/5 opacity-70' :
      'border-border bg-secondary/20'
    }`}>
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
        {index + 1}
      </div>
      <span className="text-lg flex-shrink-0">{scenario.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{scenario.name}</p>
        <p className="text-[10px] text-muted-foreground">{scenario.category}</p>
      </div>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${SEVERITY_COLOR[scenario.severity]}`}>
        {scenario.severity.toUpperCase()}
      </span>
      <div className="flex-shrink-0">{STAGE_STATUS_ICON[status] || STAGE_STATUS_ICON.pending}</div>
      {!disabled && (
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button onClick={onMoveUp} disabled={index === 0} className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 text-muted-foreground">
            <ChevronUp className="w-3 h-3" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 text-muted-foreground">
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}
      {!disabled && (
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default function AttackChain({ target, isRunning, stageStatuses, onRunChain }) {
  const [chain, setChain] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const addStage = (id) => {
    if (!chain.includes(id)) setChain(prev => [...prev, id]);
    setShowPicker(false);
    setPickerSearch('');
  };

  const removeStage = (idx) => setChain(prev => prev.filter((_, i) => i !== idx));

  const moveUp = (idx) => setChain(prev => {
    const a = [...prev]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a;
  });

  const moveDown = (idx) => setChain(prev => {
    const a = [...prev]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a;
  });

  const loadPreset = (preset) => setChain(preset.stages);

  const filteredScenarios = ATTACK_SCENARIOS.filter(s =>
    !chain.includes(s.id) &&
    (s.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
     s.category.toLowerCase().includes(pickerSearch.toLowerCase()))
  );

  const currentStageIdx = stageStatuses.findIndex(s => s === 'running');
  const allDone = chain.length > 0 && stageStatuses.every(s => s === 'done');

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            Campaign Builder
            {chain.length > 0 && (
              <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-normal">
                {chain.length} stage{chain.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Chain multiple attacks to simulate a full kill chain</p>
        </div>
        {allDone && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">
            ✓ Campaign Complete
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Presets */}
        <div>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-2">Quick Presets</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                disabled={isRunning}
                className="text-left px-3 py-2 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/50 hover:border-muted-foreground/30 transition-all disabled:opacity-40"
              >
                <p className="text-xs font-semibold text-foreground">{preset.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{preset.description}</p>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {preset.stages.map(id => {
                    const s = ATTACK_SCENARIOS.find(a => a.id === id);
                    return s ? <span key={id} className="text-[9px]">{s.icon}</span> : null;
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chain stages */}
        {chain.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Attack Chain</p>
            {chain.map((stageId, idx) => (
              <React.Fragment key={stageId}>
                <StageRow
                  stage={stageId}
                  index={idx}
                  total={chain.length}
                  status={stageStatuses[idx] || 'pending'}
                  onRemove={() => removeStage(idx)}
                  onMoveUp={() => moveUp(idx)}
                  onMoveDown={() => moveDown(idx)}
                  disabled={isRunning}
                />
                {idx < chain.length - 1 && (
                  <div className="flex justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 rotate-90" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Add stage */}
        {!isRunning && (
          <div>
            {showPicker ? (
              <div className="border border-border rounded-xl overflow-hidden">
                <input
                  autoFocus
                  type="text"
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  placeholder="Search scenarios..."
                  className="w-full px-3 py-2 text-xs bg-secondary/40 border-b border-border text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filteredScenarios.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">All scenarios added</p>
                  ) : (
                    filteredScenarios.map(s => (
                      <button
                        key={s.id}
                        onClick={() => addStage(s.id)}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                      >
                        <span className="text-base">{s.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground">{s.category}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${SEVERITY_COLOR[s.severity]}`}>
                          {s.severity.toUpperCase()}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <button
                  onClick={() => { setShowPicker(false); setPickerSearch(''); }}
                  className="w-full py-2 text-xs text-muted-foreground hover:text-foreground border-t border-border transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPicker(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 text-xs text-muted-foreground hover:text-primary transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Stage
              </button>
            )}
          </div>
        )}

        {/* Run button */}
        <Button
          className="w-full gap-2"
          disabled={chain.length < 2 || !target || isRunning}
          onClick={() => onRunChain(chain)}
        >
          {isRunning ? (
            <><Loader2 className="w-4 h-4 animate-spin" />
              Running Stage {currentStageIdx + 1} of {chain.length}…
            </>
          ) : (
            <><Play className="w-4 h-4" />
              Run Campaign ({chain.length} stages)
            </>
          )}
        </Button>
        {chain.length < 2 && !isRunning && (
          <p className="text-[11px] text-muted-foreground text-center">Add at least 2 stages to run a campaign</p>
        )}
        {!target && !isRunning && (
          <p className="text-[11px] text-muted-foreground text-center">Select a target VM first</p>
        )}
      </div>
    </div>
  );
}