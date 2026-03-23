import React, { useState, useEffect, useRef } from 'react';
import { Zap, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Shield, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Trigger conditions — keyed by attack category / log pattern keywords
export const TRIGGER_CONDITIONS = [
  { id: 'sql_injection',      label: 'SQL Injection detected',         keywords: ['sql', 'injection', 'union select', "' or '", 'sqlmap'] },
  { id: 'brute_force',        label: 'Brute-force / credential spray', keywords: ['brute', 'spray', 'hydra', 'medusa', 'failed login', 'auth failure'] },
  { id: 'port_scan',          label: 'Port scan / reconnaissance',     keywords: ['nmap', 'port scan', 'recon', 'syn scan', 'masscan'] },
  { id: 'xss',                label: 'XSS / web injection',            keywords: ['xss', 'cross-site', '<script>', 'javascript:', 'alert('] },
  { id: 'privilege_esc',      label: 'Privilege escalation attempt',   keywords: ['privesc', 'sudo', 'suid', 'privilege', 'root access'] },
  { id: 'ransomware',         label: 'Ransomware / file encryption',   keywords: ['ransomware', 'encrypt', '.locked', 'ransom', 'cryptolocker'] },
  { id: 'lateral_movement',   label: 'Lateral movement detected',      keywords: ['lateral', 'pivot', 'psexec', 'wmi', 'pass-the-hash'] },
  { id: 'data_exfil',         label: 'Data exfiltration attempt',      keywords: ['exfil', 'upload', 'ftp transfer', 'exfiltrat', 'dns tunnel'] },
  { id: 'ddos',               label: 'DDoS / flood attack',            keywords: ['ddos', 'flood', 'amplification', 'syn flood', 'udp flood'] },
  { id: 'c2_beacon',          label: 'C2 beacon / reverse shell',      keywords: ['beacon', 'c2', 'reverse shell', 'meterpreter', 'callback'] },
];

// Available response actions
export const RESPONSE_ACTIONS = [
  { id: 'block_ip',       label: 'Block offending IP',         icon: '🚫', desc: 'Add firewall rule to drop all traffic from attacker IP.' },
  { id: 'enable_waf',     label: 'Enable WAF',                 icon: '🛡️', desc: 'Activate Web Application Firewall to filter malicious requests.' },
  { id: 'patch_web',      label: 'Patch web server',           icon: '⚙️', desc: 'Apply security patches to the targeted web service.' },
  { id: 'isolate_host',   label: 'Isolate host',               icon: '🔒', desc: 'Network-isolate the affected node to contain the threat.' },
  { id: 'kill_session',   label: 'Kill active sessions',       icon: '❌', desc: 'Terminate all active sessions on the target immediately.' },
  { id: 'rate_limit',     label: 'Rate-limit endpoint',        icon: '🐢', desc: 'Throttle traffic to the targeted service to 5 req/min.' },
  { id: 'alert_siem',     label: 'Send SIEM alert',            icon: '📡', desc: 'Push a high-severity alert to the SIEM dashboard.' },
  { id: 'honeypot',       label: 'Redirect to honeypot',       icon: '🍯', desc: 'Route attacker traffic to a monitored decoy system.' },
  { id: 'backup_data',    label: 'Trigger data backup',        icon: '💾', desc: 'Immediately snapshot and backup critical data stores.' },
  { id: 'lockdown_accts', label: 'Lock down accounts',         icon: '🔐', desc: 'Disable non-essential accounts and enforce MFA.' },
];

const DEFAULT_PLAYBOOKS = [
  {
    id: 'pb_sql',
    name: 'SQL Injection Response',
    trigger: 'sql_injection',
    actions: ['enable_waf', 'block_ip', 'patch_web'],
    enabled: true,
    firedCount: 0,
  },
  {
    id: 'pb_brute',
    name: 'Brute-Force Lockdown',
    trigger: 'brute_force',
    actions: ['block_ip', 'rate_limit', 'lockdown_accts'],
    enabled: true,
    firedCount: 0,
  },
  {
    id: 'pb_ransomware',
    name: 'Ransomware Containment',
    trigger: 'ransomware',
    actions: ['isolate_host', 'backup_data', 'alert_siem'],
    enabled: false,
    firedCount: 0,
  },
];

function ActionBadge({ actionId, onRemove }) {
  const action = RESPONSE_ACTIONS.find(a => a.id === actionId);
  if (!action) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full">
      {action.icon} {action.label}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:text-destructive transition-colors">×</button>
      )}
    </span>
  );
}

function PlaybookRow({ playbook, onToggle, onDelete, firedLog }) {
  const trigger = TRIGGER_CONDITIONS.find(t => t.id === playbook.trigger);
  const recentFire = firedLog.find(f => f.playbookId === playbook.id);

  return (
    <div className={`rounded-xl border px-3 py-3 transition-all duration-200 ${
      playbook.enabled
        ? 'border-primary/25 bg-primary/5'
        : 'border-border bg-secondary/20 opacity-60'
    }`}>
      <div className="flex items-start gap-3">
        {/* Toggle */}
        <button
          onClick={() => onToggle(playbook.id)}
          className={`mt-0.5 flex-shrink-0 transition-colors ${playbook.enabled ? 'text-primary' : 'text-muted-foreground'}`}
          title={playbook.enabled ? 'Disable playbook' : 'Enable playbook'}
        >
          {playbook.enabled
            ? <ToggleRight className="w-5 h-5" />
            : <ToggleLeft className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{playbook.name}</span>
            {playbook.firedCount > 0 && (
              <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                FIRED ×{playbook.firedCount}
              </span>
            )}
            {recentFire && (
              <span className="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full animate-pulse">
                ✓ JUST TRIGGERED
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="font-medium text-amber-400">IF</span>
            <span className="italic">{trigger?.label || playbook.trigger}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-primary flex items-center gap-1">
              <Zap className="w-3 h-3" /> THEN
            </span>
            {playbook.actions.map(a => <ActionBadge key={a} actionId={a} />)}
          </div>
        </div>

        <button
          onClick={() => onDelete(playbook.id)}
          className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors mt-0.5"
          title="Delete playbook"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function NewPlaybookForm({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [selectedActions, setSelectedActions] = useState([]);

  const toggleAction = (id) => {
    setSelectedActions(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const canSave = name.trim() && trigger && selectedActions.length > 0;

  return (
    <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-foreground">New Playbook</p>

      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Playbook name…"
        className="w-full text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />

      {/* Trigger */}
      <div>
        <p className="text-[10px] font-semibold text-amber-400 mb-1.5 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> IF — trigger condition
        </p>
        <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
          {TRIGGER_CONDITIONS.map(t => (
            <button
              key={t.id}
              onClick={() => setTrigger(t.id)}
              className={`text-left text-xs px-3 py-1.5 rounded-lg border transition-all ${
                trigger === t.id
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-secondary/20 border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div>
        <p className="text-[10px] font-semibold text-primary mb-1.5 flex items-center gap-1">
          <Zap className="w-3 h-3" /> THEN — response actions (pick one or more)
        </p>
        <div className="grid grid-cols-2 gap-1">
          {RESPONSE_ACTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => toggleAction(a.id)}
              title={a.desc}
              className={`text-left text-xs px-2 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                selectedActions.includes(a.id)
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'bg-secondary/20 border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              }`}
            >
              <span>{a.icon}</span>
              <span className="leading-tight truncate">{a.label}</span>
              {selectedActions.includes(a.id) && <CheckCircle2 className="w-3 h-3 ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" disabled={!canSave} onClick={() => onSave({ name: name.trim(), trigger, actions: selectedActions })} className="flex-1 gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Save Playbook
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function AutomatedResponse({ logs, isRunning, onPlaybookFired }) {
  const [playbooks, setPlaybooks] = useState(DEFAULT_PLAYBOOKS);
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState(true);
  const [firedLog, setFiredLog] = useState([]);

  // Check incoming logs against enabled playbooks
  const lastCheckedRef = useRef(0);
  useEffect(() => {
    if (!isRunning || logs.length === 0) return;
    const newLogs = logs.slice(lastCheckedRef.current);
    lastCheckedRef.current = logs.length;
    if (newLogs.length === 0) return;

    const combinedText = newLogs.map(l => l.message?.toLowerCase() || '').join(' ');

    setPlaybooks(prev => {
      let didFire = false;
      const updated = prev.map(pb => {
        if (!pb.enabled) return pb;
        const trigger = TRIGGER_CONDITIONS.find(t => t.id === pb.trigger);
        if (!trigger) return pb;
        const matched = trigger.keywords.some(kw => combinedText.includes(kw));
        if (matched) {
          didFire = true;
          const entry = { playbookId: pb.id, at: Date.now() };
          setFiredLog(fl => [...fl.slice(-19), entry]);

          // Notify parent
          if (onPlaybookFired) {
            onPlaybookFired(pb);
          }

          // Auto-clear "JUST TRIGGERED" badge after 4s
          setTimeout(() => {
            setFiredLog(fl => fl.filter(f => f !== entry));
          }, 4000);

          return { ...pb, firedCount: pb.firedCount + 1 };
        }
        return pb;
      });
      return updated;
    });
  }, [logs, isRunning]);

  const togglePlaybook = (id) => {
    setPlaybooks(prev => prev.map(pb => pb.id === id ? { ...pb, enabled: !pb.enabled } : pb));
  };

  const deletePlaybook = (id) => {
    setPlaybooks(prev => prev.filter(pb => pb.id !== id));
  };

  const savePlaybook = ({ name, trigger, actions }) => {
    const newPb = {
      id: `pb_${Date.now()}`,
      name,
      trigger,
      actions,
      enabled: true,
      firedCount: 0,
    };
    setPlaybooks(prev => [...prev, newPb]);
    setShowForm(false);
  };

  const enabledCount = playbooks.filter(p => p.enabled).length;
  const totalFired = playbooks.reduce((sum, p) => sum + p.firedCount, 0);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-500/15">
          <Zap className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Automated Response</p>
          <p className="text-[11px] text-muted-foreground">If-Then playbooks that fire automatically during a simulation</p>
        </div>
        <div className="flex items-center gap-2">
          {enabledCount > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isRunning
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 animate-pulse'
                : 'bg-secondary text-muted-foreground border-border'
            }`}>
              {enabledCount} active
            </span>
          )}
          {totalFired > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {totalFired} fired
            </span>
          )}
          <button onClick={() => setOpen(v => !v)} className="p-1 rounded hover:bg-white/10 text-muted-foreground">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="p-4 space-y-3">
          {/* Status banner when running */}
          {isRunning && enabledCount > 0 && (
            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/25 rounded-xl px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
              <p className="text-xs text-purple-300 font-medium">
                Playbooks are live — monitoring logs for trigger conditions…
              </p>
            </div>
          )}

          {/* Playbook list */}
          <div className="space-y-2">
            {playbooks.map(pb => (
              <PlaybookRow
                key={pb.id}
                playbook={pb}
                onToggle={togglePlaybook}
                onDelete={deletePlaybook}
                firedLog={firedLog}
              />
            ))}
            {playbooks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4 italic">No playbooks yet — add one below.</p>
            )}
          </div>

          {/* New playbook form / button */}
          {showForm ? (
            <NewPlaybookForm onSave={savePlaybook} onCancel={() => setShowForm(false)} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
              className="w-full gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-3.5 h-3.5" /> Add Playbook
            </Button>
          )}
        </div>
      )}
    </div>
  );
}