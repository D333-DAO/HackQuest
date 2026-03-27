import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Zap, User } from 'lucide-react';

const BOTTOM_NAV_ITEMS = [
  { label: 'Dashboard', path: '/Dashboard', icon: LayoutDashboard },
  { label: 'Learn',     path: '/Paths',     icon: Map },
  { label: 'Practice', path: '/Sandbox',   icon: Zap },
  { label: 'Profile',  path: '/Profile',   icon: User },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-t border-border flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {BOTTOM_NAV_ITEMS.map(({ label, path, icon: Icon }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}