import React from 'react';
import { Menu, Search, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TopBar({ onMenuClick, userPoints, streak }) {
  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="w-5 h-5" />
      </Button>

      <div className="relative flex-1 max-w-md hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search rooms, paths..." className="pl-10 bg-secondary border-border h-9 text-sm" />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-foreground">{streak || 0}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">day streak</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
          <span className="text-sm font-bold text-primary">{userPoints || 0}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">points</span>
        </div>
      </div>
    </header>
  );
}