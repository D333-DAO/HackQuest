import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, ShieldCheck, AlertTriangle, Flame, Globe, Server, Monitor, Cpu, Shield, ExternalLink, X, Zap, Activity } from 'lucide-react';
import { getNetworkNodes, getNetworkEdges, getNetworkState, subscribeToNetwork } from '@/lib/networkStore';

// ---------- static config ----------

const NODE_META = {
  'attacker':            { emoji: '⚡', os: 'Kali Linux 2024',     role: 'Threat Actor',       services: ['nmap', 'metasploit', 'sqlmap'] },
  'firewall':            { emoji: '🛡', os: 'pfSense 2.7',          role: 'Perimeter Defense',  services: ['IDS/IPS', 'DPI', 'NAT'] },
  'web-server':          { emoji: '🌐', os: 'Ubuntu 22.04',         role: 'HTTP/HTTPS Server',  services: ['HTTP:80', 'HTTPS:443', 'SSH:22'] },
  'db-server':           { emoji: '🗄', os: 'CentOS 8',             role: 'Database Server',    services: ['MySQL:3306', 'SSH:22'] },
  'windows-workstation': { emoji: '💻', os: 'Windows 10 Pro',       role: 'User Workstation',   services: ['RDP:3389', 'SMB:445', 'WinRM:5985'] },
  'iot-device':          { emoji: '📡', os: 'Embedded Linux v3.4',  role: 'IoT Sensor',         services: ['Telnet:23', 'HTTP:80'] },
  'internet':            { emoji: '🌍', os: 'WAN Gateway',          role: 'External Network',   services: ['BGP', 'DNS', 'HTTP/S'] },
};

// Attack paths: which node IDs are on the threat path from attacker to each target
const ATTACK_PATHS = {
  'web-server':          ['attacker', 'firewall', 'web-server'],
  'db-server':           ['attacker', 'firewall', 'db-server'],
  'windows-workstation': ['attacker', 'firewall', 'windows-workstation'],
  'iot-device':          ['attacker', 'firewall', 'iot-device'],
  'firewall':            ['attacker', 'firewall'],
  'attacker':            ['attacker'],
  'internet':            ['internet', 'firewall'],
};

const STATUS_CONFIG = {
  healthy:      { color: '#22c55e', glow: 'rgba(34,197,94,0.35)',  label: 'Healthy',      pulse: false },
  warning:      { color: '#f59e0b', glow: 'rgba(245,158,11,0.35)', label: 'Warning',      pulse: true  },
  under_attack: { color: '#f97316', glow: 'rgba(249,115,22,0.5)',  label: 'Under Attack', pulse: true  },
  critical:     { color: '#ef4444', glow: 'rgba(239,68,68,0.6)',   label: 'Critical',     pulse: true  },
  blocked:      { color: '#64748b', glow: 'rgba(100,116,139,0.2)', label: 'Blocked',      pulse: false },
};

const SEVERITY_BADGE = {
  critical:     'bg-red-500/20 text-red-400 border-red-500/30',
  under_attack: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  warning:      'bg-amber-500/20 text-amber-400 border-amber-500/30',
  healthy:      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  blocked:      'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function useNetworkState() {
  const [netState, setNetState] = useState(getNetworkState());
  useEffect(() => subscribeToNetwork(setNetState), []);
  return netState;
}

// ---------- Node detail panel ----------

function NodeDetailPanel({ node, nodeMeta, nodeState, status, onClose }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;
  const attackPath = ATTACK_PATHS[node.id] || [];

  return (
    <div className="border-t border-border bg-secondary/30 px-5 py-4 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{nodeMeta?.emoji}</span>
          <div>
            <p className="text-sm font-bold text-foreground">{node.label}</p>
            <p className="text-xs text-muted-foreground">{nodeMeta?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_BADGE[status] || SEVERITY_BADGE.healthy}`}
          >
            {cfg.label.toUpperCase()}
          </span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* IP & OS */}
        <div className="bg-card border border-border rounded-xl px-3 py-2.5 space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Network Info</p>
          <p className="text-xs font-mono text-accent font-semibold">{node.ip}</p>
          <p className="text-xs text-foreground">{nodeMeta?.os}</p>
        </div>

        {/* Services */}
        <div className="bg-card border border-border rounded-xl px-3 py-2.5 space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Open Services</p>
          <div className="flex flex-wrap gap-1">
            {(nodeMeta?.services || []).map(s => (
              <span key={s} className="text-[10px] font-mono bg-secondary border border-border rounded px-1.5 py-0.5 text-foreground">{s}</span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-xl px-3 py-2.5 space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Attack Stats</p>
          <div className="flex gap-3">
            <div>
              <p className="text-base font-black text-destructive">{nodeState?.attackCount || 0}</p>
              <p className="text-[9px] text-muted-foreground">Attempts</p>
            </div>
            <div>
              <p className="text-base font-black text-primary">{nodeState?.blockedCount || 0}</p>
              <p className="text-[9px] text-muted-foreground">Blocked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attack path highlight */}
      {attackPath.length > 1 && (
        <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3 h-3 text-red-400" />
            <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest">Potential Attack Path</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {attackPath.map((id, i) => {
              const n = getNetworkNodes().find(x => x.id === id);
              const meta = NODE_META[id];
              return (
                <React.Fragment key={id}>
                  <span className="flex items-center gap-1 bg-card border border-border rounded-lg px-2 py-1 text-[10px] font-mono text-foreground">
                    <span>{meta?.emoji}</span>
                    <span>{n?.label || id}</span>
                  </span>
                  {i < attackPath.length - 1 && (
                    <span className="text-red-400 text-xs font-bold">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {nodeState?.label && (
            <p className="text-[10px] text-red-300/70 mt-2">Last attack: <span className="font-semibold">{nodeState.label}</span></p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Main component ----------

export default function NetworkTopology() {
  const netState = useNetworkState();
  const nodes    = getNetworkNodes();
  const edges    = getNetworkEdges();

  const [selected, setSelected] = useState(null);
  const svgRef   = useRef(null);
  const [dims, setDims] = useState({ w: 600, h: 300 });

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const px = (nx) => nx * dims.w;
  const py = (ny) => ny * dims.h;

  const nodeStatusOf = (id) => netState.nodes[id]?.status || 'healthy';

  // Which nodes are on the attack path of the selected node
  const attackPathIds = selected ? (ATTACK_PATHS[selected] || []) : [];

  const overallStatus = Object.values(netState.nodes).some(n => n.status === 'critical') ? 'critical' :
    Object.values(netState.nodes).some(n => n.status === 'under_attack') ? 'under_attack' :
    Object.values(netState.nodes).some(n => n.status === 'warning') ? 'warning' : 'healthy';

  const StatusIcon = overallStatus === 'healthy' ? ShieldCheck :
    overallStatus === 'warning' ? AlertTriangle : Flame;
  const statusCfg = STATUS_CONFIG[overallStatus];

  const selectedNode = nodes.find(n => n.id === selected);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Network Topology</span>
          <span
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ml-1"
            style={{ color: statusCfg.color, borderColor: statusCfg.color + '55', background: statusCfg.color + '15' }}
          >
            <StatusIcon className="w-2.5 h-2.5" />
            {statusCfg.label.toUpperCase()}
          </span>
          {selected && (
            <span className="text-[10px] text-muted-foreground ml-1 hidden sm:inline">
              — click a node to inspect
            </span>
          )}
        </div>
        <Link
          to="/Sandbox"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
        >
          Open Sandbox <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* SVG Canvas */}
      <div className="relative" style={{ height: 300 }}>
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          preserveAspectRatio="none"
          onClick={() => setSelected(null)}
        >
          <defs>
            {nodes.map(n => {
              const st = STATUS_CONFIG[nodeStatusOf(n.id)];
              return (
                <filter key={`glow-${n.id}`} id={`glow-${n.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feFlood floodColor={st.glow} result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="shadow" />
                  <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              );
            })}
            {/* Attack path glow */}
            <filter id="glow-attack-path" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="rgba(239,68,68,0.6)" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map((e, i) => {
            const from = nodes.find(n => n.id === e.from);
            const to   = nodes.find(n => n.id === e.to);
            if (!from || !to) return null;

            const isOnPath = selected &&
              attackPathIds.includes(e.from) &&
              attackPathIds.includes(e.to) &&
              // must be consecutive in path
              Math.abs(attackPathIds.indexOf(e.from) - attackPathIds.indexOf(e.to)) === 1;

            const targetStatus = nodeStatusOf(e.to);
            const isActive = ['warning', 'under_attack', 'critical'].includes(targetStatus);

            return (
              <g key={i}>
                <line
                  x1={px(from.x)} y1={py(from.y)}
                  x2={px(to.x)}   y2={py(to.y)}
                  stroke={isOnPath ? '#ef4444' : isActive ? STATUS_CONFIG[targetStatus].color : '#334155'}
                  strokeWidth={isOnPath ? 2.5 : isActive ? 1.5 : 1}
                  strokeOpacity={isOnPath ? 0.85 : isActive ? 0.6 : selected ? 0.15 : 0.35}
                  strokeDasharray={isOnPath ? '6 3' : isActive ? '4 3' : undefined}
                  filter={isOnPath ? 'url(#glow-attack-path)' : undefined}
                />
                {/* Animated dot along attack path */}
                {isOnPath && (
                  <circle r="3" fill="#ef4444" opacity="0.9">
                    <animateMotion
                      dur="1.2s"
                      repeatCount="indefinite"
                      path={`M${px(from.x)},${py(from.y)} L${px(to.x)},${py(to.y)}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const st      = STATUS_CONFIG[nodeStatusOf(n.id)];
            const cx      = px(n.x);
            const cy      = py(n.y);
            const r       = n.type === 'firewall' ? 22 : 18;
            const isSelected = selected === n.id;
            const isOnPath   = attackPathIds.includes(n.id);
            const isDimmed   = selected && !isOnPath && !isSelected;
            const meta    = NODE_META[n.id] || {};

            return (
              <g
                key={n.id}
                transform={`translate(${cx},${cy})`}
                style={{ cursor: 'pointer', opacity: isDimmed ? 0.3 : 1, transition: 'opacity 0.2s' }}
                onClick={e => { e.stopPropagation(); setSelected(isSelected ? null : n.id); }}
                filter={st.pulse || isSelected ? `url(#glow-${n.id})` : undefined}
              >
                {/* Pulse ring for status */}
                {st.pulse && !isSelected && (
                  <circle r={r + 8} fill="none" stroke={st.color} strokeWidth="1" opacity="0.3">
                    <animate attributeName="r" values={`${r+4};${r+14};${r+4}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Selection ring */}
                {isSelected && (
                  <circle r={r + 7} fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.7" strokeDasharray="4 2">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Attack path highlight ring */}
                {isOnPath && !isSelected && selected && (
                  <circle r={r + 5} fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.5">
                    <animate attributeName="opacity" values="0.5;0.15;0.5" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Main circle */}
                <circle
                  r={r}
                  fill={isSelected ? '#1e293b' : '#0f172a'}
                  stroke={isSelected ? '#60a5fa' : isOnPath && selected ? '#ef4444' : st.color}
                  strokeWidth={isSelected ? 2.5 : isOnPath && selected ? 2 : 1.5}
                />

                {/* Emoji */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={n.type === 'firewall' ? 13 : 11}
                  style={{ fontFamily: 'monospace', userSelect: 'none' }}
                >
                  {meta.emoji || '🖥'}
                </text>

                {/* Label */}
                <text y={r + 13} textAnchor="middle" fontSize="8" fill={isSelected ? '#e2e8f0' : '#94a3b8'} style={{ userSelect: 'none' }}>
                  {n.label}
                </text>
                <text y={r + 22} textAnchor="middle" fontSize="7" fill={isSelected ? '#60a5fa' : '#475569'} style={{ userSelect: 'none', fontFamily: 'monospace' }}>
                  {n.ip}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Click-anywhere hint */}
        {!selected && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/50 pointer-events-none select-none">
            Click a node to inspect
          </div>
        )}
      </div>

      {/* Node detail panel */}
      {selected && selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          nodeMeta={NODE_META[selected]}
          nodeState={netState.nodes[selected]}
          status={nodeStatusOf(selected)}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-border flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
            <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
          </div>
        ))}
        {netState.lastUpdated && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            Updated {new Date(netState.lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}