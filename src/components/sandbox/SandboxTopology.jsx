import React, { useState, useEffect, useRef } from 'react';
import { Wifi, X, AlertTriangle, ShieldCheck, Flame, Zap } from 'lucide-react';
import { getNetworkNodes, getNetworkEdges, getNetworkState, subscribeToNetwork } from '@/lib/networkStore';

// ── Node visual config ────────────────────────────────────────────────────────
const NODE_CONFIG = {
  attacker:             { emoji: '⚡', label: 'Kali Linux', role: 'Threat Actor',       r: 20, fill: '#1a0a0a', stroke: '#ef4444' },
  firewall:             { emoji: '🛡', label: 'pfSense',    role: 'Perimeter Defense',  r: 24, fill: '#0a1520', stroke: '#60a5fa' },
  'web-server':         { emoji: '🌐', label: 'Ubuntu 22',  role: 'HTTP/HTTPS Server',  r: 20, fill: '#0a150a', stroke: '#22c55e' },
  'db-server':          { emoji: '🗄', label: 'CentOS 8',   role: 'Database Server',    r: 20, fill: '#1a0a1a', stroke: '#a855f7' },
  'windows-workstation':{ emoji: '💻', label: 'Win10 Pro',  role: 'User Workstation',   r: 20, fill: '#0a1520', stroke: '#38bdf8' },
  'iot-device':         { emoji: '📡', label: 'Embedded',   role: 'IoT Sensor',         r: 20, fill: '#1a1500', stroke: '#f59e0b' },
  internet:             { emoji: '🌍', label: 'WAN',         role: 'External Network',   r: 18, fill: '#111827', stroke: '#6b7280' },
};

// ── Vulnerability database per node ──────────────────────────────────────────
const VULNS = {
  attacker: [],
  internet: [],
  firewall: [
    { cve: 'CVE-2023-27997', severity: 'critical', desc: 'FortiOS SSL-VPN RCE vulnerability', cvss: 9.8 },
    { cve: 'CVE-2022-42475', severity: 'critical', desc: 'pfSense heap overflow in IPSec', cvss: 9.3 },
    { cve: 'CVE-2023-20198', severity: 'high',     desc: 'IOS XE privilege escalation', cvss: 8.1 },
  ],
  'web-server': [
    { cve: 'CVE-2021-44228', severity: 'critical', desc: 'Log4Shell RCE via JNDI injection', cvss: 10.0 },
    { cve: 'CVE-2023-44487', severity: 'high',     desc: 'HTTP/2 Rapid Reset DoS (Apache)', cvss: 7.5 },
    { cve: 'CVE-2022-22965', severity: 'critical', desc: 'Spring4Shell — Spring MVC RCE', cvss: 9.8 },
    { cve: 'CVE-2021-26086', severity: 'medium',   desc: 'Confluence path traversal', cvss: 5.3 },
  ],
  'db-server': [
    { cve: 'CVE-2021-3449',  severity: 'high',     desc: 'OpenSSL NULL pointer dereference', cvss: 7.4 },
    { cve: 'CVE-2016-6662',  severity: 'critical', desc: 'MySQL arbitrary code execution', cvss: 9.8 },
    { cve: 'CVE-2022-21824', severity: 'high',     desc: 'Node.js prototype pollution', cvss: 8.2 },
    { cve: 'CVE-2023-22515', severity: 'critical', desc: 'Confluence broken access control', cvss: 10.0 },
  ],
  'windows-workstation': [
    { cve: 'CVE-2021-34527', severity: 'critical', desc: 'PrintNightmare — Windows Print Spooler RCE', cvss: 8.8 },
    { cve: 'CVE-2020-0796',  severity: 'critical', desc: 'SMBGhost — SMBv3 Buffer Overflow', cvss: 10.0 },
    { cve: 'CVE-2022-37969', severity: 'high',     desc: 'Windows CLFS privilege escalation', cvss: 7.8 },
    { cve: 'CVE-2021-1675',  severity: 'high',     desc: 'Windows Print Spooler LPE', cvss: 7.8 },
  ],
  'iot-device': [
    { cve: 'CVE-2021-35394', severity: 'critical', desc: 'Realtek SDK command injection', cvss: 9.8 },
    { cve: 'CVE-2017-8225',  severity: 'high',     desc: 'GoAhead web server auth bypass', cvss: 9.1 },
    { cve: 'CVE-2023-1389',  severity: 'high',     desc: 'TP-Link Archer command injection', cvss: 8.8 },
    { cve: 'CVE-2014-2321',  severity: 'high',     desc: 'ZTE firmware backdoor access', cvss: 7.5 },
  ],
};

// ── CVSS severity colour ──────────────────────────────────────────────────────
const SEVERITY_STYLE = {
  critical: { bg: 'bg-red-500/15',    border: 'border-red-500/30',    text: 'text-red-400',    dot: '#ef4444' },
  high:     { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400', dot: '#f97316' },
  medium:   { bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  text: 'text-amber-400',  dot: '#f59e0b' },
  low:      { bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   text: 'text-blue-400',   dot: '#60a5fa' },
};

// ── Node status visuals ───────────────────────────────────────────────────────
const STATUS_STYLE = {
  healthy:      { ring: '#22c55e', glow: 'rgba(34,197,94,0.4)',   label: 'Healthy' },
  warning:      { ring: '#f59e0b', glow: 'rgba(245,158,11,0.4)',  label: 'Warning' },
  under_attack: { ring: '#f97316', glow: 'rgba(249,115,22,0.55)', label: 'Under Attack' },
  critical:     { ring: '#ef4444', glow: 'rgba(239,68,68,0.65)',  label: 'Critical' },
  blocked:      { ring: '#64748b', glow: 'rgba(100,116,139,0.2)', label: 'Blocked' },
};

// ── Selectable targets (same IDs as networkStore + SandboxTargetSelector) ────
const SELECTABLE = ['web-server', 'db-server', 'windows-workstation', 'iot-device'];

const SANDBOX_TARGETS = {
  'web-server':          { name: 'Web Server',          ip: '10.0.1.10', os: 'Ubuntu 22.04',      services: ['HTTP:80', 'HTTPS:443', 'SSH:22'] },
  'db-server':           { name: 'Database Server',      ip: '10.0.1.20', os: 'CentOS 8',          services: ['MySQL:3306', 'SSH:22', 'FTP:21'] },
  'windows-workstation': { name: 'Windows Workstation',  ip: '10.0.1.30', os: 'Windows 10 Pro',    services: ['SMB:445', 'RDP:3389', 'WinRM:5985'] },
  'iot-device':          { name: 'IoT Device',           ip: '10.0.1.40', os: 'Embedded Linux v3', services: ['Telnet:23', 'HTTP:80', 'MQTT:1883'] },
};

// ── Attack path from attacker node to each target ─────────────────────────────
const ATTACK_PATH = {
  'web-server':          ['attacker', 'firewall', 'web-server'],
  'db-server':           ['attacker', 'firewall', 'db-server'],
  'windows-workstation': ['attacker', 'firewall', 'windows-workstation'],
  'iot-device':          ['attacker', 'firewall', 'iot-device'],
};

// ── Vulnerability panel ───────────────────────────────────────────────────────
function VulnPanel({ nodeId, nodeState, onClose, onSelect, isSelected }) {
  const cfg   = NODE_CONFIG[nodeId] || {};
  const vulns = VULNS[nodeId] || [];
  const st    = STATUS_STYLE[nodeState?.status || 'healthy'];
  const target = SANDBOX_TARGETS[nodeId];

  return (
    <div className="absolute right-0 top-0 h-full w-72 bg-[#0d1117] border-l border-border flex flex-col z-20 animate-in slide-in-from-right-4 duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-[#161b22] shrink-0">
        <span className="text-xl">{cfg.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{target?.name || nodeId}</p>
          <p className="text-[10px] text-muted-foreground font-mono">{target?.ip}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Status + stats */}
      <div className="px-4 py-3 border-b border-border shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: st.glow, color: st.ring }}>
            {st.label.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary/40 rounded-lg p-2 text-center">
            <p className="text-sm font-black text-destructive">{nodeState?.attackCount || 0}</p>
            <p className="text-[9px] text-muted-foreground">Attempts</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-2 text-center">
            <p className="text-sm font-black text-primary">{nodeState?.blockedCount || 0}</p>
            <p className="text-[9px] text-muted-foreground">Blocked</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-2 text-center">
            <p className="text-sm font-black text-amber-400">{vulns.filter(v => v.severity === 'critical').length}</p>
            <p className="text-[9px] text-muted-foreground">Critical</p>
          </div>
        </div>

        {/* OS + services */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">OS: <span className="text-foreground">{target?.os}</span></p>
          <div className="flex flex-wrap gap-1">
            {(target?.services || []).map(s => (
              <span key={s} className="text-[9px] font-mono bg-secondary border border-border px-1.5 py-0.5 rounded text-foreground">{s}</span>
            ))}
          </div>
        </div>

        {/* Select as target */}
        {target && (
          <button
            onClick={() => onSelect(SANDBOX_TARGETS[nodeId] ? { id: nodeId, ...SANDBOX_TARGETS[nodeId] } : null)}
            className={`w-full text-xs font-semibold py-1.5 rounded-lg border transition-all ${
              isSelected
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-secondary/30 border-border text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary'
            }`}
          >
            {isSelected ? '✓ Selected as Target' : 'Set as Attack Target'}
          </button>
        )}
      </div>

      {/* Vulnerabilities list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
          Known Vulnerabilities ({vulns.length})
        </p>
        {vulns.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No known CVEs for this node.</p>
        ) : (
          vulns.map(v => {
            const sty = SEVERITY_STYLE[v.severity] || SEVERITY_STYLE.low;
            return (
              <div key={v.cve} className={`rounded-xl border p-3 space-y-1 ${sty.bg} ${sty.border}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold font-mono ${sty.text}`}>{v.cve}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${sty.bg} ${sty.border} ${sty.text}`}>
                    {v.severity.toUpperCase()} {v.cvss}
                  </span>
                </div>
                <p className="text-[10px] text-foreground/80 leading-relaxed">{v.desc}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Animated attack packet ────────────────────────────────────────────────────
function AttackPacket({ fromPt, toPt, color, delay = 0, duration = 1.2 }) {
  const path = `M${fromPt.x},${fromPt.y} L${toPt.x},${toPt.y}`;
  return (
    <circle r="4" fill={color} opacity="0.9" filter="url(#packet-glow)">
      <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`} path={path} />
      <animate attributeName="opacity" values="0;0.9;0.9;0" dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`} />
    </circle>
  );
}

// ── Main SandboxTopology component ───────────────────────────────────────────
export default function SandboxTopology({ target, onSelectTarget, isRunning, currentAttack }) {
  const [netState, setNetState] = useState(getNetworkState());
  const [selectedNode, setSelectedNode] = useState(null);
  const [dims, setDims] = useState({ w: 700, h: 340 });
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const nodes = getNetworkNodes();
  const edges = getNetworkEdges();

  useEffect(() => subscribeToNetwork(setNetState), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDims({ w: width, h: Math.max(300, Math.min(380, width * 0.48)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const px = (nx) => nx * dims.w;
  const py = (ny) => ny * dims.h;

  const nodeStatusOf = (id) => netState.nodes[id]?.status || 'healthy';

  // Active attack path edges
  const activePath = (isRunning && target) ? (ATTACK_PATH[target.id] || []) : [];
  const pathEdgePairs = activePath.reduce((acc, id, i) => {
    if (i < activePath.length - 1) acc.push([id, activePath[i + 1]]);
    return acc;
  }, []);

  const isPathEdge = (from, to) =>
    pathEdgePairs.some(([a, b]) => (a === from && b === to) || (a === to && b === from));

  const overallStatus = Object.values(netState.nodes).some(n => n.status === 'critical') ? 'critical' :
    Object.values(netState.nodes).some(n => n.status === 'under_attack') ? 'under_attack' :
    Object.values(netState.nodes).some(n => n.status === 'warning') ? 'warning' : 'healthy';

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Interactive Network Topology</span>
          <NetworkStatusBadge status={overallStatus} />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {isRunning && currentAttack && (
            <span className="flex items-center gap-1 text-red-400 animate-pulse font-semibold">
              <Zap className="w-3 h-3" /> {currentAttack.name}
            </span>
          )}
          <span className="hidden sm:inline">Click node to inspect vulnerabilities</span>
        </div>
      </div>

      {/* Map + panel */}
      <div ref={containerRef} className="relative">
        {/* SVG canvas */}
        <svg
          ref={svgRef}
          width={dims.w}
          height={dims.h}
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          className="block"
          style={{ background: 'linear-gradient(180deg, #060d12 0%, #0a1118 100%)' }}
          onClick={() => setSelectedNode(null)}
        >
          <defs>
            {/* Glow filter per node */}
            {nodes.map(n => {
              const st = STATUS_STYLE[nodeStatusOf(n.id)] || STATUS_STYLE.healthy;
              return (
                <filter key={`gf-${n.id}`} id={`gf-${n.id}`} x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feFlood floodColor={st.glow} result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="shadow" />
                  <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              );
            })}

            {/* Attack edge glow */}
            <filter id="edge-attack" x="-20%" y="-200%" width="140%" height="500%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="rgba(239,68,68,0.7)" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Packet glow */}
            <filter id="packet-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="rgba(239,68,68,0.9)" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Selection ring */}
            <filter id="sel-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feFlood floodColor="rgba(96,165,250,0.6)" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Grid pattern */}
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect width={dims.w} height={dims.h} fill="url(#grid)" />

          {/* ── Edges ── */}
          {edges.map((e, i) => {
            const from = nodes.find(n => n.id === e.from);
            const to   = nodes.find(n => n.id === e.to);
            if (!from || !to) return null;

            const fromPt = { x: px(from.x), y: py(from.y) };
            const toPt   = { x: px(to.x), y: py(to.y) };
            const onPath = isPathEdge(e.from, e.to);
            const targetSt = nodeStatusOf(e.to);
            const isActive = ['warning', 'under_attack', 'critical'].includes(targetSt);

            return (
              <g key={i}>
                {/* Base edge line */}
                <line
                  x1={fromPt.x} y1={fromPt.y}
                  x2={toPt.x} y2={toPt.y}
                  stroke={onPath ? '#ef4444' : isActive ? STATUS_STYLE[targetSt]?.ring || '#334155' : '#1e293b'}
                  strokeWidth={onPath ? 2.5 : isActive ? 1.5 : 1}
                  strokeOpacity={onPath ? 0.9 : isActive ? 0.5 : 0.4}
                  strokeDasharray={onPath ? '8 4' : isActive ? '4 3' : undefined}
                  filter={onPath ? 'url(#edge-attack)' : undefined}
                />

                {/* Animated attack packets */}
                {onPath && isRunning && (
                  <>
                    <AttackPacket fromPt={fromPt} toPt={toPt} color="#ef4444" delay={0}    duration={1.1} />
                    <AttackPacket fromPt={fromPt} toPt={toPt} color="#f97316" delay={0.4}  duration={1.1} />
                    <AttackPacket fromPt={fromPt} toPt={toPt} color="#ef4444" delay={0.75} duration={1.1} />
                  </>
                )}

                {/* Static path dot when not running but path is selected */}
                {onPath && !isRunning && target && (
                  <circle r="2.5" fill="#ef4444" opacity="0.6">
                    <animateMotion
                      dur="2s"
                      repeatCount="indefinite"
                      path={`M${fromPt.x},${fromPt.y} L${toPt.x},${toPt.y}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* ── Nodes ── */}
          {nodes.map(n => {
            const cfg     = NODE_CONFIG[n.id] || { emoji: '🖥', r: 18, fill: '#0f172a', stroke: '#334155' };
            const st      = STATUS_STYLE[nodeStatusOf(n.id)] || STATUS_STYLE.healthy;
            const cx      = px(n.x);
            const cy      = py(n.y);
            const r       = cfg.r;
            const isSelectable = SELECTABLE.includes(n.id);
            const isSelected  = selectedNode === n.id;
            const isTargeted  = target?.id === n.id;
            const isOnPath    = activePath.includes(n.id);
            const nodeState   = netState.nodes[n.id];
            const hasStatus   = nodeState?.status && nodeState.status !== 'healthy';

            const ringColor = isTargeted ? '#a3e635' : isSelected ? '#60a5fa' : isOnPath ? '#ef4444' : st.ring;
            const ringW     = isTargeted || isSelected ? 2.5 : isOnPath ? 2 : 1.5;

            return (
              <g
                key={n.id}
                transform={`translate(${cx},${cy})`}
                style={{ cursor: isSelectable || n.id !== 'internet' ? 'pointer' : 'default' }}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedNode(prev => (prev === n.id ? null : n.id));
                }}
                filter={(hasStatus || isSelected || isTargeted) ? `url(#gf-${n.id})` : undefined}
              >
                {/* Pulse ring — attack status */}
                {hasStatus && (
                  <circle r={r + 10} fill="none" stroke={st.ring} strokeWidth="1" opacity="0">
                    <animate attributeName="r" values={`${r+5};${r+16};${r+5}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Target highlight ring */}
                {isTargeted && (
                  <circle r={r + 8} fill="none" stroke="#a3e635" strokeWidth="2" strokeDasharray="5 3" opacity="0.7">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Selection ring */}
                {isSelected && !isTargeted && (
                  <circle r={r + 7} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6">
                    <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="7s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Main node circle */}
                <circle
                  r={r}
                  fill={cfg.fill}
                  stroke={ringColor}
                  strokeWidth={ringW}
                />

                {/* Emoji */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={r > 20 ? 13 : 11}
                  style={{ fontFamily: 'system-ui', userSelect: 'none', pointerEvents: 'none' }}
                >
                  {cfg.emoji}
                </text>

                {/* Label */}
                <text
                  y={r + 13}
                  textAnchor="middle"
                  fontSize="8"
                  fill={isSelected || isTargeted ? '#e2e8f0' : '#94a3b8'}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {n.label}
                </text>

                {/* IP */}
                <text
                  y={r + 22}
                  textAnchor="middle"
                  fontSize="7"
                  fill={isTargeted ? '#a3e635' : isSelected ? '#60a5fa' : '#475569'}
                  fontFamily="monospace"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {n.ip}
                </text>

                {/* Vulnerability count badge */}
                {(VULNS[n.id]?.length > 0) && (
                  <g transform={`translate(${r - 4}, ${-r + 4})`}>
                    <circle r="7" fill="#ef4444" stroke="#0d1117" strokeWidth="1.5" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="7"
                      fill="white"
                      fontWeight="bold"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {VULNS[n.id].length}
                    </text>
                  </g>
                )}

                {/* Attack count badge */}
                {nodeState?.attackCount > 0 && (
                  <g transform={`translate(${-(r - 4)}, ${-r + 4})`}>
                    <circle r="7" fill="#f97316" stroke="#0d1117" strokeWidth="1.5" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="6"
                      fill="white"
                      fontWeight="bold"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {nodeState.attackCount > 99 ? '99+' : nodeState.attackCount}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Vulnerability side panel */}
        {selectedNode && (
          <VulnPanel
            nodeId={selectedNode}
            nodeState={netState.nodes[selectedNode]}
            onClose={() => setSelectedNode(null)}
            onSelect={(t) => { if (t) onSelectTarget(t); setSelectedNode(null); }}
            isSelected={target?.id === selectedNode}
          />
        )}
      </div>

      {/* Legend + hint */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 px-4 py-2.5 border-t border-border bg-[#060d12]">
        {Object.entries(STATUS_STYLE).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: v.ring }} />
            <span className="text-[9px] text-muted-foreground">{v.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-[9px] text-muted-foreground">CVE count badge</span>
        </div>
        {netState.lastUpdated && (
          <span className="text-[9px] text-muted-foreground/50">
            Updated {new Date(netState.lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

function NetworkStatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.healthy;
  const Icon = status === 'healthy' ? ShieldCheck : status === 'warning' ? AlertTriangle : Flame;
  return (
    <span
      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ml-1"
      style={{ color: s.ring, borderColor: s.ring + '55', background: s.ring + '18' }}
    >
      <Icon className="w-2.5 h-2.5" />
      {s.label.toUpperCase()}
    </span>
  );
}