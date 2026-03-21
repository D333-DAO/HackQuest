import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Server, Trophy, User, X, Shield, GitBranch, FlaskConical, Zap, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Dashboard', path: '/Dashboard', icon: LayoutDashboard },
  { label: 'Skill Tree', path: '/SkillTree', icon: GitBranch },
  { label: 'Learning Paths', path: '/Paths', icon: Map },
  { label: 'Rooms', path: '/Rooms', icon: Server },
  { label: 'Sandbox', path: '/Sandbox', icon: FlaskConical },
  { label: 'Attack Simulator', path: '/AttackSimulator', icon: Zap },
  { label: 'Leaderboard', path: '/Leaderboard', icon: Trophy },
  { label: 'Profile', path: '/Profile', icon: User },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">TryHackMe</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Cyber Training</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-xs text-primary font-semibold mb-1">Go Premium</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">Unlock all rooms and learning paths</p>
        </div>
      </aside>
    </>
  );
}