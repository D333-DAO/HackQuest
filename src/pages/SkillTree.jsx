import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Lock, CheckCircle2, Zap, Star, ArrowRight, Target, Trophy, TrendingUp, ChevronRight, Flame } from 'lucide-react';
import SkillNode from '@/components/skilltree/SkillNode';
import NextPathPanel from '@/components/skilltree/NextPathPanel';

export const SKILL_DOMAINS = [
  {
    id: 'linux',
    label: 'Linux Fundamentals',
    icon: '🐧',
    accentColor: '#10b981',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/5',
    tiers: [
      { id: 'linux-1', title: 'Linux Basics',                points: 0,   category: 'linux',               tier: 1, description: 'File system, permissions, and shell basics.' },
      { id: 'linux-2', title: 'Bash Scripting',              points: 100, category: 'linux',               tier: 2, description: 'Automate tasks with shell scripts.' },
      { id: 'linux-3', title: 'Linux Privilege Escalation',  points: 250, category: 'privilege_escalation', tier: 3, description: 'Escalate from low-privilege user to root.' },
    ],
  },
  {
    id: 'networking',
    label: 'Networking',
    icon: '🌐',
    accentColor: '#0ea5e9',
    borderColor: 'border-sky-500/30',
    bgColor: 'bg-sky-500/5',
    tiers: [
      { id: 'net-1', title: 'Network Basics',    points: 0,   category: 'networking', tier: 1, description: 'TCP/IP, ports, routing, and protocols.' },
      { id: 'net-2', title: 'Nmap Scanning',      points: 150, category: 'networking', tier: 2, description: 'Host discovery and service enumeration.' },
      { id: 'net-3', title: 'Traffic Analysis',   points: 300, category: 'networking', tier: 3, description: 'Packet capture and Wireshark deep-dive.' },
    ],
  },
  {
    id: 'web',
    label: 'Web Hacking',
    icon: '🕸️',
    accentColor: '#8b5cf6',
    borderColor: 'border-violet-500/30',
    bgColor: 'bg-violet-500/5',
    tiers: [
      { id: 'web-1', title: 'Web Fundamentals',     points: 0,   category: 'web_hacking', tier: 1, description: 'HTTP, cookies, and browser mechanics.' },
      { id: 'web-2', title: 'Burp Suite & OWASP',   points: 200, category: 'web_hacking', tier: 2, description: 'Intercept, scan, and exploit web apps.' },
      { id: 'web-3', title: 'Advanced Web Attacks',  points: 400, category: 'web_hacking', tier: 3, description: 'SQLi, XSS, SSRF, deserialization.' },
    ],
  },
  {
    id: 'exploitation',
    label: 'Exploitation',
    icon: '💥',
    accentColor: '#f43f5e',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/5',
    tiers: [
      { id: 'exp-1', title: 'Vulnerability Basics', points: 100, category: 'other', tier: 1, description: 'CVEs, CVSS scoring, and patch management.' },
      { id: 'exp-2', title: 'Metasploit Framework', points: 300, category: 'other', tier: 2, description: 'Automated exploitation with MSF.' },
      { id: 'exp-3', title: 'Custom Exploits',       points: 600, category: 'other', tier: 3, description: 'Buffer overflows and shellcode writing.' },
    ],
  },
  {
    id: 'crypto',
    label: 'Cryptography',
    icon: '🔐',
    accentColor: '#f59e0b',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/5',
    tiers: [
      { id: 'cry-1', title: 'Crypto Basics',        points: 0,   category: 'cryptography', tier: 1, description: 'Hashing, symmetric and asymmetric keys.' },
      { id: 'cry-2', title: 'Breaking Weak Crypto',  points: 200, category: 'cryptography', tier: 2, description: 'Hash cracking and padding oracle attacks.' },
      { id: 'cry-3', title: 'PKI & TLS',             points: 450, category: 'cryptography', tier: 3, description: 'Certificates, TLS handshake, and trust chains.' },
    ],
  },
  {
    id: 'forensics',
    label: 'Forensics & OSINT',
    icon: '🔍',
    accentColor: '#06b6d4',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/5',
    tiers: [
      { id: 'for-1', title: 'OSINT Basics',      points: 0,   category: 'osint',     tier: 1, description: 'Open source intelligence gathering.' },
      { id: 'for-2', title: 'Digital Forensics', points: 200, category: 'forensics', tier: 2, description: 'Disk images, memory dumps, log analysis.' },
      { id: 'for-3', title: 'Reverse Engineering', points: 500, category: 'reverse_engineering', tier: 3, description: 'Disassembly, deobfuscation, and binary analysis.' },
    ],
  },
];

// Rank thresholds
const RANKS = [
  { label: 'Newbie',      min: 0,    color: '#64748b', icon: '🔰' },
  { label: 'Script Kiddie', min: 100,  color: '#22c55e', icon: '💻' },
  { label: 'Hacker',      min: 400,  color: '#0ea5e9', icon: '🎯' },
  { label: 'Pro Hacker',  min: 800,  color: '#8b5cf6', icon: '⚡' },
  { label: 'Elite',       min: 1500, color: '#f59e0b', icon: '🏆' },
  { label: 'Legend',      min: 3000, color: '#f43f5e', icon: '💀' },
];

function getRank(pts) {
  return [...RANKS].reverse().find(r => pts >= r.min) || RANKS[0];
}

export default function SkillTree() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedDomain, setExpandedDomain] = useState(null);

  const { data: user }      = useQuery({ queryKey: ['me'],      queryFn: () => base44.auth.me() });
  const { data: progress = [] } = useQuery({
    queryKey: ['my-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const totalPoints    = progress.reduce((sum, p) => sum + (p.points_earned || 0), 0);
  const completedRoomIds = new Set(progress.filter(p => p.completed).map(p => p.room_id));
  const rank           = getRank(totalPoints);

  // compute per-node stats
  const nodeStats = useMemo(() => {
    const stats = {};
    for (const domain of SKILL_DOMAINS) {
      for (const node of domain.tiers) {
        const matching  = rooms.filter(r => r.category === node.category);
        const completed = matching.filter(r => completedRoomIds.has(r.id)).length;
        stats[node.id]  = { total: matching.length, completed, rooms: matching };
      }
    }
    return stats;
  }, [rooms, completedRoomIds]);

  const isUnlocked = (node) => totalPoints >= node.points;
  const isComplete = (node) => {
    const s = nodeStats[node.id];
    return s && s.total > 0 && s.completed >= s.total;
  };

  // Overall progress
  const allNodes    = SKILL_DOMAINS.flatMap(d => d.tiers);
  const unlockedCount = allNodes.filter(isUnlocked).length;
  const completedCount = allNodes.filter(isComplete).length;
  const overallPct = Math.round((completedCount / allNodes.length) * 100);

  const selectedDomain = selectedNode ? SKILL_DOMAINS.find(d => d.tiers.some(t => t.id === selectedNode)) : null;
  const selectedNodeData = selectedDomain?.tiers.find(t => t.id === selectedNode);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 min-h-screen">

      {/* ── Hero Header ── */}
      <div className="relative bg-card border border-border rounded-2xl overflow-hidden px-6 py-5">
        {/* decorative bg */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(134,239,172,0.06) 0%, transparent 60%)' }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
              <Star className="w-7 h-7 text-primary" /> Skill Tree
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track your mastery across cybersecurity domains. Earn points to unlock new skills.
            </p>
          </div>

          {/* Rank badge + stats */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border" style={{ borderColor: rank.color + '40', background: rank.color + '10' }}>
              <span className="text-xl">{rank.icon}</span>
              <div>
                <p className="text-xs text-muted-foreground leading-none">Rank</p>
                <p className="text-sm font-bold leading-tight" style={{ color: rank.color }}>{rank.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground leading-none">Total XP</p>
                <p className="text-sm font-bold text-primary leading-tight">{totalPoints.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs text-muted-foreground leading-none">Completed</p>
                <p className="text-sm font-bold text-foreground leading-tight">{completedCount}/{allNodes.length} skills</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="relative mt-4 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Overall mastery</span>
            <span className="font-mono text-primary">{overallPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%`, background: 'hsl(var(--primary))' }}
            />
          </div>
        </div>
      </div>

      {/* ── Next Steps Panel ── */}
      <NextPathPanel
        allNodes={allNodes}
        nodeStats={nodeStats}
        totalPoints={totalPoints}
        isUnlocked={isUnlocked}
        isComplete={isComplete}
        rooms={rooms}
        completedRoomIds={completedRoomIds}
        domains={SKILL_DOMAINS}
      />

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-5 text-xs text-muted-foreground px-1">
        {[
          { dot: 'bg-primary', label: 'Completed' },
          { dot: 'bg-accent', label: 'Unlocked & In Progress' },
          { dot: 'bg-secondary border border-border', label: 'Locked' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${l.dot}`} />
            {l.label}
          </div>
        ))}
      </div>

      {/* ── Domain rows ── */}
      <div className="space-y-4">
        {SKILL_DOMAINS.map((domain) => {
          const domainComplete = domain.tiers.every(isComplete);
          const domainUnlocked = domain.tiers.some(isUnlocked);
          const domainProgress = domain.tiers.filter(isComplete).length;

          return (
            <div key={domain.id} className={`border ${domain.borderColor} ${domain.bgColor} rounded-2xl overflow-hidden`}>
              {/* Domain header */}
              <button
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
                onClick={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}
              >
                <span className="text-xl">{domain.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-foreground">{domain.label}</h2>
                    {domainComplete && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                        MASTERED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {domainProgress}/{domain.tiers.length} skills completed
                  </p>
                </div>
                {/* Mini progress */}
                <div className="hidden sm:flex items-center gap-2 mr-3">
                  <div className="w-20 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(domainProgress / domain.tiers.length) * 100}%`, background: domain.accentColor }}
                    />
                  </div>
                  <span className="text-xs font-mono" style={{ color: domain.accentColor }}>
                    {Math.round((domainProgress / domain.tiers.length) * 100)}%
                  </span>
                </div>
                <ChevronRight
                  className="w-4 h-4 text-muted-foreground transition-transform"
                  style={{ transform: expandedDomain === domain.id ? 'rotate(90deg)' : 'rotate(0deg)' }}
                />
              </button>

              {/* Tier chain — always visible as compact dots, or expanded full cards */}
              <div className={`px-5 pb-5 ${expandedDomain !== domain.id ? 'pt-0' : 'pt-2'}`}>
                {/* Compact view: always show mini progress chain */}
                {expandedDomain !== domain.id && (
                  <div className="flex items-center gap-2 pb-1">
                    {domain.tiers.map((node, idx) => {
                       const unlocked = isUnlocked(node);
                       const complete = isComplete(node);
                       return (
                         <div key={node.id} className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedDomain(domain.id); setSelectedNode(node.id); }}
                            className="flex flex-col items-center gap-1 group"
                            title={node.title}
                          >
                            <div
                              className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110"
                              style={{
                                borderColor: complete ? '#86efac' : unlocked ? domain.accentColor : '#334155',
                                background: complete ? 'rgba(134,239,172,0.15)' : unlocked ? `${domain.accentColor}15` : 'rgba(51,65,85,0.4)',
                              }}
                            >
                              {complete ? (
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              ) : unlocked ? (
                                <Zap className="w-3.5 h-3.5" style={{ color: domain.accentColor }} />
                              ) : (
                                <Lock className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                            <span className="text-[9px] text-muted-foreground text-center max-w-[56px] leading-tight hidden sm:block">
                              {node.title.split(' ').slice(0, 2).join(' ')}
                            </span>
                          </button>
                          {idx < domain.tiers.length - 1 && (
                            <div className="flex-1 h-0.5 rounded-full"
                              style={{ background: isUnlocked(domain.tiers[idx + 1]) ? `${domain.accentColor}40` : '#1e293b' }}
                            />
                          )}
                          </div>
                      );
                    })}
                  </div>
                )}

                {/* Expanded view: full node cards */}
                {expandedDomain === domain.id && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 mt-2">
                    {domain.tiers.map((node, idx) => {
                       const unlocked = isUnlocked(node);
                       const complete = isComplete(node);
                       const stats    = nodeStats[node.id] || { total: 0, completed: 0, rooms: [] };
                       return (
                         <div key={node.id} className="flex flex-col items-stretch">
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
                            <div className="hidden sm:flex items-center justify-center self-center">
                              <ArrowRight
                                className="w-5 h-5 flex-shrink-0"
                                style={{ color: isUnlocked(domain.tiers[idx + 1]) ? domain.accentColor : '#334155' }}
                              />
                            </div>
                          )}
                          </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected node room panel */}
              {expandedDomain === domain.id && selectedNode && selectedDomain?.id === domain.id && selectedNodeData && (() => {
                const stats    = nodeStats[selectedNode] || { rooms: [] };
                const unlocked = isUnlocked(selectedNodeData);
                return (
                  <div className="mx-5 mb-5 bg-card border border-border rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{selectedNodeData.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedNodeData.description}</p>
                      </div>
                      {!unlocked && (
                        <span className="shrink-0 text-xs bg-secondary border border-border px-2.5 py-1 rounded-lg text-muted-foreground flex items-center gap-1">
                          <Lock className="w-3 h-3" /> {selectedNodeData.points} pts to unlock
                        </span>
                      )}
                    </div>
                    {stats.rooms.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {stats.rooms.map(room => {
                          const done = completedRoomIds.has(room.id);
                          return (
                            <Link
                              key={room.id}
                              to={`/RoomDetail?id=${room.id}`}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                                done
                                  ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                                  : unlocked
                                  ? 'bg-secondary/50 border-border hover:bg-secondary'
                                  : 'bg-secondary/20 border-border/40 opacity-40 pointer-events-none'
                              }`}
                            >
                              {done
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                              }
                              <span className="flex-1 font-medium text-foreground truncate text-xs">{room.title}</span>
                              <span className="text-xs text-muted-foreground font-mono">{room.points}pt</span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No rooms mapped to this skill yet.</p>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}