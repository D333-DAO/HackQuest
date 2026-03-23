import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, ShieldAlert, Target, Wrench, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, ExternalLink, Flame, Shield, Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SEVERITY_STYLE = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  low:      'bg-primary/15 text-primary border-primary/30',
};

function Section({ icon: Icon, title, color = 'text-primary', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 py-4 space-y-3">{children}</div>}
    </div>
  );
}

function MitreTag({ technique }) {
  return (
    <a
      href={`https://attack.mitre.org/techniques/${technique.id}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-mono bg-purple-500/10 border border-purple-500/25 text-purple-400 px-2.5 py-1 rounded-lg hover:bg-purple-500/20 transition-colors"
    >
      <span className="font-bold">{technique.id}</span>
      <span className="text-purple-300/70">·</span>
      <span>{technique.name}</span>
      <ExternalLink className="w-3 h-3 opacity-60" />
    </a>
  );
}

function VulnCard({ vuln }) {
  return (
    <div className="flex items-start gap-3 bg-secondary/20 rounded-lg p-3 border border-border">
      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
        vuln.severity === 'critical' ? 'text-red-400' :
        vuln.severity === 'high' ? 'text-orange-400' : 'text-amber-400'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-semibold text-foreground">{vuln.name}</span>
          {vuln.cve && (
            <span className="text-[10px] font-mono bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded">
              {vuln.cve}
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_STYLE[vuln.severity] || SEVERITY_STYLE.medium}`}>
            {(vuln.severity || 'medium').toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{vuln.description}</p>
      </div>
    </div>
  );
}

function RemediationCard({ item, index }) {
  return (
    <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-lg p-3">
      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground mb-0.5">{item.action}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
        {item.priority && (
          <span className={`mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            item.priority === 'immediate' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            item.priority === 'short-term' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            'bg-secondary border-border text-muted-foreground'
          }`}>
            {item.priority}
          </span>
        )}
      </div>
    </div>
  );
}

const FIX_TYPE_STYLE = {
  firewall_rule:  { icon: Flame,    color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  patch:          { icon: Shield,   color: 'text-primary',    bg: 'bg-primary/10 border-primary/20' },
  config_change:  { icon: Settings, color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/20' },
};

function SuggestedFixCard({ fix, applied, onApply }) {
  const style = FIX_TYPE_STYLE[fix.type] || FIX_TYPE_STYLE.config_change;
  const Icon = style.icon;
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${applied ? 'bg-primary/5 border-primary/25 opacity-70' : 'bg-secondary/20 border-border'}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${style.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${style.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-semibold text-foreground">{fix.label}</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${style.bg} ${style.color}`}>
            {fix.type.replace('_', ' ')}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{fix.description}</p>
        {fix.command && (
          <code className="text-[10px] font-mono bg-secondary border border-border text-muted-foreground px-2 py-1 rounded-md block break-all">{fix.command}</code>
        )}
      </div>
      <button
        onClick={() => !applied && onApply(fix)}
        disabled={applied}
        className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
          applied
            ? 'bg-primary/10 border-primary/20 text-primary cursor-default'
            : 'bg-secondary border-border text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary'
        }`}
      >
        {applied ? <><CheckCircle2 className="w-3 h-3" /> Applied</> : <><Plus className="w-3 h-3" /> Apply</>}
      </button>
    </div>
  );
}

export default function SimulationReport({ attack, target, logs, metrics, difficulty, onClose, onApplyFix }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appliedFixes, setAppliedFixes] = useState([]);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    const logSample = logs.slice(-60).map(l => `[${l.source}] ${l.message}`).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cybersecurity threat analyst. Analyze the following attack simulation and generate a structured post-incident report.

Attack: "${attack.name}" (${attack.category}) | Difficulty: ${difficulty?.label || 'Standard'}
Target: ${target.name} (${target.ip}) running ${target.os}, services: ${target.services.join(', ')}
Outcome — Blocked: ${metrics.blocked}, Detected: ${metrics.detected}, Connections: ${metrics.connections}

Simulation logs (last 60 lines):
${logSample}

Generate a comprehensive report with:
1. 2-4 specific vulnerabilities exploited or probed (with real CVE IDs where applicable)
2. 3-5 MITRE ATT&CK techniques observed (use real IDs like T1190, T1059)
3. 4-6 remediation steps tailored to the target OS and services
4. Risk score 1-10 and a one-paragraph executive summary
5. 4-6 one-click suggested fixes: a mix of firewall_rule, patch, and config_change types. Each must be directly relevant to this specific attack and target. Include a real CLI command where applicable.

Return JSON matching the schema exactly.`,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          risk_score: { type: 'number' },
          vulnerabilities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                cve: { type: 'string' },
                severity: { type: 'string' },
                description: { type: 'string' },
              }
            }
          },
          mitre_techniques: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                tactic: { type: 'string' },
              }
            }
          },
          remediations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                detail: { type: 'string' },
                priority: { type: 'string' },
              }
            }
          },
          suggested_fixes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                label: { type: 'string' },
                description: { type: 'string' },
                command: { type: 'string' },
              }
            }
          }
        }
      }
    });

    setReport(result);
    setLoading(false);
  };

  const handleApplyFix = (fix) => {
    setAppliedFixes(prev => [...prev, fix.label]);
    if (!onApplyFix) return;
    if (fix.type === 'firewall_rule') {
      onApplyFix({ type: 'rule', value: fix.label });
    } else {
      onApplyFix({ type: 'patch', value: { id: fix.label, label: fix.label, icon: fix.type === 'patch' ? '⚙️' : '🔧', desc: fix.description } });
    }
  };

  const riskColor = report
    ? report.risk_score >= 8 ? 'text-red-400' : report.risk_score >= 5 ? 'text-amber-400' : 'text-primary'
    : 'text-muted-foreground';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Simulation Report</h2>
              <p className="text-[11px] text-muted-foreground">
                {attack.name} → {target.name} ({target.ip})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {report && (
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Risk Score</p>
                <p className={`text-2xl font-black ${riskColor}`}>{report.risk_score}<span className="text-sm font-normal text-muted-foreground">/10</span></p>
              </div>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Analyzing simulation...</p>
                <p className="text-xs text-muted-foreground mt-1">Mapping MITRE ATT&CK techniques and generating remediation plan</p>
              </div>
            </div>
          ) : report ? (
            <>
              {/* Executive summary */}
              <div className="bg-secondary/30 border border-border rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Executive Summary</p>
                <p className="text-sm text-foreground leading-relaxed">{report.executive_summary}</p>
              </div>

              {/* Vulnerabilities */}
              <Section icon={AlertTriangle} title="Exploited Vulnerabilities" color="text-orange-400">
                {(report.vulnerabilities || []).map((v, i) => <VulnCard key={i} vuln={v} />)}
              </Section>

              {/* MITRE ATT&CK */}
              <Section icon={Target} title="MITRE ATT&CK Techniques" color="text-purple-400">
                <div className="space-y-2">
                  {(report.mitre_techniques || []).map((t, i) => (
                    <div key={i} className="flex items-center gap-3 flex-wrap">
                      <MitreTag technique={t} />
                      {t.tactic && (
                        <span className="text-[10px] text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-full">
                          Tactic: {t.tactic}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Section>

              {/* One-click Suggested Fixes */}
              {(report.suggested_fixes || []).length > 0 && (
                <Section icon={Shield} title="One-Click Suggested Fixes" color="text-cyan-400" defaultOpen={true}>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Apply these targeted fixes directly to the simulation's defense layer. {onApplyFix ? 'Changes will reflect in Interactive Defense.' : ''}
                    </p>
                    {(report.suggested_fixes || []).map((fix, i) => (
                      <SuggestedFixCard
                        key={i}
                        fix={fix}
                        applied={appliedFixes.includes(fix.label)}
                        onApply={handleApplyFix}
                      />
                    ))}
                    {appliedFixes.length > 0 && (
                      <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-xs text-primary mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        {appliedFixes.length} fix{appliedFixes.length > 1 ? 'es' : ''} applied to the simulation environment.
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* Remediations */}
              <Section icon={Wrench} title="Remediation Recommendations" color="text-primary">
                {(report.remediations || []).map((r, i) => <RemediationCard key={i} item={r} index={i} />)}
              </Section>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">Failed to generate report.</p>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              Based on {logs.length} simulated log events
            </div>
            <Button size="sm" variant="outline" onClick={onClose}>Close Report</Button>
          </div>
        )}
      </div>
    </div>
  );
}