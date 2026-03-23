import React, { useState } from 'react';
import { Server, Monitor, Database, Cpu, Wifi, Shield } from 'lucide-react';

const TARGET_PRESETS = [
  {
    id: 'web-server',
    name: 'Web Server',
    icon: Server,
    ip: '10.0.1.10',
    os: 'Ubuntu 22.04 LTS',
    services: ['HTTP (80)', 'HTTPS (443)', 'SSH (22)', 'MySQL (3306)'],
    patchLevel: 'Partially patched (6 months behind)',
    firewall: 'UFW enabled (basic rules)',
    edr: 'None',
  },
  {
    id: 'windows-workstation',
    name: 'Windows Workstation',
    icon: Monitor,
    ip: '192.168.1.50',
    os: 'Windows 11 Pro 22H2',
    services: ['RDP (3389)', 'SMB (445)', 'WinRM (5985)'],
    patchLevel: 'Up to date',
    firewall: 'Windows Defender Firewall',
    edr: 'Microsoft Defender for Endpoint',
  },
  {
    id: 'db-server',
    name: 'Database Server',
    icon: Database,
    ip: '10.0.2.5',
    os: 'Windows Server 2019',
    services: ['MSSQL (1433)', 'RDP (3389)', 'SMB (445)'],
    patchLevel: 'Outdated (12+ months)',
    firewall: 'None',
    edr: 'Legacy AV only',
  },
  {
    id: 'dc',
    name: 'Domain Controller',
    icon: Shield,
    ip: '10.0.0.1',
    os: 'Windows Server 2022',
    services: ['LDAP (389)', 'Kerberos (88)', 'DNS (53)', 'SMB (445)', 'RPC (135)'],
    patchLevel: 'Up to date',
    firewall: 'Windows Firewall + GPO rules',
    edr: 'CrowdStrike Falcon',
  },
  {
    id: 'iot',
    name: 'IoT Device',
    icon: Cpu,
    ip: '192.168.10.200',
    os: 'Embedded Linux (BusyBox)',
    services: ['Telnet (23)', 'HTTP (80)', 'MQTT (1883)'],
    patchLevel: 'Never patched (firmware 2021)',
    firewall: 'None',
    edr: 'None',
  },
  {
    id: 'cloud-vm',
    name: 'Cloud VM',
    icon: Wifi,
    ip: '34.120.55.88',
    os: 'Debian 12 (AWS EC2)',
    services: ['SSH (22)', 'HTTPS (443)', 'Docker API (2375)'],
    patchLevel: 'Partially patched',
    firewall: 'AWS Security Group (loose)',
    edr: 'CloudWatch agent only',
  },
];

const PATCH_LEVELS = ['Up to date', 'Partially patched (6 months behind)', 'Outdated (12+ months)', 'Never patched (firmware 2021)'];
const FIREWALL_OPTS = ['None', 'UFW enabled (basic rules)', 'Windows Defender Firewall', 'Windows Firewall + GPO rules', 'AWS Security Group (loose)', 'pfSense', 'Palo Alto NGFW'];
const EDR_OPTS = ['None', 'Legacy AV only', 'Microsoft Defender for Endpoint', 'CrowdStrike Falcon', 'SentinelOne', 'Carbon Black', 'CloudWatch agent only'];

export default function MitreTargetConfig({ target, onChange }) {
  const [custom, setCustom] = useState(false);
  const [form, setForm] = useState({
    name: '', ip: '', os: '', services: '', patchLevel: PATCH_LEVELS[0], firewall: FIREWALL_OPTS[0], edr: EDR_OPTS[0]
  });

  const selectPreset = (preset) => {
    setCustom(false);
    onChange(preset);
  };

  const applyCustom = () => {
    onChange({
      ...form,
      services: form.services.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">2. Target Configuration</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Preset grid */}
        {!custom && (
          <div className="grid grid-cols-2 gap-2">
            {TARGET_PRESETS.map(p => {
              const Icon = p.icon;
              const isSelected = target?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPreset(p)}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary/30 shadow-sm'
                      : 'bg-secondary/20 border-border hover:bg-secondary/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{p.name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">{p.os.split(' ').slice(0, 2).join(' ')}</span>
                  <span className="text-[9px] text-muted-foreground">{p.ip}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected target detail */}
        {target && !custom && (
          <div className="bg-secondary/30 border border-border rounded-xl p-3 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">{target.name}</span>
              <span className="font-mono text-muted-foreground text-[10px]">{target.ip}</span>
            </div>
            <div className="space-y-1">
              <Row label="OS" value={target.os} />
              <Row label="Services" value={target.services.join(', ')} />
              <Row label="Patch Level" value={target.patchLevel} highlight={target.patchLevel !== 'Up to date'} />
              <Row label="Firewall" value={target.firewall} />
              <Row label="EDR" value={target.edr} highlight={target.edr === 'None'} />
            </div>
          </div>
        )}

        <button
          onClick={() => setCustom(v => !v)}
          className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          {custom ? '← Back to presets' : '+ Configure custom target'}
        </button>

        {/* Custom form */}
        {custom && (
          <div className="space-y-2">
            {[['Name', 'name', 'e.g. Internal API Server'], ['IP', 'ip', '10.0.3.4'], ['OS', 'os', 'Ubuntu 20.04'], ['Services (comma-separated)', 'services', 'HTTP (80), SSH (22)']].map(([label, key, ph]) => (
              <div key={key}>
                <label className="text-[10px] text-muted-foreground mb-1 block">{label}</label>
                <input
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={ph}
                  className="w-full px-3 py-1.5 text-xs bg-secondary/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            ))}
            {[['Patch Level', 'patchLevel', PATCH_LEVELS], ['Firewall', 'firewall', FIREWALL_OPTS], ['EDR', 'edr', EDR_OPTS]].map(([label, key, opts]) => (
              <div key={key}>
                <label className="text-[10px] text-muted-foreground mb-1 block">{label}</label>
                <select
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs bg-secondary/40 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <button
              onClick={applyCustom}
              disabled={!form.name || !form.ip || !form.os}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 disabled:opacity-40 transition-colors"
            >
              Apply Custom Target
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground w-20 shrink-0 text-[10px]">{label}</span>
      <span className={`text-[10px] ${highlight ? 'text-amber-400 font-semibold' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}