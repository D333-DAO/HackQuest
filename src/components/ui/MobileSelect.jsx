import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Check } from 'lucide-react';

function useIsMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 1024;
}

/**
 * Drop-in replacement for Select that uses a bottom-sheet Drawer on mobile.
 * Props: value, onValueChange, placeholder, options: [{value, label}], triggerClassName
 */
export function MobileSelect({ value, onValueChange, placeholder, options = [], triggerClassName }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder ?? value;

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-between px-3 py-2 rounded-md border border-input bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring ${triggerClassName || ''}`}
      >
        <span>{selectedLabel}</span>
        <svg className="ml-2 w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{placeholder || 'Select an option'}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-1">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onValueChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-colors ${
                  value === opt.value
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                {opt.label}
                {value === opt.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}