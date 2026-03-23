import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Wifi, Shield, AlertTriangle, Terminal, Brain, TerminalSquare, Save, History, Layers } from 'lucide-react';
import InteractiveDefense from '@/components/sandbox/InteractiveDefense';
import AttackChain from '@/components/sandbox/AttackChain';
import AutomatedResponse from '@/components/sandbox/AutomatedResponse';
import AttackerCLI from '@/components/sandbox/AttackerCLI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import SandboxTopology from '@/components/sandbox/SandboxTopology';
import ScenarioLibrary from '@/components/sandbox/ScenarioLibrary';
import SandboxTerminal from '@/components/sandbox/SandboxTerminal';
import SandboxMetrics from '@/components/sandbox/SandboxMetrics';
import SandboxAnalysis from '@/components/sandbox/SandboxAnalysis';
import InteractiveTerminal from '@/components/sandbox/InteractiveTerminal';
import SessionReplay from '@/components/sandbox/SessionReplay';
import SavedSessions from '@/components/sandbox/SavedSessions';
import DownloadReport from '@/components/sandbox/DownloadReport';
import { base44 } from '@/api/base44Client';
import { applyAttackMetrics, setActiveAttack, resetNetwork } from '@/lib/networkStore';
import { ATTACK_SCENARIOS } from '@/lib/attackScenarios';

const INITIAL_METRICS = { blocked: 0, detected: 0, connections: 0, alerts: [] };

export default function Sandbox({ roomContext }) {
  const [target, setTarget] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [currentAttack, setCurrentAttack] = useState(null);
  const [isLoadingAttack, setIsLoadingAttack] = useState(false);
  const [activeTab, setActiveTab] = useState('simulation');
  const [savedSessions, setSavedSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sandbox_sessions') || '[]'); } catch { return []; }
  });
  const [replaySession, setReplaySession] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [appliedDefenses, setAppliedDefenses] = useState({ patches: [], rules: [] });
  const [campaignStageStatuses, setCampaignStageStatuses] = useState([]);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const pendingLogsRef = useRef([]);
  const pendingMetricsRef = useRef(null);
  const intervalRef = useRef(null);

  const persistSessions = (sessions) => {
    setSavedSessions(sessions);
    localStorage.setItem('sandbox_sessions', JSON.stringify(sessions));
  };

  const saveSession = () => {
    if (logs.length === 0) return;
    const session = {
      attack: currentAttack,
      target,
      logs,
      metrics,
      savedAt: new Date().toISOString(),
    };
    persistSessions([session, ...savedSessions].slice(0, 20));
  };

  const deleteSession = (idx) => {
    persistSessions(savedSessions.filter((_, i) => i !== idx));
  };

  const appendLog = (entries) => {
    setLogs(prev => [...prev, ...entries].slice(-200));
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setLogs([]);
    setMetrics(INITIAL_METRICS);
    setCurrentAttack(null);
    setAppliedDefenses({ patches: [], rules: [] });
    setCampaignStageStatuses([]);
    setIsCampaignRunning(false);
    pendingLogsRef.current = [];
    pendingMetricsRef.current = null;
    resetNetwork();
  };

  const runSingleStage = (attack, priorContext) => new Promise((resolve) => {
    const contextNote = priorContext.length > 0
      ? `\n\nPRIOR CAMPAIGN CONTEXT (earlier stages already executed):\n${priorContext.map((s, i) => `Stage ${i + 1}: ${s}`).join('\n')}\nThe attacker has already gained some foothold. Make this stage feel like a natural continuation.`
      : '';

    const prompt = `You are a cybersecurity simulation engine.
Simulate a realistic "${attack.name}" attack (category: ${attack.category}) against ${target.ip} (${target.name}, OS: ${target.os}, services: ${target.services.join(', ')}).${contextNote}

Generate 10-14 log lines (attacker commands + firewall/IDS/SIEM responses). Be realistic — some attempts blocked, some succeed.

Return JSON: { "lines": [{ "type": "attacker"|"firewall"|"ids"|"siem"|"system", "message": "..." }], "metrics": { "blocked_count": number, "detected_count": number, "connections_attempted": number, "alert_level": "low"|"medium"|"high"|"critical" }, "stage_outcome": "success"|"partial"|"blocked", "stage_summary": "one-sentence outcome" }`;

    base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          lines: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, message: { type: 'string' } } } },
          metrics: { type: 'object', properties: { blocked_count: { type: 'number' }, detected_count: { type: 'number' }, connections_attempted: { type: 'number' }, alert_level: { type: 'string' } } },
          stage_outcome: { type: 'string' },
          stage_summary: { type: 'string' },
        }
      }
    }).then(result => {
      const now = new Date();
      const newLogs = (result.lines || []).map((l, i) => ({
        time: new Date(now.getTime() + i * 400).toISOString(),
        type: l.type,
        source: l.type?.toUpperCase() || 'SYSTEM',
        message: l.message,
      }));
      let idx = 0;
      const stream = setInterval(() => {
        if (idx < newLogs.length) {
          appendLog([newLogs[idx]]);
          idx++;
        } else {
          clearInterval(stream);
          const m = result.metrics || {};
          setMetrics(prev => ({
            blocked: prev.blocked + (m.blocked_count || 0),
            detected: prev.detected + (m.detected_count || 0),
            connections: prev.connections + (m.connections_attempted || 0),
            alerts: [...prev.alerts, { attack: attack.name, level: m.alert_level || 'medium', time: new Date().toISOString() }].slice(-20),
          }));
          resolve({ summary: result.stage_summary || '', outcome: result.stage_outcome || 'partial' });
        }
      }, 320);
    });
  });

  const handleRunChain = async (stageIds) => {
    if (!target || isCampaignRunning) return;
    const scenarios = stageIds.map(id => ATTACK_SCENARIOS.find(s => s.id === id)).filter(Boolean);
    setIsCampaignRunning(true);
    setIsRunning(true);
    setCampaignStageStatuses(stageIds.map(() => 'pending'));

    appendLog([{
      time: new Date().toISOString(), type: 'system', source: 'CAMPAIGN',
      message: `▶▶ CAMPAIGN START — ${scenarios.length} stages against ${target.name} (${target.ip})`,
    }]);

    const priorContext = [];

    for (let i = 0; i < scenarios.length; i++) {
      const attack = scenarios[i];
      setCampaignStageStatuses(prev => prev.map((s, idx) => idx === i ? 'running' : s));
      setCurrentAttack(attack);
      setActiveAttack(attack);

      appendLog([{
        time: new Date().toISOString(), type: 'info', source: 'CAMPAIGN',
        message: `── Stage ${i + 1}/${scenarios.length}: ${attack.icon} ${attack.name} ──`,
      }]);

      setIsLoadingAttack(true);
      const { summary, outcome } = await runSingleStage(attack, priorContext);
      setIsLoadingAttack(false);

      priorContext.push(`${attack.name} → ${summary}`);

      appendLog([{
        time: new Date().toISOString(),
        type: outcome === 'blocked' ? 'firewall' : outcome === 'success' ? 'attacker' : 'ids',
        source: 'CAMPAIGN',
        message: `Stage ${i + 1} result [${outcome.toUpperCase()}]: ${summary}`,
      }]);

      setCampaignStageStatuses(prev => prev.map((s, idx) => idx === i ? 'done' : s));

      if (i < scenarios.length - 1) {
        await new Promise(r => setTimeout(r, 800));
      }
    }

    appendLog([{
      time: new Date().toISOString(), type: 'system', source: 'CAMPAIGN',
      message: `■■ CAMPAIGN COMPLETE — all ${scenarios.length} stages executed. Run Analysis for a full kill-chain report.`,
    }]);
    setIsRunning(false);
    setIsCampaignRunning(false);
  };

  const handlePause = () => {
    setIsPaused(true);
    appendLog([{
      time: new Date().toISOString(),
      type: 'system',
      source: 'SANDBOX',
      message: '⏸ Simulation PAUSED — Interactive Defense mode active. Apply patches or firewall rules, then resume.',
    }]);
  };

  const handleApplyDefense = ({ type, value }) => {
    setAppliedDefenses(prev => {
      if (type === 'patch') return { ...prev, patches: [...prev.patches, value.id] };
      if (type === 'rule')  return { ...prev, rules:   [...prev.rules,   value] };
      if (type === 'remove_rule') return { ...prev, rules: prev.rules.filter(r => r !== value) };
      return prev;
    });
  };

  const handleResume = async () => {
    setIsPaused(false);
    const totalChanges = appliedDefenses.patches.length + appliedDefenses.rules.length;

    if (totalChanges === 0) {
      appendLog([{ time: new Date().toISOString(), type: 'system', source: 'SANDBOX', message: '▶ Simulation resumed — no defense changes applied.' }]);
      return;
    }

    appendLog([{ time: new Date().toISOString(), type: 'system', source: 'SANDBOX', message: `▶ Resuming with ${totalChanges} defense change(s) — evaluating mitigation effectiveness...` }]);
    setIsLoadingAttack(true);

    const patchNames = appliedDefenses.patches.join(', ');
    const rulesList  = appliedDefenses.rules.join('; ');
    const prompt = `You are a cybersecurity simulation engine continuing a paused attack simulation.

Attack: "${currentAttack?.name}" against ${target?.ip} (${target?.name}, OS: ${target?.os})

The defender just applied these changes WHILE the attack was in progress:
- Security patches activated: ${patchNames || 'none'}
- New firewall rules added: ${rulesList || 'none'}

Generate 8-10 realistic log lines showing how the attack NOW plays out given these defenses.
Be specific — if WAF was enabled, show WAF blocking SQL payloads. If fail2ban was activated, show IPs being banned.
Show whether the defenses successfully stopped the attack or if the attacker adapted.

Return JSON: { "lines": [{ "type": "attacker"|"firewall"|"ids"|"siem"|"system", "message": "..." }], "metrics": { "blocked_count": number, "detected_count": number, "connections_attempted": number, "alert_level": "low"|"medium"|"high"|"critical" }, "mitigation_outcome": "success"|"partial"|"failed", "outcome_summary": "one sentence explaining the result" }`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          lines: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, message: { type: 'string' } } } },
          metrics: { type: 'object', properties: { blocked_count: { type: 'number' }, detected_count: { type: 'number' }, connections_attempted: { type: 'number' }, alert_level: { type: 'string' } } },
          mitigation_outcome: { type: 'string' },
          outcome_summary: { type: 'string' },
        }
      }
    });

    setIsLoadingAttack(false);

    const outcomeType = result.mitigation_outcome || 'partial';

    appendLog([{
      time: new Date().toISOString(),
      type: outcomeType === 'success' ? 'firewall' : outcomeType === 'partial' ? 'ids' : 'attacker',
      source: 'DEFENSE',
      message: `MITIGATION RESULT [${outcomeType.toUpperCase()}]: ${result.outcome_summary || ''}`,
    }]);

    const now = new Date();
    const newLogs = (result.lines || []).map((l, i) => ({
      time: new Date(now.getTime() + i * 400).toISOString(),
      type: l.type,
      source: l.type?.toUpperCase() || 'SYSTEM',
      message: l.message,
    }));

    newLogs.forEach((log, i) => {
      setTimeout(() => {
        appendLog([log]);
        if (i === newLogs.length - 1) {
          const m = result.metrics || {};
          setMetrics(prev => ({
            blocked: prev.blocked + (m.blocked_count || 0),
            detected: prev.detected + (m.detected_count || 0),
            connections: prev.connections + (m.connections_attempted || 0),
            alerts: [...prev.alerts, { attack: `${currentAttack?.name} [post-defense]`, level: m.alert_level || 'low', time: new Date().toISOString() }].slice(-20),
          }));
          setIsRunning(false);
        }
      }, i * 350);
    });
  };

  const handleLaunchAttack = async (attack) => {
    if (!target) return;
    setCurrentAttack(attack);
    setIsRunning(true);
    setIsLoadingAttack(true);

    setActiveAttack(attack);
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
          applyAttackMetrics(target.id, m, attack.name);
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
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${
            isPaused ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse' :
            isRunning ? 'bg-destructive/10 border-destructive/30 text-destructive animate-pulse' :
            'bg-secondary border-border text-muted-foreground'
          }`}>
            <Wifi className="w-3 h-3" />
            {isPaused ? 'PAUSED — DEFENDING' : isRunning ? 'ATTACK RUNNING' : 'IDLE'}
          </div>
          <DownloadReport logs={logs} metrics={metrics} target={target} attack={currentAttack} />
          {logs.length > 0 && (
            <Button variant="outline" size="sm" onClick={saveSession} className="gap-1.5">
              <Save className="w-3.5 h-3.5" /> Save Session
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Interactive topology map */}
      <SandboxTopology
        target={target}
        onSelectTarget={setTarget}
        isRunning={isRunning || isLoadingAttack}
        currentAttack={currentAttack}
      />

      {/* Scenario selection */}
      <ScenarioLibrary
        target={target}
        isRunning={isRunning || isLoadingAttack}
        currentAttack={currentAttack}
        onLaunch={handleLaunchAttack}
      />

      {/* Metrics */}
      <SandboxMetrics metrics={metrics} />

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 border border-border rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'simulation' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Terminal className="w-4 h-4" /> Simulation
        </button>
        <button
          onClick={() => setActiveTab('attacker')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'attacker' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <TerminalSquare className="w-4 h-4" /> Attacker CLI
        </button>
        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'terminal' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <TerminalSquare className="w-4 h-4" /> Lab Terminal
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'analysis' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Brain className="w-4 h-4" /> Analysis
          {logs.length > 0 && (
            <span className="ml-1 bg-accent/20 text-accent text-[10px] font-bold px-1.5 py-0.5 rounded-full">{logs.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('campaign')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'campaign' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Layers className="w-4 h-4" /> Campaign
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sessions' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <History className="w-4 h-4" /> Saved Sessions
          {savedSessions.length > 0 && (
            <span className="ml-1 bg-secondary text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{savedSessions.length}</span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'simulation' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SandboxTerminal logs={logs} isLoading={isLoadingAttack} />
          <div className="flex flex-col gap-4">
            <InteractiveDefense
              isPaused={isPaused}
              onPause={handlePause}
              onResume={handleResume}
              appliedDefenses={appliedDefenses}
              onApply={handleApplyDefense}
            />
            <SandboxAlertChart metrics={metrics} />
          </div>
        </div>
      )}
      {activeTab === 'attacker' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <AttackerCLI
            target={target}
            isRunning={isRunning}
            onLogEmit={(log) => appendLog([log])}
          />
          <div className="flex flex-col gap-4">
            <SandboxTerminal logs={logs} isLoading={isLoadingAttack} />
            <AutomatedResponse
              logs={logs}
              isRunning={isRunning}
              onPlaybookFired={(pb) => {
                appendLog([{
                  time: new Date().toISOString(),
                  type: 'firewall',
                  source: 'AUTO-RESPONSE',
                  message: `⚡ Playbook "${pb.name}" triggered → executing: ${pb.actions.join(', ')}`,
                }]);
              }}
            />
          </div>
        </div>
      )}
      {activeTab === 'campaign' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <AttackChain
            target={target}
            isRunning={isCampaignRunning}
            stageStatuses={campaignStageStatuses}
            onRunChain={handleRunChain}
          />
          <SandboxTerminal logs={logs} isLoading={isLoadingAttack} />
        </div>
      )}
      {activeTab === 'terminal' && (
        <InteractiveTerminal target={target} />
      )}
      {activeTab === 'analysis' && (
        <SandboxAnalysis logs={logs} target={target} metrics={metrics} />
      )}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {replaySession && (
            <SessionReplay
              session={replaySession}
              onClose={() => setReplaySession(null)}
            />
          )}
          <SavedSessions
            sessions={savedSessions}
            onReplay={(s) => { setReplaySession(s); }}
            onDelete={deleteSession}
          />
        </div>
      )}
    </div>
  );
}

// Inline mini alert chart component
function SandboxAlertChart({ metrics }) {
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