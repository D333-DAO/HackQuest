import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Flame, Trophy, Search, Menu, X, LayoutDashboard, Map, Server, GitBranch, FlaskConical, Zap, Wrench, History, User, ChevronDown, Swords, Brain, Bookmark } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',       path: '/Dashboard',        icon: LayoutDashboard },
  { label: 'Learn',           path: '/Paths',             icon: Map },
  { label: 'Rooms',           path: '/Rooms',             icon: Server },
  { label: 'Skill Tree',      path: '/SkillTree',         icon: GitBranch },
  { label: 'Practice',        children: [
    { label: 'Sandbox',         path: '/Sandbox',           icon: FlaskConical },
    { label: 'Attack Simulator',path: '/AttackSimulator',   icon: Zap },
    { label: 'Scenario Builder',path: '/ScenarioBuilder',   icon: Wrench },
    { label: 'Attack History',  path: '/AttackHistory',     icon: History },
    { label: 'MITRE Builder',   path: '/MitreScenarioBuilder', icon: Swords },
    { label: 'Quiz Engine',     path: '/QuizEngine',            icon: Brain },
  ]},
  { label: 'Saved Spot',      path: '/SavedQuizzes',      icon: Bookmark },
  { label: 'Leaderboard',     path: '/Leaderboard',       icon: Trophy },
];

function NavLink({ item, mobile, onClose }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (item.children) {
    const isActive = item.children.some(c => location.pathname === c.path);
    return (
      <div className="relative" onMouseEnter={() => !mobile && setOpen(true)} onMouseLeave={() => !mobile && setOpen(false)}>
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {item.label}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className={`${mobile ? 'relative mt-1 ml-4' : 'absolute top-full left-0 z-50 pt-2'} min-w-[200px]`}>
          <div className={`${mobile ? '' : 'bg-card border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden'} py-1`}>
            {item.children.map(child => (
              <Link
                key={child.path}
                to={child.path}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  location.pathname === child.path
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <child.icon className="w-4 h-4" />
                {child.label}
              </Link>
            ))}
          </div>
          </div>
        )}
      </div>
    );
  }

  const isActive = location.pathname === item.path;
  return (
    <Link
      to={item.path}
      onClick={onClose}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {item.label}
    </Link>
  );
}

export default function TopNav({ user, userPoints, streak }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-sidebar/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="flex items-center h-14 gap-4">
            {/* Logo */}
            <Link to="/Dashboard" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-primary-foreground" style={{ width: 18, height: 18 }} />
              </div>
              <span className="text-base font-black text-foreground tracking-tight hidden sm:block">
                TryHack<span className="text-primary">Me</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {NAV_ITEMS.map(item => (
                <NavLink key={item.label} item={item} />
              ))}
            </nav>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-2">
              {/* Search */}
              <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Search className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-xs">Search rooms...</span>
              </button>

              {/* Streak */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold text-foreground">{streak || 0}</span>
              </div>

              {/* Points */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">{(userPoints || 0).toLocaleString()}</span>
              </div>

              {/* Avatar */}
              <Link to="/Profile" className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center hover:border-primary transition-colors">
                <span className="text-sm font-bold text-primary">
                  {user?.full_name ? user.full_name[0].toUpperCase() : <User className="w-4 h-4" />}
                </span>
              </Link>

              {/* Mobile burger */}
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
                onClick={() => setMobileOpen(o => !o)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-sidebar px-4 py-3 space-y-1">
            {NAV_ITEMS.map(item => (
              <NavLink key={item.label} item={item} mobile onClose={() => setMobileOpen(false)} />
            ))}
          </div>
        )}
      </header>
    </>
  );
}