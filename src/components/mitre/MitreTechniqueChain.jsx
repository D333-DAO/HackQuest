import React, { useState, useMemo } from 'react';
import { Plus, X, GripVertical, Search, ChevronDown, ChevronUp, ArrowDown } from 'lucide-react';

// Curated MITRE ATT&CK technique library
export const MITRE_TECHNIQUES = [
  // Reconnaissance
  { id: 'T1595', name: 'Active Scanning', tactic: 'Reconnaissance', subtechniques: ['T1595.001 Scanning IP Blocks', 'T1595.002 Vulnerability Scanning'] },
  { id: 'T1592', name: 'Gather Victim Host Info', tactic: 'Reconnaissance', subtechniques: [] },
  { id: 'T1589', name: 'Gather Victim Identity Info', tactic: 'Reconnaissance', subtechniques: [] },
  // Initial Access
  { id: 'T1190', name: 'Exploit Public-Facing App', tactic: 'Initial Access', subtechniques: [] },
  { id: 'T1133', name: 'External Remote Services', tactic: 'Initial Access', subtechniques: [] },
  { id: 'T1566', name: 'Phishing', tactic: 'Initial Access', subtechniques: ['T1566.001 Spearphishing Attachment', 'T1566.002 Spearphishing Link'] },
  { id: 'T1078', name: 'Valid Accounts', tactic: 'Initial Access', subtechniques: [] },
  { id: 'T1091', name: 'Replication Through Removable Media', tactic: 'Initial Access', subtechniques: [] },
  // Execution
  { id: 'T1059', name: 'Command & Scripting Interpreter', tactic: 'Execution', subtechniques: ['T1059.001 PowerShell', 'T1059.003 Windows Command Shell', 'T1059.004 Unix Shell'] },
  { id: 'T1204', name: 'User Execution', tactic: 'Execution', subtechniques: [] },
  { id: 'T1106', name: 'Native API', tactic: 'Execution', subtechniques: [] },
  { id: 'T1053', name: 'Scheduled Task/Job', tactic: 'Execution', subtechniques: [] },
  // Persistence
  { id: 'T1547', name: 'Boot/Logon Autostart', tactic: 'Persistence', subtechniques: ['T1547.001 Registry Run Keys', 'T1547.004 Winlogon Helper'] },
  { id: 'T1136', name: 'Create Account', tactic: 'Persistence', subtechniques: [] },
  { id: 'T1543', name: 'Create/Modify System Process', tactic: 'Persistence', subtechniques: [] },
  { id: 'T1505', name: 'Server Software Component', tactic: 'Persistence', subtechniques: ['T1505.003 Web Shell'] },
  // Privilege Escalation
  { id: 'T1068', name: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation', subtechniques: [] },
  { id: 'T1055', name: 'Process Injection', tactic: 'Privilege Escalation', subtechniques: ['T1055.001 DLL Injection', 'T1055.012 Process Hollowing'] },
  { id: 'T1548', name: 'Abuse Elevation Control Mechanism', tactic: 'Privilege Escalation', subtechniques: ['T1548.002 Bypass UAC'] },
  { id: 'T1134', name: 'Access Token Manipulation', tactic: 'Privilege Escalation', subtechniques: [] },
  // Defense Evasion
  { id: 'T1027', name: 'Obfuscated Files or Information', tactic: 'Defense Evasion', subtechniques: [] },
  { id: 'T1562', name: 'Impair Defenses', tactic: 'Defense Evasion', subtechniques: ['T1562.001 Disable Security Tools'] },
  { id: 'T1070', name: 'Indicator Removal', tactic: 'Defense Evasion', subtechniques: ['T1070.001 Clear Windows Event Logs', 'T1070.002 Clear Linux Logs'] },
  { id: 'T1218', name: 'System Binary Proxy Execution', tactic: 'Defense Evasion', subtechniques: ['T1218.011 Rundll32'] },
  // Credential Access
  { id: 'T1003', name: 'OS Credential Dumping', tactic: 'Credential Access', subtechniques: ['T1003.001 LSASS Memory', 'T1003.002 Security Account Manager'] },
  { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', subtechniques: ['T1110.001 Password Guessing', 'T1110.003 Password Spraying'] },
  { id: 'T1558', name: 'Steal/Forge Kerberos Tickets', tactic: 'Credential Access', subtechniques: ['T1558.003 Kerberoasting'] },
  { id: 'T1056', name: 'Input Capture', tactic: 'Credential Access', subtechniques: ['T1056.001 Keylogging'] },
  // Discovery
  { id: 'T1082', name: 'System Information Discovery', tactic: 'Discovery', subtechniques: [] },
  { id: 'T1046', name: 'Network Service Discovery', tactic: 'Discovery', subtechniques: [] },
  { id: 'T1083', name: 'File & Directory Discovery', tactic: 'Discovery', subtechniques: [] },
  { id: 'T1087', name: 'Account Discovery', tactic: 'Discovery', subtechniques: [] },
  { id: 'T1018', name: 'Remote System Discovery', tactic: 'Discovery', subtechniques: [] },
  // Lateral Movement
  { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement', subtechniques: ['T1021.001 Remote Desktop Protocol', 'T1021.002 SMB/Windows Admin Shares', 'T1021.004 SSH'] },
  { id: 'T1570', name: 'Lateral Tool Transfer', tactic: 'Lateral Movement', subtechniques: [] },
  { id: 'T1550', name: 'Use Alternate Auth Material', tactic: 'Lateral Movement', subtechniques: ['T1550.002 Pass the Hash'] },
  // Collection
  { id: 'T1005', name: 'Data from Local System', tactic: 'Collection', subtechniques: [] },
  { id: 'T1560', name: 'Archive Collected Data', tactic: 'Collection', subtechniques: [] },
  { id: 'T1114', name: 'Email Collection', tactic: 'Collection', subtechniques: [] },
  // Exfiltration
  { id: 'T1041', name: 'Exfiltration Over C2 Channel', tactic: 'Exfiltration', subtechniques: [] },
  { id: 'T1048', name: 'Exfiltration Over Alternative Protocol', tactic: 'Exfiltration', subtechniques: ['T1048.003 Exfil Over Unencrypted Protocol'] },
  { id: 'T1567', name: 'Exfiltration Over Web Service', tactic: 'Exfiltration', subtechniques: [] },
  // Impact
  { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', subtechniques: [] },
  { id: 'T1490', name: 'Inhibit System Recovery', tactic: 'Impact', subtechniques: [] },
  { id: 'T1498', name: 'Network Denial of Service', tactic: 'Impact', subtechniques: [] },
  { id: 'T1489', name: 'Service Stop', tactic: 'Impact', subtechniques: [] },
];

const TACTIC_ORDER = [
  'Reconnaissance', 'Initial Access', 'Execution', 'Persistence',
  'Privilege Escalation', 'Defense Evasion', 'Credential Access',
  'Discovery', 'Lateral Movement', 'Collection', 'Exfiltration', 'Impact'
];

const TACTIC_COLORS = {
  'Reconnaissance':       'text-sky-400 bg-sky-500/10 border-sky-500/20',
  'Initial Access':       'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'Execution':            'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Persistence':          'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Privilege Escalation': 'text-red-400 bg-red-500/10 border-red-500/20',
  'Defense Evasion':      'text-slate-400 bg-slate-500/10 border-slate-500/20',
  'Credential Access':    'text-pink-400 bg-pink-500/10 border-pink-500/20',
  'Discovery':            'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'Lateral Movement':     'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  'Collection':           'text-lime-400 bg-lime-500/10 border-lime-500/20',
  'Exfiltration':         'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Impact':               'text-destructive bg-destructive/10 border-destructive/20',
};

function TacticBadge({ tactic }) {
  const cls = TACTIC_COLORS[tactic] || 'text-muted-foreground bg-secondary border-border';
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${cls}`}>
      {tactic}
    </span>
  );
}

function TechniquePickerRow({ tech, onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="font-mono text-[10px] text-muted-foreground w-16 shrink-0">{tech.id}</span>
        <span className="text-xs text-foreground flex-1">{tech.name}</span>
        <TacticBadge tactic={tech.tactic} />
        {tech.subtechniques.length > 0 && (
          <button onClick={() => setOpen(v => !v)} className="p-0.5 text-muted-foreground hover:text-foreground">
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
        <button
          onClick={() => onAdd({ ...tech, subtechnique: null })}
          className="p-1 rounded-md bg-primary/15 hover:bg-primary/25 text-primary transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {open && tech.subtechniques.length > 0 && (
        <div className="border-t border-border/50 px-3 pb-2 space-y-1">
          {tech.subtechniques.map(sub => {
            const [subId, ...rest] = sub.split(' ');
            return (
              <div key={subId} className="flex items-center gap-2 pl-4">
                <span className="font-mono text-[9px] text-muted-foreground w-20 shrink-0">{subId}</span>
                <span className="text-[11px] text-muted-foreground flex-1">{rest.join(' ')}</span>
                <button
                  onClick={() => onAdd({ ...tech, id: subId, name: `${tech.name}: ${rest.join(' ')}`, subtechnique: subId })}
                  className="p-1 rounded-md bg-primary/15 hover:bg-primary/25 text-primary transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MitreTechniqueChain({ techniques, onChange }) {
  const [search, setSearch] = useState('');
  const [activeTactic, setActiveTactic] = useState('All');

  const filtered = useMemo(() => {
    return MITRE_TECHNIQUES.filter(t => {
      const matchTactic = activeTactic === 'All' || t.tactic === activeTactic;
      const q = search.toLowerCase();
      const matchSearch = !q || t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.tactic.toLowerCase().includes(q);
      return matchTactic && matchSearch;
    });
  }, [search, activeTactic]);

  const addTechnique = (tech) => {
    onChange([...techniques, { ...tech, _key: Date.now() }]);
  };

  const removeTechnique = (idx) => {
    onChange(techniques.filter((_, i) => i !== idx));
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const arr = [...techniques];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr);
  };

  const moveDown = (idx) => {
    if (idx === techniques.length - 1) return;
    const arr = [...techniques];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">1. Build Technique Chain</span>
        <span className="ml-auto text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {MITRE_TECHNIQUES.length} techniques
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left: picker */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search techniques (e.g. T1059, phishing...)"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-secondary/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Tactic filter */}
          <div className="flex flex-wrap gap-1">
            {['All', ...TACTIC_ORDER].map(t => (
              <button
                key={t}
                onClick={() => setActiveTactic(t)}
                className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                  activeTactic === t
                    ? 'bg-primary/20 border-primary/30 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground bg-secondary/30'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto pr-0.5">
            {filtered.map(t => (
              <TechniquePickerRow key={t.id} tech={t} onAdd={addTechnique} />
            ))}
          </div>
        </div>

        {/* Right: chain */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground font-medium">
            Attack Chain ({techniques.length} technique{techniques.length !== 1 ? 's' : ''})
          </p>

          {techniques.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Plus className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Add techniques from the library to build your attack chain.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {techniques.map((t, i) => (
                <div key={t._key || i}>
                  <div className="flex items-center gap-2 bg-secondary/40 rounded-xl border border-border px-3 py-2.5">
                    <div className="flex flex-col gap-0.5 text-muted-foreground">
                      <button onClick={() => moveUp(i)} className="hover:text-foreground disabled:opacity-30" disabled={i === 0}>
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveDown(i)} className="hover:text-foreground disabled:opacity-30" disabled={i === techniques.length - 1}>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] text-primary">{t.id}</span>
                        <span className="text-xs font-medium text-foreground truncate">{t.name}</span>
                      </div>
                      <TacticBadge tactic={t.tactic} />
                    </div>
                    <button onClick={() => removeTechnique(i)} className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {i < techniques.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <ArrowDown className="w-3 h-3 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}