/**
 * Lightweight pub/sub store for sharing sandbox network state
 * with the Dashboard topology graph — no external dependencies.
 */

const NODES = [
  { id: 'attacker',           label: 'Attacker',            ip: '192.168.1.1',  type: 'attacker',  x: 0.5,  y: 0.08 },
  { id: 'firewall',           label: 'Firewall',            ip: '10.0.0.1',     type: 'firewall',  x: 0.5,  y: 0.28 },
  { id: 'web-server',         label: 'Web Server',          ip: '10.0.1.10',    type: 'vm',        x: 0.15, y: 0.60 },
  { id: 'db-server',          label: 'Database Server',     ip: '10.0.1.20',    type: 'vm',        x: 0.38, y: 0.60 },
  { id: 'windows-workstation',label: 'Win Workstation',     ip: '10.0.1.30',    type: 'vm',        x: 0.62, y: 0.60 },
  { id: 'iot-device',         label: 'IoT Device',          ip: '10.0.1.40',    type: 'vm',        x: 0.85, y: 0.60 },
  { id: 'internet',           label: 'Internet',            ip: 'WAN',          type: 'internet',  x: 0.5,  y: 0.92 },
];

const EDGES = [
  { from: 'attacker',  to: 'firewall' },
  { from: 'firewall',  to: 'web-server' },
  { from: 'firewall',  to: 'db-server' },
  { from: 'firewall',  to: 'windows-workstation' },
  { from: 'firewall',  to: 'iot-device' },
  { from: 'internet',  to: 'firewall' },
];

// status: 'healthy' | 'warning' | 'critical' | 'under_attack' | 'blocked'
const defaultStatus = () => ({
  status: 'healthy',
  label: '',
  attackCount: 0,
  blockedCount: 0,
  lastEvent: null,
});

let state = {
  nodes: Object.fromEntries(NODES.map(n => [n.id, defaultStatus()])),
  activeAttack: null,
  lastUpdated: null,
};

const listeners = new Set();

export function getNetworkNodes() { return NODES; }
export function getNetworkEdges() { return EDGES; }

export function getNetworkState() { return state; }

export function subscribeToNetwork(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach(fn => fn({ ...state }));
}

export function updateNodeStatus(nodeId, patch) {
  state = {
    ...state,
    nodes: {
      ...state.nodes,
      [nodeId]: { ...state.nodes[nodeId], ...patch },
    },
    lastUpdated: new Date().toISOString(),
  };
  notify();
}

export function setActiveAttack(attack) {
  state = { ...state, activeAttack: attack, lastUpdated: new Date().toISOString() };
  notify();
}

export function applyAttackMetrics(targetId, metrics, attackName) {
  const alertLevel = metrics?.alert_level || 'low';
  const status =
    alertLevel === 'critical' ? 'critical' :
    alertLevel === 'high'     ? 'under_attack' :
    alertLevel === 'medium'   ? 'warning' : 'healthy';

  updateNodeStatus(targetId, {
    status,
    label: attackName,
    attackCount: (state.nodes[targetId]?.attackCount || 0) + (metrics?.connections_attempted || 0),
    blockedCount: (state.nodes[targetId]?.blockedCount || 0) + (metrics?.blocked_count || 0),
    lastEvent: new Date().toISOString(),
  });

  // Firewall reflects overall threat
  const worstStatus = Object.values(state.nodes)
    .filter(n => n.status !== 'healthy')
    .map(n => n.status);

  const fwStatus = worstStatus.includes('critical') ? 'critical' :
                   worstStatus.includes('under_attack') ? 'warning' : 'healthy';
  updateNodeStatus('firewall', { status: fwStatus });
}

export function resetNetwork() {
  state = {
    nodes: Object.fromEntries(NODES.map(n => [n.id, defaultStatus()])),
    activeAttack: null,
    lastUpdated: null,
  };
  notify();
}