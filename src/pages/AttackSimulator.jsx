import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, RotateCcw, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ATTACK_SCENARIOS } from '@/lib/attackScenarios';
import SimulatorNodeSelector from '@/components/simulator/SimulatorNodeSelector';
import SimulatorScenarioCard from '@/components/simulator/SimulatorScenarioCard';
import SimulatorLaunchPanel from '@/components/simulator/SimulatorLaunchPanel';
import SimulatorLogStream from '@/components/simulator/SimulatorLogStream';
import DefenseDashboard from '@/components/simulator/DefenseDashboard';
import { applyAttackMetrics, setActiveAttack, resetNetwork, updateNodeStatus } from '@/lib/networkStore';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link as RouterLink } from 'react-router-dom';
import { Wrench, History } from 'lucide-react';
import SimulatorReport from '@/components/simulator/SimulatorReport';

const NODES = [
  { id: 'web-server',          name: 'Web Server',         ip: '10.0.1.10', os: 'Ubuntu 22.04',   services: ['HTTP:80','HTTPS:443','SSH:22']  },
  { id: 'db-server',           name: 'Database Server',    ip: '10.0.1.20', os: 'CentOS 8',       services: ['MySQL:3306','SSH:22']             },
  { id: 'windows-workstation', name: 'Win Workstation',    ip: '10.0.1.30', os: 'Windows 10',     services: ['RDP:3389','SMB:445']              },
  { id: 'iot-device',          name: 'IoT Device',         ip: '10.0.1.40', os: 'Embedded Linux', services: ['Telnet:23','HTTP:80']             },
];

const ATTACKER_IP = '192.168.1.1';

function interpolate(msg, target) {
  return msg
    .replace(/{ip}/g, target.ip)
    .replace(/{attacker_ip}/g, ATTACKER_IP)
    .replace(/{asn}/g, String(Math.floor(Math.random() * 60000) + 1000));
}

export default function AttackSimulator() {
  const { data: customScenarios = [] } = useQuery({
    queryKey: ['custom-scenarios'],
    queryFn: () => base44.entities.CustomScenario.list('-created_date'),
  });

  // Normalize custom scenarios to match built-in shape
  const allScenarios = [
    ...ATTACK_SCENARIOS,
    ...customScenarios.map(s => ({
      id: s.id,
      name: s.name,
      icon: s.icon || '💀',
      category: s.category || 'Custom',
      color: 'text-accent',
      border: 'border-accent/30',
      bg: 'bg-accent/10',
      severity: s.severity || 'medium',
      compatibleTargets: s.compatible_targets || ['web-server','db-server','windows-workstation','iot-device'],
      description: s.description || '',
      phases: s.phases || [{ label: 'Attack', duration: 1000 }],
      logTemplates: (s.log_templates || []).map(t => ({ type: t.type, messages: t.messages })),
      isCustom: true,
    })),
  ];

  const [selectedNode, setSelectedNode]     = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isRunning, setIsRunning]           = useState(false);
  const [logs, setLogs]                     = useState([]);
  const [phase, setPhase]                   = useState(null);   // current phase name
  const [phaseIdx, setPhaseIdx]             = useState(-1);
  const [runHistory, setRunHistory]         = useState([]);

  const appendLog = (entry) => setLogs(prev => [...prev, entry].slice(-300));

  const handleDefenseAction = (logEntry) => {
    appendLog(logEntry);
  };

  const reset = () => {
    setIsRunning(false);
    setLogs([]);
    setPhase(null);
    setPhaseIdx(-1);
    resetNetwork();
  };

  const launchAttack = async () => {
    if (!selectedNode || !selectedScenario) return;
    setIsRunning(true);
    setLogs([]);
    setPhaseIdx(0);

    setActiveAttack({ name: selectedScenario.name, id: selectedScenario.id });

    // Set initial attacking state on nodes
    updateNodeStatus(selectedNode.id, { status: 'warning', label: selectedScenario.name, lastEvent: new Date().toISOString() });
    updateNodeStatus('firewall', { status: 'warning' });
    updateNodeStatus('attacker', { status: 'warning', label: 'Attacking', lastEvent: new Date().toISOString() });

    appendLog({ time: new Date().toISOString(), type: 'system', source: 'SIMULATOR', message: `▶ Launching "${selectedScenario.name}" against ${selectedNode.name} (${selectedNode.ip})` });

    let offset = 0;

    for (let pIdx = 0; pIdx < selectedScenario.phases.length; pIdx++) {
      const phaseObj = selectedScenario.phases[pIdx];

      // Phase header log
      setTimeout(() => {
        setPhaseIdx(pIdx);
        setPhase(phaseObj.label);
        appendLog({ time: new Date().toISOString(), type: 'system', source: 'PHASE', message: `── Phase ${pIdx + 1}/${selectedScenario.phases.length}: ${phaseObj.label} ──` });
      }, offset);
      offset += 300;

      // Interleave log lines from all categories during this phase
      const allLines = selectedScenario.logTemplates.flatMap(tpl =>
        tpl.messages.map(msg => ({ type: tpl.type, message: interpolate(msg, selectedNode) }))
      ).sort(() => Math.random() - 0.5).slice(0, 5); // ~5 lines per phase

      allLines.forEach((line, li) => {
        setTimeout(() => {
          appendLog({
            time: new Date().toISOString(),
            type: line.type,
            source: line.type.toUpperCase(),
            message: line.message,
          });
        }, offset + li * Math.floor(phaseObj.duration / (allLines.length + 1)));
      });

      offset += phaseObj.duration;

      // Escalate node status mid-attack
      if (pIdx === Math.floor(selectedScenario.phases.length / 2)) {
        setTimeout(() => {
          const midStatus = selectedScenario.severity === 'critical' ? 'under_attack' : 'warning';
          updateNodeStatus(selectedNode.id, { status: midStatus, label: selectedScenario.name });
        }, offset - 200);
      }
    }

    // Finish
    setTimeout(() => {
      const alertMap = { critical: { blocked_count: 12, detected_count: 18, connections_attempted: 340, alert_level: 'critical' },
                         high:     { blocked_count: 20, detected_count: 14, connections_attempted: 180, alert_level: 'high'     },
                         medium:   { blocked_count: 35, detected_count: 8,  connections_attempted: 90,  alert_level: 'medium'   } };
      const metrics = alertMap[selectedScenario.severity] || alertMap.medium;

      applyAttackMetrics(selectedNode.id, metrics, selectedScenario.name);

      appendLog({ time: new Date().toISOString(), type: 'system', source: 'SIMULATOR', message: `■ Attack sequence complete — ${metrics.blocked_count} connections blocked, ${metrics.detected_count} alerts raised` });

      // Determine overall status
      const attackStatus = metrics.blocked_count > metrics.connections_attempted * 0.6
        ? 'blocked'
        : metrics.blocked_count > 0
        ? 'partial'
        : 'success';

      // Persist to AttackLog
      base44.entities.AttackLog.create({
        scenario_name: selectedScenario.name,
        scenario_icon: selectedScenario.icon,
        scenario_category: selectedScenario.category,
        scenario_severity: selectedScenario.severity,
        target_name: selectedNode.name,
        target_ip: selectedNode.ip,
        target_os: selectedNode.os,
        status: attackStatus,
        blocked_count: metrics.blocked_count,
        detected_count: metrics.detected_count,
        connections_attempted: metrics.connections_attempted,
        alert_level: metrics.alert_level,
        log_count: logs.length,
      });

      setRunHistory(prev => [{
        scenario: selectedScenario.name,
        target: selectedNode.name,
        severity: selectedScenario.severity,
        time: new Date().toLocaleTimeString(),
        blocked: metrics.blocked_count,
        detected: metrics.detected_count,
      }, ...prev].slice(0, 8));

      setIsRunning(false);
      setPhase(null);
      setPhaseIdx(-1);
    }, offset + 400);
  };

  const compatibleScenarios = selectedNode
    ? allScenarios.filter(s => s.compatibleTargets.includes(selectedNode.id))
    : allScenarios;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Link to="/Dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Attack Simulator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trigger predefined attack scenarios against network nodes and observe live defensive responses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/30 text-destructive animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />
              {phase || 'ATTACK RUNNING'}
            </span>
          )}
          <RouterLink to="/AttackHistory">
            <Button variant="outline" size="sm" className="gap-1.5">
              <History className="w-3.5 h-3.5" /> History
            </Button>
          </RouterLink>
          <RouterLink to="/ScenarioBuilder">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Wrench className="w-3.5 h-3.5" /> Custom Scenarios
            </Button>
          </RouterLink>
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Step 1 & 2 — Node + Scenario selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SimulatorNodeSelector
          nodes={NODES}
          selected={selectedNode}
          onSelect={(n) => { setSelectedNode(n); setSelectedScenario(null); }}
        />

        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            2. Choose Attack Scenario
            {selectedNode && (
              <span className="text-[10px] text-muted-foreground font-normal ml-1">
                ({compatibleScenarios.length} compatible with {selectedNode.name})
              </span>
            )}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {compatibleScenarios.map(s => (
              <SimulatorScenarioCard
                key={s.id}
                scenario={s}
                selected={selectedScenario?.id === s.id}
                onSelect={() => setSelectedScenario(s)}
                disabled={isRunning}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step 3 — Launch + progress */}
      <SimulatorLaunchPanel
        node={selectedNode}
        scenario={selectedScenario}
        isRunning={isRunning}
        phaseIdx={phaseIdx}
        onLaunch={launchAttack}
      />

      {/* Defense Dashboard — shown while attack is running */}
      <DefenseDashboard
        isActive={isRunning}
        node={selectedNode}
        scenario={selectedScenario}
        onAction={handleDefenseAction}
      />

      {/* Log stream */}
      {logs.length > 0 && (
        <SimulatorLogStream logs={logs} isRunning={isRunning} />
      )}

      {/* Run history */}
      {runHistory.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Run History</p>
          </div>
          <div className="divide-y divide-border">
            {runHistory.map((r, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-2.5 text-xs">
                <span className="text-muted-foreground font-mono w-16 shrink-0">{r.time}</span>
                <span className="font-medium text-foreground flex-1">{r.scenario}</span>
                <span className="text-muted-foreground">→ {r.target}</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full border text-[10px] ${
                  r.severity === 'critical' ? 'text-destructive bg-destructive/10 border-destructive/20' :
                  r.severity === 'high'     ? 'text-orange-400 bg-orange-500/10 border-orange-400/20' :
                                              'text-amber-400 bg-amber-500/10 border-amber-400/20'
                }`}>{r.severity.toUpperCase()}</span>
                <span className="text-primary font-mono">{r.blocked} blocked</span>
                <span className="text-amber-400 font-mono">{r.detected} alerts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}