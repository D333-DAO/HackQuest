import React, { useState } from 'react';
import { Shield, ShieldOff, Plus, X, CheckCircle2, Zap, Lock, RefreshCw, ChevronDown, ChevronUp, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QUICK_PATCHES = [
  { id: 'waf',       label: 'Enable WAF',              icon: '🛡️', desc: 'Block malicious HTTP patterns at the edge.' },
  { id: 'mfa',       label: 'Enforce MFA',             icon: '🔐', desc: 'Require multi-factor auth on all accounts.' },
  { id: 'fail2ban',  label: 'Activate Fail2Ban',       icon: '🚫', desc: 'Auto-ban IPs after repeated auth failures.' },
  { id: 'ids-sig',   label: 'Update IDS Signatures',   icon: '📡', desc: 'Pull latest threat signatures into IDS.' },
  { id: 'smb-off',   label: 'Disable SMBv1',           icon: '🔌', desc: 'Remove the legacy SMBv1 attack surface.' },
  { id: 'patch-os',  label: 'Apply OS Patches',        icon: '⚙️', desc: 'Install pending kernel & service patches.' },
  { id: 'segment',   label: 'Network Segmentation',    icon: '🧱', desc: 'Isolate the target into a restricted VLAN.' },
  { id: 'honeypot',  label: 'Deploy Honeypot',         icon: '🍯', desc: 'Redirect attacker into a monitored decoy.' },
];

const PRESET_RULES = [
  'Block all inbound on port 22',
  'Block all inbound on port 445',
  'Rate-limit /login to 5 req/min',
  'Drop packets from 192.168.x.x',
  'Block outbound on ports 4444-4445',
  'Deny all egress DNS to external resolvers',
];

export default function InteractiveDefense({ isPaused, onPause, onResume, appliedDefenses, onApply }) {
  const [customRule, setCustomRule] = useState('');
  const [showRuleInput, setShowRuleInput] = useState(false);
  const [open, setOpen] = useState(true);

  const applyPatch = (patch) => {
    if (appliedDefenses.patches.includes(patch.id)) return;
    onApply({ type: 'patch', value: patch });
  };

  const addRule = (rule) => {
    if (!rule.trim() || appliedDefenses.rules.some(r => r === rule.trim())) return;
    onApply({ type: 'rule', value: rule.trim() });
    setCustomRule('');
    setShowRuleInput(false);
  };

  const removeRule = (rule) => onApply({ type: 'remove_rule', value: rule });

  const patchCount = appliedDefenses.patches.length;
  const ruleCount  = appliedDefenses.rules.length;
  const totalChanges = patchCount + ruleCount;

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      isPaused
        ? 'border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/10'
        : 'border-border bg-card'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isPaused ? 'bg-amber-500/20' : 'bg-primary/10'}`}>
          <Shield className={`w-4 h-4 ${isPaused ? 'text-amber-400' : 'text-primary'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Interactive Defense</p>
          <p className="text-[11px] text-muted-foreground">
            {isPaused ? 'Simulation paused — apply defenses then resume' : 'Pause mid-attack to configure real-time defenses'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalChanges > 0 && (
            <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              {totalChanges} active
            </span>
          )}
          <button onClick={() => setOpen(v => !v)} className="p-1 rounded hover:bg-white/10 text-muted-foreground">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          {/* Pause / Resume controls */}
          <div className="flex items-center gap-3">
            {!isPaused ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="gap-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 flex-1"
              >
                <ShieldOff className="w-4 h-4" />
                Pause & Defend
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onResume}
                disabled={totalChanges === 0}
                className="gap-2 bg-primary text-primary-foreground flex-1"
              >
                <RefreshCw className="w-4 h-4" />
                Resume Simulation {totalChanges > 0 ? `(${totalChanges} changes)` : ''}
              </Button>
            )}
            {isPaused && (
              <Button variant="outline" size="sm" onClick={onResume} className="gap-1.5 text-muted-foreground">
                Skip
              </Button>
            )}
          </div>

          {isPaused && (
            <>
              {/* Quick security patches */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" /> Security Patches
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_PATCHES.map(patch => {
                    const applied = appliedDefenses.patches.includes(patch.id);
                    return (
                      <button
                        key={patch.id}
                        onClick={() => applyPatch(patch)}
                        title={patch.desc}
                        className={`text-left px-3 py-2 rounded-lg border text-xs transition-all flex items-center gap-2 ${
                          applied
                            ? 'bg-primary/15 border-primary/30 text-primary'
                            : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
                        }`}
                      >
                        <span>{patch.icon}</span>
                        <span className="font-medium leading-tight">{patch.label}</span>
                        {applied && <CheckCircle2 className="w-3 h-3 ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Firewall rules */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" /> Firewall Rules
                </p>

                {/* Applied rules */}
                {appliedDefenses.rules.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {appliedDefenses.rules.map((rule, i) => (
                      <div key={i} className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 text-xs">
                        <Lock className="w-3 h-3 text-primary flex-shrink-0" />
                        <span className="text-primary flex-1 font-mono">{rule}</span>
                        <button onClick={() => removeRule(rule)} className="text-muted-foreground hover:text-destructive ml-auto">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Preset rules */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_RULES.filter(r => !appliedDefenses.rules.includes(r)).map((rule, i) => (
                    <button
                      key={i}
                      onClick={() => addRule(rule)}
                      className="text-[10px] font-mono bg-secondary/40 border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 px-2 py-1 rounded-md transition-colors"
                    >
                      + {rule}
                    </button>
                  ))}
                </div>

                {/* Custom rule input */}
                {showRuleInput ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={customRule}
                      onChange={e => setCustomRule(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addRule(customRule); if (e.key === 'Escape') setShowRuleInput(false); }}
                      placeholder="e.g. Block TCP from 10.0.0.5"
                      className="flex-1 text-xs font-mono bg-secondary/40 border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <Button size="sm" variant="outline" onClick={() => addRule(customRule)} className="px-3">Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowRuleInput(false)} className="px-3">Cancel</Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRuleInput(true)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add custom rule
                  </button>
                )}
              </div>
            </>
          )}

          {/* Applied defenses summary (always visible when any exist) */}
          {!isPaused && totalChanges > 0 && (
            <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-primary mb-1.5">Active Defenses Applied</p>
              {appliedDefenses.patches.map(id => {
                const p = QUICK_PATCHES.find(q => q.id === id);
                return p ? (
                  <div key={id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    {p.icon} {p.label}
                  </div>
                ) : null;
              })}
              {appliedDefenses.rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <Lock className="w-3 h-3 text-primary" />
                  {rule}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}