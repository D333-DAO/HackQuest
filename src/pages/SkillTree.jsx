import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Lock, CheckCircle2, Zap, ChevronRight, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SkillNode from '@/components/skilltree/SkillNode';
import SkillTreeConnectors from '@/components/skilltree/SkillTreeConnectors';

// Static skill tree definition: domains, tiers, unlock requirements
const SKILL_DOMAINS = [
  {
    id: 'linux',
    label: 'Linux Fundamentals',
    color: 'from-emerald-500/20 to-emerald-500/5',
    borderColor: 'border-emerald-500/30',
    accentColor: '#10b981',
    icon: '🐧',
    tiers: [
      { id: 'linux-1', title: 'Linux Basics', points: 0, category: 'linux', tier: 1, description: 'File system, permissions, and shell basics.' },
      { id: 'linux-2', title: 'Bash Scripting', points: 100, category: 'linux', tier: 2, description: 'Automate tasks with shell scripts.' },
      { id: 'linux-3', title: 'Linux Privilege Escalation', points: 250, category: 'privilege_escalation', tier: 3, description: 'Escalate from low to root.' },
    ],
  },
  {
    id: 'networking',
    label: 'Networking',
    color: 'from-sky-500/20 to-sky-500/5',
    borderColor: 'border-sky-500/30',
    accentColor: '#0ea5e9',
    icon: '🌐',
    tiers: [
      { id: 'net-1', title: 'Network Basics', points: 0, category: 'networking', tier: 1, description: 'TCP/IP, ports, and protocols.' },
      { id: 'net-2', title: 'Nmap Scanning', points: 150, category: 'networking', tier: 2, description: 'Host discovery and service enumeration.' },
      { id: 'net-3', title: 'Traffic Analysis', points: 300, category: 'networking', tier: 3, description: 'Packet capture and Wireshark.' },
    ],
  },
  {
    id: 'web',
    label: 'Web Hacking',
    color: 'from-violet-500/20 to-violet-500/5',
    borderColor: 'border-violet-500/30',
    accentColor: '#8b5cf6',
    icon: '🕸️',
    tiers: [
      { id: 'web-1', title: 'Web Fundamentals', points: 0, category: 'web_hacking', tier: 1, description: 'HTTP, cookies, and web tech.' },
      { id: 'web-2', title: 'Burp Suite & OWASP', points: 200, category: 'web_hacking', tier: 2, description: 'Intercept, scan, and exploit web apps.' },
      { id: 'web-3', title: 'Advanced Web Attacks', points: 400, category: 'web_hacking', tier: 3, description: 'SQLi, XSS, SSRF, and more.' },
    ],
  },
  {
    id: 'exploitation',
    label: 'Exploitation',
    color: 'from-rose-500/20 to-rose-500/5',
    borderColor: 'border-rose-500/30',
    accentColor: '#f43f5e',
    icon: '💥',
    tiers: [
      { id: 'exp-1', title: 'Vulnerability Basics', points: 100, category: 'other', tier: 1, description: 'CVEs, CVSS, and patching.' },
      { id: 'exp-2', title: 'Metasploit Framework', points: 300, category: 'other', tier: 2, description: 'Automated exploitation with MSF.' },
      { id: 'exp-3', title: 'Custom Exploits', points: 600, category: 'other', tier: 3, description: 'Buffer overflows and shellcode.' },
    ],
  },
  {
    id: 'crypto',
    label: 'Cryptography',
    color: 'from-amber-500/20 to-amber-500/5',
    borderColor: 'border-amber-500/30',
    accentColor: '#f59e0b',
    icon: '🔐',
    tiers: [
      { id: 'cry-1', title: 'Crypto Basics', points: 0, category: 'cryptography', tier: 1, description: 'Hashing, symmetric & asymmetric keys.' },
      { id: 'cry-2', title: 'Breaking Weak Crypto', points: 200, category: 'cryptography', tier: 2, description: 'Hash cracking and padding attacks.' },
      { id: 'cry-3', title: 'PKI & TLS', points: 450, category: 'cryptography', tier: 3, description: 'Certificates, TLS, and trust chains.' },
    ],
  },
];

export default function SkillTree() {
  const [selectedNode, setSelectedNode] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: progress = [] } = useQuery({
    queryKey: ['my-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const totalPoints = progress.reduce((sum, p) => sum + (p.points_earned || 0), 0);
  const completedRoomIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));

  // For each node, find matching rooms and compute completion
  const nodeStats = useMemo(() => {
    const stats = {};
    for (const domain of SKILL_DOMAINS) {
      for (const node of domain.tiers) {
        const matchingRooms = rooms.filter(r => r.category === node.category);
        const completedCount = matchingRooms.filter(r => completedRoomIds.has(r.id)).length;
        stats[node.id] = {
          total: matchingRooms.length,
          completed: completedCount,
          rooms: matchingRooms,
        };
      }
    }
    return stats;
  }, [rooms, completedRoomIds]);

  const isNodeUnlocked = (node) => totalPoints >= node.points;
  const isNodeComplete = (node) => {
    const s = nodeStats[node.id];
    return s && s.total > 0 && s.completed >= s.total;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <Star className="w-7 h-7 text-primary" /> Skill Tree
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Unlock new domains as you earn points and complete rooms.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">{totalPoints} pts</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {[
          { color: 'bg-primary', label: 'Completed' },
          { color: 'bg-accent', label: 'Unlocked' },
          { color: 'bg-secondary', label: 'Locked' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${l.color}`} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Domains */}
      <div className="space-y-6">
        {SKILL_DOMAINS.map((domain) => (
          <div
            key={domain.id}
            className={`bg-gradient-to-r ${domain.color} border ${domain.borderColor} rounded-2xl p-5`}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{domain.icon}</span>
              <h2 className="font-semibold text-foreground">{domain.label}</h2>
            </div>

            {/* Tier nodes in a horizontal chain */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {domain.tiers.map((node, idx) => {
                const unlocked = isNodeUnlocked(node);
                const complete = isNodeComplete(node);
                const stats = nodeStats[node.id] || { total: 0, completed: 0, rooms: [] };
                return (
                  <React.Fragment key={node.id}>
                    <SkillNode
                      node={node}
                      unlocked={unlocked}
                      complete={complete}
                      stats={stats}
                      accentColor={domain.accentColor}
                      selected={selectedNode === node.id}
                      onSelect={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                    />
                    {idx < domain.tiers.length - 1 && (
                      <ChevronRight
                        className="w-5 h-5 flex-shrink-0 hidden sm:block"
                        style={{ color: unlocked ? domain.accentColor : 'hsl(var(--muted-foreground))' }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected node detail panel */}
      {selectedNode && (() => {
        const domain = SKILL_DOMAINS.find(d => d.tiers.some(t => t.id === selectedNode));
        const node = domain?.tiers.find(t => t.id === selectedNode);
        const stats = nodeStats[selectedNode] || { rooms: [] };
        const unlocked = node && isNodeUnlocked(node);
        if (!node) return null;
        return (
          <div className={`bg-card border ${domain.borderColor} rounded-2xl p-6 space-y-4`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">{node.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
              </div>
              {!unlocked && (
                <div className="flex items-center gap-1.5 text-xs bg-secondary px-3 py-1.5 rounded-lg text-muted-foreground">
                  <Lock className="w-3 h-3" /> Requires {node.points} pts
                </div>
              )}
            </div>

            {stats.rooms.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Related Rooms</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stats.rooms.map(room => {
                    const done = completedRoomIds.has(room.id);
                    return (
                      <Link
                        key={room.id}
                        to={`/RoomDetail?id=${room.id}`}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          done
                            ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                            : unlocked
                            ? 'bg-secondary/50 border-border hover:bg-secondary'
                            : 'bg-secondary/30 border-border opacity-50 pointer-events-none'
                        }`}
                      >
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          : <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        }
                        <span className="text-sm font-medium text-foreground flex-1 truncate">{room.title}</span>
                        <Badge variant="outline" className="text-xs">{room.points} pts</Badge>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No rooms mapped to this skill yet.</p>
            )}
          </div>
        );
      })()}
    </div>
  );
}