import React, { useState } from 'react';
import { Play, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ATTACKS = [
  { id: 'port-scan', name: 'Port Scan (Nmap)', category: 'Reconnaissance', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { id: 'brute-force-ssh', name: 'SSH Brute Force', category: 'Credential Attack', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  { id: 'syn-flood', name: 'SYN Flood DDoS', category: 'DoS/DDoS', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  { id: 'sql-injection', name: 'SQL Injection', category: 'Web Exploit', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  { id: 'xss', name: 'Stored XSS Attack', category: 'Web Exploit', color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20' },
  { id: 'smb-exploit', name: 'EternalBlue (SMB)', category: 'Network Exploit', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  { id: 'arp-spoof', name: 'ARP Spoofing MITM', category: 'Network Attack', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20' },
  { id: 'lfi', name: 'Local File Inclusion', category: 'Web Exploit', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  { id: 'reverse-shell', name: 'Reverse Shell Payload', category: 'Post-Exploitation', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
];

export default function SandboxAttackPanel({ target, isRunning, currentAttack, onLaunch }) {
  const [selected, setSelected] = useState(null);

  const handleLaunch = () => {
    if (selected && !isRunning) onLaunch(selected);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">2. Choose Attack Vector</h3>
      <div className="grid grid-cols-1 gap-1.5 overflow-y-auto max-h-64">
        {ATTACKS.map(a => (
          <button
            key={a.id}
            onClick={() => setSelected(a)}
            disabled={isRunning}
            className={`text-left px-3 py-2 rounded-lg border text-xs transition-all duration-150 flex items-center justify-between ${
              selected?.id === a.id
                ? `${a.bg} border-opacity-60`
                : 'bg-secondary/20 border-border hover:bg-secondary/50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div>
              <span className={`font-semibold ${selected?.id === a.id ? a.color : 'text-foreground'}`}>{a.name}</span>
              <span className="text-muted-foreground ml-2 text-[10px]">{a.category}</span>
            </div>
            {selected?.id === a.id && <Zap className={`w-3 h-3 ${a.color}`} />}
          </button>
        ))}
      </div>
      <Button
        className="w-full gap-2"
        disabled={!selected || !target || isRunning}
        onClick={handleLaunch}
      >
        {isRunning ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Simulating Attack...</>
        ) : (
          <><Play className="w-4 h-4" /> Launch Attack</>
        )}
      </Button>
      {!target && <p className="text-[11px] text-muted-foreground text-center">Select a target VM first</p>}
    </div>
  );
}