import React from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Zap, Map, GitBranch, ChevronRight } from 'lucide-react';

const ACTIONS = [
  {
    icon: Map,
    label: 'Learning Paths',
    desc: 'Structured courses for all levels',
    path: '/Paths',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20 hover:border-primary/40',
  },
  {
    icon: FlaskConical,
    label: 'Attack Sandbox',
    desc: 'AI-powered live attack simulation',
    path: '/Sandbox',
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20 hover:border-accent/40',
  },
  {
    icon: Zap,
    label: 'Attack Simulator',
    desc: 'Launch scripted attack scenarios',
    path: '/AttackSimulator',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-400/40',
  },
  {
    icon: GitBranch,
    label: 'Skill Tree',
    desc: 'Track your progression visually',
    path: '/SkillTree',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-400/40',
  },
];

export default function QuickActions() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-bold text-foreground mb-3">Quick Access</h3>
      <div className="space-y-2">
        {ACTIONS.map(a => (
          <Link
            key={a.path}
            to={a.path}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${a.bg}`}
          >
            <div className={`w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center shrink-0`}>
              <a.icon className={`w-4 h-4 ${a.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{a.label}</p>
              <p className="text-xs text-muted-foreground truncate">{a.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}