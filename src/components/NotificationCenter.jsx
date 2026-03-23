import React from 'react';
import { useNotification } from '@/lib/NotificationContext';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Sparkles } from 'lucide-react';

const typeStyles = {
  success: {
    bg: 'bg-primary/10 border-primary/30',
    icon: CheckCircle2,
    iconColor: 'text-primary',
  },
  error: {
    bg: 'bg-destructive/10 border-destructive/30',
    icon: AlertCircle,
    iconColor: 'text-destructive',
  },
  info: {
    bg: 'bg-accent/10 border-accent/30',
    icon: Info,
    iconColor: 'text-accent',
  },
  warning: {
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  badge: {
    bg: 'bg-purple-500/10 border-purple-500/30',
    icon: Sparkles,
    iconColor: 'text-purple-400',
  },
};

export default function NotificationCenter() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 pointer-events-none">
      {notifications.map(notification => {
        const style = typeStyles[notification.type] || typeStyles.info;
        const IconComponent = style.icon;

        return (
          <div
            key={notification.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm pointer-events-auto animate-in slide-in-from-bottom-4 duration-300 ${style.bg}`}
            role="alert"
          >
            <IconComponent className={`w-5 h-5 flex-shrink-0 ${style.iconColor}`} />
            <p className="text-sm font-medium text-foreground flex-1">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}