import React, { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Zap, User } from 'lucide-react';

const BOTTOM_NAV_ITEMS = [
  { label: 'Dashboard', path: '/Dashboard', icon: LayoutDashboard },
  { label: 'Learn',     path: '/Paths',     icon: Map },
  { label: 'Practice', path: '/Sandbox',   icon: Zap },
  { label: 'Profile',  path: '/Profile',   icon: User },
];

/**
 * Each tab remembers the last path the user was on within its "section".
 * Tapping a tab that is already active goes back to its root path.
 */
export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Persist the last visited path per tab root
  const tabHistory = useRef({});
  BOTTOM_NAV_ITEMS.forEach(({ path }) => {
    if (!tabHistory.current[path]) tabHistory.current[path] = path;
  });

  // Determine which tab is "active" based on current path prefix
  const activeRoot = BOTTOM_NAV_ITEMS.find(item =>
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  )?.path;

  // Track current location into the correct tab bucket
  if (activeRoot) {
    tabHistory.current[activeRoot] = location.pathname + location.search;
  }

  const handleTabPress = (path) => {
    if (activeRoot === path) {
      // Already on this tab — go to its root (scroll-to-top equivalent)
      navigate(path);
    } else {
      // Restore last known location in this tab
      navigate(tabHistory.current[path] || path);
    }
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-t border-border flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {BOTTOM_NAV_ITEMS.map(({ label, path, icon: Icon }) => {
        const isActive = activeRoot === path;
        return (
          <button
            key={path}
            onClick={() => handleTabPress(path)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}