import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Square, RotateCcw, Wifi, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SandboxTargetSelector from '@/components/sandbox/SandboxTargetSelector';
import SandboxAttackPanel from '@/components/sandbox/SandboxAttackPanel';
import SandboxTerminal from '@/components/sandbox/SandboxTerminal';
import SandboxMetrics from '@/components/sandbox/SandboxMetrics';
import { base44 } from '@/api/base44Client';

const INITIAL_METRICS = { blocked: 0, detected: 0, connections: 0, alerts: [] };

export default function Sandbox({ roomContext }) {
  const [target, setTarget] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [currentAttack, setCurrentAttack] = useState(null);
  const [isLoadingAttack, setIsLoadingAttack] = useState(false);
  const intervalRef = useRef(null);

  const appendLog = (entries) => {
    setLogs(prev => [...prev, ...entries].slice(-200));
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setLogs([]);
    setMetrics(INITIAL_METRICS);
    setCurrentAttack(null);
  };

  const handleLaunchAttack = async (attack) => {
    if (!target) return;
    setCurrentAttack(attack);
    setIsRunning(true);
    setIsLoadingAttack(true);

    appendLog([{
      time: new Date().toISOString(),
      type: 'info',
      source: 'SANDBOX',
      message: `Launching ${attack.name} against ${target.ip} (${target.name})...`,
    }]);

    const prompt = `You are a cybersecurity simulation engine. 
Simulate a realistic "${attack.name}" attack (category: ${attack.category}) against a virtual machine at IP ${target.ip} running ${target.os} with services: ${target.services.join(', ')}.

Generate a realistic sequence of 12-16 terminal/log lines showing:
1. Attacker-side commands and output (prefixed with "ATTACKER")
2. Defensive firewall/IDS/SIEM log entries being triggered (prefixed with "FIREWALL", "IDS", or "SIEM")
3. Some attacks partially succeed, some get blocked — be realistic

Also return metrics:
- blocked_count: how many attack attempts were blocked
- detected_count: how many were detected/alerted
- connections_attempted: total connection attempts
- alert_level: "low" | "medium" | "high" | "critical"

Return JSON:
{
  "lines": [
    { "type": "attacker"|"firewall"|"ids"|"siem"|"system", "message": "..." }
  ],
  "metrics": {
    "blocked_count": number,
    "detected_count": number,
    "connections_attempted": number,
    "alert_level": "low"|"medium"|"high"|"critical"
  }
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          lines: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, message: { type: 'string' } } } },
          metrics: { type: 'object', properties: { blocked_count: { type: 'number' }, detected_count: { type: 'number' }, connections_attempted: { type: 'number' }, alert_level: { type: 'string' } } }
        }
      }
    });

    setIsLoadingAttack(false);

    const now = new Date();
    const newLogs = (result.lines || []).map((l, i) => ({
      time: new Date(now.getTime() + i * 400).toISOString(),
      type: l.type,
      source: l.type?.toUpperCase() || 'SYSTEM',
      message: l.message,
    }));

    // Stream logs one by one for realism
    newLogs.forEach((log, i) => {
      setTimeout(() => {
        appendLog([log]);
        if (i === newLogs.length - 1) {
          const m = result.metrics || {};
          setMetrics(prev => ({
            blocked: prev.blocked + (m.blocked_count || 0),
            detected: prev.detected + (m.detected_count || 0),
            connections: prev.connections + (m.connections_attempted || 0),
            alerts: [...prev.alerts, { attack: attack.name, level: m.alert_level || 'medium', time: new Date().toISOString() }].slice(-20),
          }));
          setIsRunning(false);
        }
      }, i * 350);
    });
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {!roomContext && (
        <Link to="/Dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Network Attack Sandbox
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simulate real attacks against virtual machines and monitor defensive responses in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${isRunning ? 'bg-destructive/10 border-destructive/30 text-destructive animate-pulse' : 'bg-secondary border-border text-muted-foreground'}`}>
            <Wifi className="w-3 h-3" />
            {isRunning ? 'ATTACK RUNNING' : 'IDLE'}
          </div>
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Target + Attack selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SandboxTargetSelector target={target} onSelect={setTarget} />
        <SandboxAttackPanel
          target={target}
          isRunning={isRunning || isLoadingAttack}
          currentAttack={currentAttack}
          onLaunch={handleLaunchAttack}
        />
      </div>

      {/* Metrics */}
      <SandboxMetrics metrics={metrics} />

      {/* Split view: terminal + chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SandboxTerminal logs={logs} isLoading={isLoadingAttack} />
        <SandboxAlertChart metrics={metrics} />
      </div>
    </div>
  );
}

// Inline mini alert chart component
function SandboxAlertChart({ metrics }) {
  const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } = require('recharts');
  const data = [
    { name: 'Blocked', value: metrics.blocked, color: '#22c55e' },
    { name: 'Detected', value: metrics.detected, color: '#f59e0b' },
    { name: 'Connections', value: metrics.connections, color: '#60a5fa' },
  ];

  const recentAlerts = metrics.alerts.slice(-8).reverse();

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-foreground">Defense Overview</span>
      </div>
      <div className="p-4 flex-1 space-y-4">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={40}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 44% 9%)', border: '1px solid hsl(222 30% 18%)', borderRadius: 8 }}
                labelStyle={{ color: '#f1f5f9' }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Recent Alerts</p>
          {recentAlerts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No alerts yet — launch an attack to begin</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {recentAlerts.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-secondary/50 rounded-lg px-3 py-1.5">
                  <span className="text-foreground">{a.attack}</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                    a.level === 'critical' ? 'bg-destructive/20 text-destructive' :
                    a.level === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    a.level === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-primary/20 text-primary'
                  }`}>{a.level.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}