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

  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 48;
    const contentW = pageW - margin * 2;
    let y = margin;

    const checkPage = (needed = 20) => {
      if (y + needed > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const writeText = (text, { fontSize = 10, bold = false, color = [30, 30, 30], indent = 0, lineHeight = 14 } = {}) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, contentW - indent);
      lines.forEach(line => {
        checkPage(lineHeight + 2);
        doc.text(line, margin + indent, y);
        y += lineHeight;
      });
    };

    const writeDivider = () => {
      checkPage(10);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, margin + contentW, y);
      y += 10;
    };

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 70, 'F');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('Security Analysis Report', margin, 30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 46);
    doc.text(`Target: ${target?.name || 'Unknown'} (${target?.ip || 'N/A'}) — OS: ${target?.os || 'Unknown'}`, margin, 58);
    y = 90;

    // Risk Score
    writeText(`Overall Risk Score: ${analysis.risk_score}/10`, { fontSize: 14, bold: true, color: analysis.risk_score >= 8 ? [220, 38, 38] : analysis.risk_score >= 6 ? [234, 88, 12] : analysis.risk_score >= 4 ? [217, 119, 6] : [22, 163, 74] });
    y += 4;
    writeText(analysis.attack_summary, { color: [60, 60, 60] });
    if (analysis.risk_justification) writeText(analysis.risk_justification, { color: [100, 100, 100] });
    y += 10;
    writeDivider();

    // Vulnerabilities
    writeText('VULNERABILITIES EXPLOITED', { fontSize: 12, bold: true, color: [15, 23, 42] });
    y += 6;
    (analysis.vulnerabilities || []).forEach((v, i) => {
      checkPage(40);
      const sevColor = v.severity?.toLowerCase() === 'critical' ? [220, 38, 38] : v.severity?.toLowerCase() === 'high' ? [234, 88, 12] : v.severity?.toLowerCase() === 'medium' ? [217, 119, 6] : [22, 163, 74];
      writeText(`${i + 1}. ${v.name}`, { bold: true, color: [15, 23, 42] });
      writeText(`Severity: ${v.severity?.toUpperCase()}`, { color: sevColor, indent: 12 });
      writeText(v.explanation, { color: [60, 60, 60], indent: 12 });
      y += 4;
    });
    y += 6;
    writeDivider();

    // Remediation
    writeText('REMEDIATION PLAN', { fontSize: 12, bold: true, color: [15, 23, 42] });
    y += 6;
    (analysis.remediation_steps || []).forEach((step, i) => {
      checkPage(30);
      writeText(`Step ${i + 1}:`, { bold: true, color: [22, 163, 74] });
      writeText(step, { color: [60, 60, 60], indent: 12 });
      y += 4;
    });
    y += 6;
    writeDivider();

    // Attack Timeline
    writeText('ATTACK TIMELINE (LAST 40 EVENTS)', { fontSize: 12, bold: true, color: [15, 23, 42] });
    y += 6;
    const timelineLogs = logs.slice(-40);
    timelineLogs.forEach(log => {
      checkPage(14);
      const time = log.time ? new Date(log.time).toLocaleTimeString() : '';
      const line = `[${time}] [${log.source}] ${log.message}`;
      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      const typeColorMap = { attacker: [220, 38, 38], firewall: [22, 163, 74], ids: [234, 88, 12], siem: [147, 51, 234], system: [100, 116, 139] };
      const c = typeColorMap[log.type?.toLowerCase()] || [60, 60, 60];
      doc.setTextColor(...c);
      const wrapped = doc.splitTextToSize(line, contentW);
      wrapped.forEach(l => { checkPage(11); doc.text(l, margin, y); y += 11; });
    });

    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount} — CyberSec Training Platform`, margin, doc.internal.pageSize.getHeight() - 20);
    }

    doc.save(`security-report-${target?.name || 'sandbox'}-${Date.now()}.pdf`);
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
        <div className="flex items-center gap-2 shrink-0">
          {analysis && (
            <Button variant="outline" onClick={exportPDF} className="gap-2">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
          )}
          <Button
            onClick={runAnalysis}
            disabled={!hasLogs || isLoading}
            className="gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {isLoading ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
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