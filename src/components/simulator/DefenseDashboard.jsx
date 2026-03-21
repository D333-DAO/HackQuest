import React, { useState } from 'react';
import { Shield, ShieldOff, Ban, RefreshCw, Wifi, Lock, Trash2, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACTIONS = [
  {
    id: 'isolate',
    label: 'Isolate Node',
    description: 'Sever all network connections to the targeted node immediately.',
    icon: ShieldOff,
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20',
    activeBg: 'bg-destructive/20 border-destructive/50',
    effectiveness: { critical: 60, high: 75, medium: 90 },
    logMessage: (node) => `NODE ISOLATION triggered — ${node.name} (${node.ip}) disconnected from all network segments.`,
    damage: -25,
  },
  {
    id: 'block_ip',
    label: 'Block IP Range',
    description: 'Add firewall rules to drop all traffic from the attacker\'s subnet.',
    icon: Ban,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-400/30 hover:bg-orange-500/20',
    activeBg: 'bg-orange-500/20 border-orange-400/50',
    effectiveness: { critical: 50, high: 70, medium: 85 },
    logMessage: () => `FIREWALL RULE APPLIED — Blocking 192.168.1.0/24. All inbound/outbound traffic to attacker subnet dropped.`,
    damage: -15,
  },
  {
    id: 'flush_cache',
    label: 'Flush Cache',
    description: 'Clear DNS & ARP cache to disrupt poisoning / hijack attempts.',
    icon: RefreshCw,
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/30 hover:bg-accent/20',
    activeBg: 'bg-accent/20 border-accent/50',
    effectiveness: { critical: 30, high: 55, medium: 80 },
    logMessage: (node) => `CACHE FLUSHED — DNS resolver cache and ARP table cleared on ${node.name}. Poisoned entries removed.`,
    damage: -10,
  },
  {
    id: 'kill_sessions',
    label: 'Kill Sessions',
    description: 'Terminate all active TCP sessions and force re-authentication.',
    icon: Wifi,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-400/30 hover:bg-purple-500/20',
    activeBg: 'bg-purple-500/20 border-purple-400/50',
    effectiveness: { critical: 45, high: 65, medium: 80 },
    logMessage: (node) => `SESSIONS TERMINATED — All active connections on ${node.name} forcibly closed. ${Math.floor(Math.random()*8)+2} sessions killed.`,
    damage: -20,
  },
  {
    id: 'enable_2fa',
    label: 'Force Re-Auth',
    description: 'Lock accounts and require 2FA re-authentication across all services.',
    icon: Lock,
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/30 hover:bg-primary/20',
    activeBg: 'bg-primary/20 border-primary/50',
    effectiveness: { critical: 40, high: 70, medium: 90 },
    logMessage: () => `AUTH LOCKDOWN — All service accounts locked. 2FA challenge enforced. Attacker sessions invalidated.`,
    damage: -18,
  },
  {
    id: 'patch_vuln',
    label: 'Patch Vulnerability',
    description: 'Apply hotfix to close the exploited vector in real-time.',
    icon: Shield,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-400/30 hover:bg-emerald-500/20',
    activeBg: 'bg-emerald-500/20 border-emerald-400/50',
    effectiveness: { critical: 55, high: 80, medium: 95 },
    logMessage: (node, scenario) => `HOTFIX DEPLOYED — Patching ${scenario?.name || 'attack'} vector on ${node.name}. Service restarted with mitigated configuration.`,
    damage: -30,
  },
];

export default function DefenseDashboard({ isActive, node, scenario, onAction }) {
  const [applied, setApplied] = useState({});  // actionId -> 'loading' | 'done'
  const [damageReduced, setDamageReduced] = useState(0);

  const handleAction = async (action) => {
    if (applied[action.id]) return;
    setApplied(prev => ({ ...prev, [action.id]: 'loading' }));

    await new Promise(r => setTimeout(r, 1200));

    const eff = action.effectiveness[scenario?.severity || 'medium'];
    const logEntry = {
      time: new Date().toISOString(),
      type: 'firewall',
      source: 'DEFENSE',
      message: action.logMessage(node, scenario),
    };

    setDamageReduced(prev => prev + Math.abs(action.damage));
    setApplied(prev => ({ ...prev, [action.id]: 'done' }));
    onAction?.(logEntry, action, eff);
  };

  if (!isActive) return null;

  const totalReduction = Math.min(damageReduced, 100);

  return (
    <div className="bg-card border-2 border-destructive/40 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-destructive/10 border-b border-destructive/20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive animate-ping" />
          <Shield className="w-4 h-4 text-destructive" />
          <span className="text-sm font-bold text-foreground">Defense Dashboard</span>
          <span className="text-xs text-muted-foreground">— Active attack detected on <span className="text-foreground font-medium">{node?.name}</span></span>
        </div>
        {totalReduction > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {totalReduction}% damage mitigated
          </div>
        )}
      </div>

      {/* Threat context */}
      <div className="px-5 py-3 bg-secondary/30 border-b border-border flex items-center gap-3 flex-wrap">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-xs text-muted-foreground">
          Attack: <span className="font-semibold text-amber-400">{scenario?.name}</span>
          {scenario?.severity && (
            <span className={`ml-2 font-bold px-2 py-0.5 rounded-full text-[10px] ${
              scenario.severity === 'critical' ? 'bg-destructive/20 text-destructive' :
              scenario.severity === 'high'     ? 'bg-orange-500/20 text-orange-400' :
                                                 'bg-amber-500/20 text-amber-400'
            }`}>{scenario.severity.toUpperCase()}</span>
          )}
          <span className="ml-3">Target: <span className="text-foreground font-medium">{node?.ip}</span></span>
        </span>
        <span className="ml-auto text-xs text-muted-foreground">Apply actions below to mitigate damage in real-time</span>
      </div>

      {/* Actions grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ACTIONS.map(action => {
          const state = applied[action.id];
          const eff = action.effectiveness[scenario?.severity || 'medium'];
          const Icon = action.icon;

          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={!!state}
              className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 text-center
                ${state === 'done' ? 'bg-primary/10 border-primary/30 cursor-default' :
                  state === 'loading' ? 'opacity-70 cursor-wait ' + action.activeBg :
                  action.bg}
                ${!state ? 'cursor-pointer' : ''}
              `}
            >
              {state === 'loading' ? (
                <Loader2 className={`w-5 h-5 ${action.color} animate-spin`} />
              ) : state === 'done' ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Icon className={`w-5 h-5 ${action.color}`} />
              )}

              <span className={`text-[11px] font-semibold leading-tight ${state === 'done' ? 'text-primary' : 'text-foreground'}`}>
                {state === 'done' ? 'Applied ✓' : action.label}
              </span>

              {!state && (
                <span className="text-[10px] text-muted-foreground leading-tight">{action.description}</span>
              )}

              {state === 'done' && (
                <span className="text-[10px] text-primary font-medium">{eff}% effective</span>
              )}

              {/* Effectiveness hint on hover */}
              {!state && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-secondary border border-border rounded-full px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {eff}% eff.
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}