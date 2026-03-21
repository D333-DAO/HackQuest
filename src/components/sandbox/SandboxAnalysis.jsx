import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Brain, ShieldCheck, AlertTriangle, Loader2, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

function Section({ icon: Icon, title, color, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-secondary/40 hover:bg-secondary/60 transition-colors text-left"
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
        <span className="text-sm font-semibold text-foreground flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 py-4 space-y-2">{children}</div>}
    </div>
  );
}

export default function SandboxAnalysis({ logs, target, metrics }) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasLogs = logs.length > 0;

  const runAnalysis = async () => {
    setIsLoading(true);
    setAnalysis(null);

    const logText = logs
      .slice(-80)
      .map(l => `[${l.source}] ${l.message}`)
      .join('\n');

    const prompt = `You are a senior cybersecurity analyst. Analyze the following attack simulation logs from a sandbox environment.

Target: ${target?.name || 'Unknown'} (${target?.ip || 'N/A'}) — OS: ${target?.os || 'Unknown'} — Services: ${target?.services?.join(', ') || 'Unknown'}
Total blocked: ${metrics.blocked}, Detected: ${metrics.detected}, Connections attempted: ${metrics.connections}

--- LOGS ---
${logText}
--- END LOGS ---

Provide a structured security analysis:
1. vulnerabilities: List of 3-5 specific vulnerabilities that were exploited or probed, each with a name, severity (critical/high/medium/low), and a 1-2 sentence explanation.
2. attack_summary: A 2-3 sentence executive summary of what happened during the attack.
3. remediation_steps: A numbered list of 5-7 concrete, actionable remediation steps to harden the target machine against these attacks.
4. risk_score: An overall risk score 1-10 and a brief justification.

Return as JSON.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          attack_summary: { type: 'string' },
          risk_score: { type: 'number' },
          risk_justification: { type: 'string' },
          vulnerabilities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                severity: { type: 'string' },
                explanation: { type: 'string' },
              }
            }
          },
          remediation_steps: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    setAnalysis(result);
    setIsLoading(false);
  };

  const severityStyle = {
    critical: 'bg-destructive/20 text-destructive border-destructive/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-primary/20 text-primary border-primary/30',
  };

  const riskColor = (score) => {
    if (score >= 8) return 'text-destructive';
    if (score >= 6) return 'text-orange-400';
    if (score >= 4) return 'text-amber-400';
    return 'text-primary';
  };

  return (
    <div className="space-y-4">
      {/* CTA bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-card border border-border rounded-2xl px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent" />
            AI Security Analysis
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasLogs
              ? `${logs.length} log entries ready — run analysis to get a full vulnerability report and remediation plan.`
              : 'Launch an attack simulation first, then come back here for an AI-powered security report.'}
          </p>
        </div>
        <Button
          onClick={runAnalysis}
          disabled={!hasLogs || isLoading}
          className="gap-2 shrink-0"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {isLoading ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {/* Results */}
      {analysis && (
        <div className="space-y-3">
          {/* Risk Score */}
          <div className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-5">
            <div className="text-center">
              <p className={`text-4xl font-black ${riskColor(analysis.risk_score)}`}>{analysis.risk_score}<span className="text-lg font-semibold text-muted-foreground">/10</span></p>
              <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">Risk Score</p>
            </div>
            <div className="flex-1 border-l border-border pl-5">
              <p className="text-sm font-semibold text-foreground mb-1">Attack Summary</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{analysis.attack_summary}</p>
              {analysis.risk_justification && (
                <p className="text-xs text-muted-foreground mt-1 italic">{analysis.risk_justification}</p>
              )}
            </div>
          </div>

          {/* Vulnerabilities */}
          <Section icon={AlertTriangle} title="Vulnerabilities Exploited" color="text-destructive">
            {analysis.vulnerabilities?.map((v, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 shrink-0 ${severityStyle[v.severity?.toLowerCase()] || severityStyle.medium}`}>
                  {v.severity?.toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{v.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{v.explanation}</p>
                </div>
              </div>
            ))}
          </Section>

          {/* Remediation */}
          <Section icon={ShieldCheck} title="Remediation Plan" color="text-primary">
            <ol className="space-y-3">
              {analysis.remediation_steps?.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      )}
    </div>
  );
}