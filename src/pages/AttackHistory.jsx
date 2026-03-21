import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, History, ShieldX, ShieldCheck, ShieldAlert, RefreshCw, Zap, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';

const STATUS_CONFIG = {
  success: {
    label: 'Breached',
    icon: ShieldX,
    classes: 'bg-destructive/15 text-destructive border-destructive/30',
    dot: 'bg-destructive',
  },
  partial: {
    label: 'Partial',
    icon: ShieldAlert,
    classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  blocked: {
    label: 'Blocked',
    icon: ShieldCheck,
    classes: 'bg-primary/15 text-primary border-primary/30',
    dot: 'bg-primary',
  },
};

const SEVERITY_CLASSES = {
  critical: 'bg-destructive/20 text-destructive border-destructive/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-primary/20 text-primary border-primary/30',
};

export default function AttackHistory() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const { data: logs = [], isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['attack-logs'],
    queryFn: () => base44.entities.AttackLog.list('-created_date', 200),
    refetchInterval: 10000,
  });

  const filtered = logs.filter(l => {
    const statusOk = statusFilter === 'all' || l.status === statusFilter;
    const sevOk = severityFilter === 'all' || l.scenario_severity === severityFilter;
    return statusOk && sevOk;
  });

  // Summary stats
  const total = logs.length;
  const breached = logs.filter(l => l.status === 'success').length;
  const blocked = logs.filter(l => l.status === 'blocked').length;
  const partial = logs.filter(l => l.status === 'partial').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Link to="/AttackSimulator" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Attack Simulator
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="w-6 h-6 text-accent" />
            Attack History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live historical log of all executed attack simulations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Updated {dataUpdatedAt ? formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true }) : '—'}
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Link to="/AttackSimulator">
            <Button size="sm" className="gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Run Simulation
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Runs', value: total, color: 'text-foreground', bg: 'bg-secondary/50' },
          { label: 'Breached', value: breached, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Partial', value: partial, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Blocked', value: blocked, color: 'text-primary', bg: 'bg-primary/10' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border border-border rounded-2xl px-5 py-4`}>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1 bg-secondary/50 border border-border rounded-xl p-1">
          {['all', 'success', 'partial', 'blocked'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${statusFilter === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {s === 'all' ? 'All Status' : s === 'success' ? 'Breached' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-secondary/50 border border-border rounded-xl p-1">
          {['all', 'critical', 'high', 'medium'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${severityFilter === sev ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {sev === 'all' ? 'All Severity' : sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Log table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Simulation Log</span>
          <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading history...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <History className="w-10 h-10 opacity-30" />
            <p className="text-sm">No attack logs found.</p>
            <Link to="/AttackSimulator">
              <Button size="sm" variant="outline" className="gap-1.5 mt-1">
                <Zap className="w-3.5 h-3.5" /> Run your first simulation
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Table header */}
            <div className="hidden lg:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr] gap-4 px-5 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span>Scenario</span>
              <span>Target</span>
              <span>Severity</span>
              <span>Status</span>
              <span>Metrics</span>
              <span>Time</span>
            </div>

            {filtered.map(log => {
              const status = STATUS_CONFIG[log.status] || STATUS_CONFIG.partial;
              const StatusIcon = status.icon;
              return (
                <div key={log.id} className="grid grid-cols-1 lg:grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr] gap-2 lg:gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors">
                  {/* Scenario */}
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{log.scenario_icon || '💀'}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{log.scenario_name}</p>
                      <p className="text-xs text-muted-foreground">{log.scenario_category}</p>
                    </div>
                  </div>

                  {/* Target */}
                  <div className="flex flex-col justify-center">
                    <p className="text-sm text-foreground font-medium">{log.target_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{log.target_ip}</p>
                  </div>

                  {/* Severity */}
                  <div className="flex items-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_CLASSES[log.scenario_severity] || SEVERITY_CLASSES.medium}`}>
                      {(log.scenario_severity || 'medium').toUpperCase()}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${status.classes}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-primary font-mono" title="Blocked">🛡 {log.blocked_count ?? 0}</span>
                    <span className="text-amber-400 font-mono" title="Detected">🔍 {log.detected_count ?? 0}</span>
                    <span className="text-accent font-mono" title="Connections">🔗 {log.connections_attempted ?? 0}</span>
                  </div>

                  {/* Time */}
                  <div className="flex flex-col justify-center">
                    <p className="text-xs text-foreground">
                      {log.created_date ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true }) : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {log.created_date ? format(new Date(log.created_date), 'MMM d, HH:mm:ss') : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}