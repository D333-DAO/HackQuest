import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, ShieldCheck, AlertTriangle, Flame, Minus, Globe, Server, Monitor, Cpu, Shield, ExternalLink } from 'lucide-react';
import { getNetworkNodes, getNetworkEdges, getNetworkState, subscribeToNetwork } from '@/lib/networkStore';

const NODE_ICONS = {
  attacker:  Flame,
  firewall:  Shield,
  vm:        Server,
  internet:  Globe,
};

const NODE_ICON_OVERRIDES = {
  'web-server':          Globe,
  'windows-workstation': Monitor,
  'iot-device':          Cpu,
};

const STATUS_CONFIG = {
  healthy:      { color: '#22c55e', glow: 'rgba(34,197,94,0.35)',  ring: '#22c55e', label: 'Healthy',      pulse: false },
  warning:      { color: '#f59e0b', glow: 'rgba(245,158,11,0.35)', ring: '#f59e0b', label: 'Warning',      pulse: true  },
  under_attack: { color: '#f97316', glow: 'rgba(249,115,22,0.5)',  ring: '#f97316', label: 'Under Attack',  pulse: true  },
  critical:     { color: '#ef4444', glow: 'rgba(239,68,68,0.6)',   ring: '#ef4444', label: 'Critical',     pulse: true  },
  blocked:      { color: '#64748b', glow: 'rgba(100,116,139,0.2)', ring: '#64748b', label: 'Blocked',      pulse: false },
};

const EDGE_STATUS = {
  healthy:      '#1e293b',
  warning:      '#f59e0b44',
  under_attack: '#f9731644',
  critical:     '#ef444466',
};

function useNetworkState() {
  const [netState, setNetState] = useState(getNetworkState());
  useEffect(() => subscribeToNetwork(setNetState), []);
  return netState;
}

export default function NetworkTopology() {
  const netState = useNetworkState();
  const nodes = getNetworkNodes();
  const edges = getNetworkEdges();
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);
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

  const overallStatus = Object.values(netState.nodes).some(n => n.status === 'critical') ? 'critical' :
    Object.values(netState.nodes).some(n => n.status === 'under_attack') ? 'under_attack' :
    Object.values(netState.nodes).some(n => n.status === 'warning') ? 'warning' : 'healthy';

  const StatusIcon = overallStatus === 'healthy' ? ShieldCheck :
    overallStatus === 'warning' ? AlertTriangle : Flame;

  const statusCfg = STATUS_CONFIG[overallStatus];

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
        >
          <defs>
            {nodes.map(n => {
              const st = STATUS_CONFIG[nodeStatusOf(n.id)];
              return (
                <filter key={`glow-${n.id}`} id={`glow-${n.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feFlood floodColor={st.glow} result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="shadow" />
                  <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              );
            })}
          </defs>

          {/* Edges */}
          {edges.map((e, i) => {
            const from = nodes.find(n => n.id === e.from);
            const to = nodes.find(n => n.id === e.to);
            if (!from || !to) return null;
            const targetStatus = nodeStatusOf(e.to);
            const edgeColor = EDGE_STATUS[targetStatus] || EDGE_STATUS.healthy;
            const isActive = ['warning','under_attack','critical'].includes(targetStatus);
            return (
              <line
                key={i}
                x1={px(from.x)} y1={py(from.y)}
                x2={px(to.x)}   y2={py(to.y)}
                stroke={isActive ? STATUS_CONFIG[targetStatus].color : '#334155'}
                strokeWidth={isActive ? 1.5 : 1}
                strokeOpacity={isActive ? 0.6 : 0.3}
                strokeDasharray={isActive ? '4 3' : undefined}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const st = STATUS_CONFIG[nodeStatusOf(n.id)];
            const Icon = NODE_ICON_OVERRIDES[n.id] || NODE_ICONS[n.type] || Server;
            const cx = px(n.x);
            const cy = py(n.y);
            const r = n.type === 'firewall' ? 22 : 18;
            const isHov = hovered === n.id;
            const nodeData = netState.nodes[n.id];

            return (
              <g
                key={n.id}
                transform={`translate(${cx},${cy})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                filter={st.pulse || isHov ? `url(#glow-${n.id})` : undefined}
              >
                {/* Pulse ring */}
                {st.pulse && (
                  <circle r={r + 8} fill="none" stroke={st.color} strokeWidth="1" opacity="0.3">
                    <animate attributeName="r" values={`${r+4};${r+14};${r+4}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Main circle */}
                <circle
                  r={r}
                  fill="#0f172a"
                  stroke={st.color}
                  strokeWidth={isHov ? 2.5 : 1.5}
                />

                {/* Icon (using text as emoji fallback) */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={n.type === 'firewall' ? 13 : 11}
                  fill={st.color}
                  style={{ fontFamily: 'monospace', userSelect: 'none' }}
                >
                  {n.type === 'attacker'  ? '⚡' :
                   n.type === 'firewall'  ? '🛡' :
                   n.type === 'internet'  ? '🌐' :
                   n.id === 'iot-device'  ? '📡' :
                   n.id === 'windows-workstation' ? '💻' :
                   n.id === 'db-server'   ? '🗄' : '🖥'}
                </text>

                {/* Label */}
                <text
                  y={r + 13}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#94a3b8"
                  style={{ userSelect: 'none' }}
                >
                  {n.label}
                </text>
                <text
                  y={r + 22}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#475569"
                  style={{ userSelect: 'none', fontFamily: 'monospace' }}
                >
                  {n.ip}
                </text>

                {/* Tooltip on hover */}
                {isHov && nodeData && (
                  <g transform={`translate(${cx > dims.w * 0.7 ? -130 : 28}, -20)`}>
                    <rect x="0" y="0" width="120" height={nodeData.lastEvent ? 70 : 50} rx="6"
                      fill="#0f172a" stroke={st.color} strokeWidth="1" opacity="0.95" />
                    <text x="8" y="14" fontSize="8" fontWeight="bold" fill={st.color}>{st.label}</text>
                    {nodeData.label && (
                      <text x="8" y="26" fontSize="7" fill="#94a3b8">Attack: {nodeData.label}</text>
                    )}
                    <text x="8" y="38" fontSize="7" fill="#94a3b8">Attacks: {nodeData.attackCount}</text>
                    <text x="8" y="50" fontSize="7" fill="#94a3b8">Blocked: {nodeData.blockedCount}</text>
                    {nodeData.lastEvent && (
                      <text x="8" y="62" fontSize="6" fill="#475569">
                        {new Date(nodeData.lastEvent).toLocaleTimeString()}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

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