import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, Bug, Shield, Target, Activity } from 'lucide-react';

const OUTCOME_STYLE = {
  success:  { color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/20',   icon: XCircle,       label: 'Attacker Succeeded' },
  partial:  { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Partial Compromise'  },
  blocked:  { color: 'text-primary',   bg: 'bg-primary/10',   border: 'border-primary/20',   icon: CheckCircle2,  label: 'Attack Blocked'      },
};

const TECH_OUTCOME_STYLE = {
  success: { color: 'text-red-400',   dot: 'bg-red-400' },
  partial: { color: 'text-amber-400', dot: 'bg-amber-400' },
  blocked: { color: 'text-primary',   dot: 'bg-primary' },
  detected:{ color: 'text-cyan-400',  dot: 'bg-cyan-400' },
};

function TechniqueResult({ result, index }) {
  const [open, setOpen] = useState(false);
  const style = TECH_OUTCOME_STYLE[result.outcome?.toLowerCase()] || TECH_OUTCOME_STYLE.partial;

  return (
    <div className="rounded-xl border border-border bg-secondary/20 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors"
      >
        <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{index + 1}</span>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
        <span className="font-mono text-[10px] text-primary shrink-0">{result.technique_id}</span>
        <span className="text-xs font-medium text-foreground flex-1 truncate">{result.technique_name}</span>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
          result.outcome === 'success' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          result.outcome === 'blocked' ? 'bg-primary/10 border-primary/20 text-primary' :
          result.outcome === 'detected' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
          'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>{result.outcome}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          {result.commands?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Commands Executed</p>
              <div className="space-y-1">
                {result.commands.map((cmd, i) => (
                  <code key={i} className="block text-[10px] font-mono bg-[#0d1117] border border-border text-primary px-3 py-1.5 rounded-md break-all">
                    {cmd}
                  </code>
                ))}
              </div>
            </div>
          )}

          {result.system_response && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">System Response</p>
              <p className="text-xs text-foreground leading-relaxed">{result.system_response}</p>
            </div>
          )}

          {result.detection_opportunity && (
            <div className="flex items-start gap-2 bg-cyan-500/5 border border-cyan-500/20 rounded-lg px-3 py-2">
              <Shield className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wide mb-0.5">Detection Opportunity</p>
                <p className="text-xs text-muted-foreground">{result.detection_opportunity}</p>
              </div>
            </div>
          )}

          {result.log_lines?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Simulated Logs</p>
              <div className="bg-[#0d1117] border border-border rounded-xl p-3 space-y-0.5 max-h-36 overflow-y-auto font-mono text-[10px]">
                {result.log_lines.map((line, i) => (
                  <div key={i} className="text-slate-300 leading-relaxed">{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MitreSimulationOutput({ result, loading }) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Simulating Attack Chain...</p>
          <p className="text-xs text-muted-foreground mt-1">Running MITRE techniques, generating logs and IOCs</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const outcomeKey = result.campaign_outcome?.toLowerCase() || 'partial';
  const outcomeStyle = OUTCOME_STYLE[outcomeKey] || OUTCOME_STYLE.partial;
  const OutcomeIcon = outcomeStyle.icon;
  const m = result.metrics || {};

  return (
    <div className="space-y-4">
      {/* Campaign outcome banner */}
      <div className={`flex items-center gap-4 rounded-2xl border p-4 ${outcomeStyle.bg} ${outcomeStyle.border}`}>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${outcomeStyle.border} ${outcomeStyle.bg}`}>
          <OutcomeIcon className={`w-5 h-5 ${outcomeStyle.color}`} />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-bold ${outcomeStyle.color}`}>{outcomeStyle.label}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{result.kill_chain_narrative}</p>
        </div>
        {m.overall_risk_score != null && (
          <div className="text-center shrink-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Risk</p>
            <p className={`text-3xl font-black ${m.overall_risk_score >= 7 ? 'text-red-400' : m.overall_risk_score >= 4 ? 'text-amber-400' : 'text-primary'}`}>
              {m.overall_risk_score}<span className="text-sm font-normal text-muted-foreground">/10</span>
            </p>
          </div>
        )}
      </div>

      {/* Metrics row */}
      {(m.techniques_succeeded != null || m.techniques_detected != null || m.techniques_blocked != null) && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Succeeded', value: m.techniques_succeeded, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20', icon: XCircle },
            { label: 'Detected', value: m.techniques_detected, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20', icon: Activity },
            { label: 'Blocked', value: m.techniques_blocked, color: 'text-primary', bg: 'bg-primary/5 border-primary/20', icon: Shield },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`rounded-xl border p-3 text-center ${stat.bg}`}>
                <Icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value ?? '—'}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Technique results */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-foreground">Technique-by-Technique Results</span>
        </div>
        <div className="p-4 space-y-2">
          {(result.technique_results || []).map((t, i) => (
            <TechniqueResult key={i} result={t} index={i} />
          ))}
        </div>
      </div>

      {/* IOCs */}
      {(result.iocs || []).length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Bug className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-foreground">Indicators of Compromise (IOCs)</span>
          </div>
          <div className="p-4 space-y-2">
            {result.iocs.map((ioc, i) => (
              <div key={i} className="flex items-start gap-3 bg-secondary/20 border border-border rounded-xl px-3 py-2.5">
                <span className="text-[9px] font-bold uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full mt-0.5 shrink-0">
                  {ioc.type}
                </span>
                <div className="flex-1 min-w-0">
                  <code className="text-[10px] font-mono text-foreground break-all block">{ioc.value}</code>
                  {ioc.context && <p className="text-[10px] text-muted-foreground mt-0.5">{ioc.context}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}