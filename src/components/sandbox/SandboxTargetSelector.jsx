import React from 'react';
import { Monitor, Server, Globe, Cpu } from 'lucide-react';

const TARGETS = [
  { id: 'web-server', name: 'Web Server', ip: '10.0.1.10', os: 'Ubuntu 22.04', services: ['HTTP:80', 'HTTPS:443', 'SSH:22'], icon: Globe, color: 'text-blue-400' },
  { id: 'db-server', name: 'Database Server', ip: '10.0.1.20', os: 'CentOS 8', services: ['MySQL:3306', 'SSH:22', 'FTP:21'], icon: Server, color: 'text-purple-400' },
  { id: 'windows-workstation', name: 'Windows Workstation', ip: '10.0.1.30', os: 'Windows 10', services: ['SMB:445', 'RDP:3389', 'HTTP:8080'], icon: Monitor, color: 'text-cyan-400' },
  { id: 'iot-device', name: 'IoT Device', ip: '10.0.1.40', os: 'Embedded Linux', services: ['Telnet:23', 'HTTP:80', 'MQTT:1883'], icon: Cpu, color: 'text-amber-400' },
];

export default function SandboxTargetSelector({ target, onSelect }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">1. Select Target VM</h3>
      <div className="grid grid-cols-2 gap-2">
        {TARGETS.map(t => {
          const Icon = t.icon;
          const isSelected = target?.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-secondary/30 border-border hover:border-primary/20 hover:bg-secondary/60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : t.color}`} />
                <span className="text-xs font-semibold text-foreground">{t.name}</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">{t.ip}</p>
              <p className="text-[10px] text-muted-foreground">{t.os}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {t.services.map(s => (
                  <span key={s} className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-mono">{s}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}