import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, X, ShieldCheck, ShieldX, ShieldAlert, CheckCircle2 } from 'lucide-react';

const TYPE_COLORS = {
  attacker: [220, 38, 38],
  firewall: [34, 197, 94],
  ids:      [234, 88, 12],
  siem:     [147, 51, 234],
  system:   [100, 116, 139],
  phase:    [56, 189, 248],
};

const SEVERITY_COLORS = {
  critical: [220, 38, 38],
  high:     [234, 88, 12],
  medium:   [217, 119, 6],
  low:      [22, 163, 74],
};

const STATUS_CONFIG = {
  success: { label: 'Breached',  icon: ShieldX,     classes: 'bg-destructive/15 text-destructive border-destructive/30' },
  partial: { label: 'Partial',   icon: ShieldAlert,  classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  blocked: { label: 'Blocked',   icon: ShieldCheck,  classes: 'bg-primary/15 text-primary border-primary/30' },
};

export default function SimulatorReport({ scenario, node, metrics, logs, status, onClose }) {
  const [report, setReport]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [generated, setGenerated] = useState(false);

  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.partial;
  const StatusIcon = statusCfg.icon;

  const generateReport = async () => {
    setLoading(true);

    const logSample = logs
      .filter(l => l.type !== 'system')
      .slice(-60)
      .map(l => `[${l.source}] ${l.message}`)
      .join('\n');

    const phaseList = scenario.phases.map((p, i) => `Phase ${i + 1}: ${p.label}`).join(', ');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a senior cybersecurity analyst writing a post-attack simulation report.

Attack: "${scenario.name}" (${scenario.category}, severity: ${scenario.severity})
Target: ${node.name} (${node.ip}) — OS: ${node.os} — Services: ${node.services?.join(', ')}
Phases executed: ${phaseList}
Outcome: ${status === 'success' ? 'Attacker breached target' : status === 'blocked' ? 'Attack fully blocked' : 'Partial penetration'}
Metrics: ${metrics.blocked_count} blocked, ${metrics.detected_count} detected, ${metrics.connections_attempted} connections attempted, alert level: ${metrics.alert_level}

--- LOG SAMPLE ---
${logSample}
--- END ---

Provide a structured post-simulation security report with:
1. executive_summary: 2-3 sentence high-level summary of what happened.
2. phase_breakdown: For each phase name in [${scenario.phases.map(p => p.label).join(', ')}], provide a "label" and a 1-sentence "outcome" describing what occurred.
3. vulnerabilities: 3-4 specific vulnerabilities exploited or exposed, each with "name", "severity" (critical/high/medium/low), and "explanation".
4. remediation_steps: 5 concrete, actionable remediation steps as strings.
5. risk_score: number 1–10.

Return as JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          risk_score: { type: 'number' },
          phase_breakdown: {
            type: 'array',
            items: { type: 'object', properties: { label: { type: 'string' }, outcome: { type: 'string' } } }
          },
          vulnerabilities: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' }, severity: { type: 'string' }, explanation: { type: 'string' } } }
          },
          remediation_steps: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    setReport(result);
    setLoading(false);
    setGenerated(true);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentW = pageW - margin * 2;
    let y = margin;

    const checkPage = (needed = 20) => {
      if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
    };

    const text = (str, { fontSize = 10, bold = false, color = [30, 30, 30], indent = 0, lh = 14 } = {}) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      doc.splitTextToSize(str, contentW - indent).forEach(line => {
        checkPage(lh + 2);
        doc.text(line, margin + indent, y);
        y += lh;
      });
    };

    const divider = () => {
      checkPage(10);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, margin + contentW, y);
      y += 12;
    };

    // Dark header
    doc.setFillColor(10, 18, 36);
    doc.rect(0, 0, pageW, 76, 'F');
    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(34, 197, 94);
    doc.text('Post-Attack Simulation Report', margin, 28);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
    doc.text(`Scenario: ${scenario.name}  |  Severity: ${scenario.severity.toUpperCase()}  |  Generated: ${new Date().toLocaleString()}`, margin, 44);
    doc.text(`Target: ${node.name} (${node.ip}) — ${node.os}`, margin, 58);
    y = 96;

    // Risk score + summary
    const riskC = report.risk_score >= 8 ? [220,38,38] : report.risk_score >= 6 ? [234,88,12] : report.risk_score >= 4 ? [217,119,6] : [22,163,74];
    text(`Risk Score: ${report.risk_score}/10`, { fontSize: 14, bold: true, color: riskC });
    text(`Outcome: ${statusCfg.label}`, { fontSize: 11, bold: true, color: [100,116,139] });
    y += 4;
    text(report.executive_summary, { color: [60, 60, 60] });
    y += 10; divider();

    // Phase breakdown
    text('PHASES EXECUTED', { fontSize: 12, bold: true, color: [15,23,42] }); y += 6;
    (report.phase_breakdown || []).forEach((p, i) => {
      checkPage(32);
      text(`${i + 1}. ${p.label}`, { bold: true, color: [15,23,42] });
      text(p.outcome, { color: [60,60,60], indent: 14 });
      y += 3;
    });
    y += 6; divider();

    // Vulnerabilities
    text('VULNERABILITIES', { fontSize: 12, bold: true, color: [15,23,42] }); y += 6;
    (report.vulnerabilities || []).forEach((v, i) => {
      checkPage(40);
      const sc = SEVERITY_COLORS[v.severity?.toLowerCase()] || SEVERITY_COLORS.medium;
      text(`${i + 1}. ${v.name}`, { bold: true, color: [15,23,42] });
      text(`Severity: ${v.severity?.toUpperCase()}`, { color: sc, indent: 14 });
      text(v.explanation, { color: [60,60,60], indent: 14 });
      y += 4;
    });
    y += 6; divider();

    // Remediation
    text('REMEDIATION STEPS', { fontSize: 12, bold: true, color: [15,23,42] }); y += 6;
    (report.remediation_steps || []).forEach((step, i) => {
      checkPage(30);
      text(`Step ${i + 1}:`, { bold: true, color: [22,163,74] });
      text(step, { color: [60,60,60], indent: 14 });
      y += 4;
    });
    y += 6; divider();

    // Log timeline
    text('ATTACK LOG TIMELINE', { fontSize: 12, bold: true, color: [15,23,42] }); y += 6;
    logs.slice(-50).forEach(log => {
      checkPage(12);
      const timeStr = log.time ? new Date(log.time).toLocaleTimeString() : '';
      const line = `[${timeStr}] [${log.source}] ${log.message}`;
      doc.setFontSize(7.5); doc.setFont('courier', 'normal');
      const c = TYPE_COLORS[log.type?.toLowerCase()] || [100,116,139];
      doc.setTextColor(...c);
      doc.splitTextToSize(line, contentW).forEach(l => { checkPage(10); doc.text(l, margin, y); y += 10; });
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(150,150,150);
      doc.text(`Page ${i} of ${pageCount} — CyberSec Training Platform`, margin, pageH - 20);
    }

    doc.save(`attack-report-${scenario.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
  };

  const severityBadge = { critical: 'bg-destructive/20 text-destructive', high: 'bg-orange-500/20 text-orange-400', medium: 'bg-amber-500/20 text-amber-400', low: 'bg-primary/20 text-primary' };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-accent" />
          <div>
            <p className="text-sm font-bold text-foreground">Simulation Report</p>
            <p className="text-xs text-muted-foreground">{scenario.name} → {node.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusCfg.classes}`}>
            <StatusIcon className="w-3 h-3" /> {statusCfg.label}
          </span>
          {generated && (
            <Button size="sm" variant="outline" onClick={exportPDF} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </Button>
          )}
          {!generated && (
            <Button size="sm" onClick={generateReport} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          )}
          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick metrics bar */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          { label: 'Blocked',     value: metrics.blocked_count,        color: 'text-primary' },
          { label: 'Detected',    value: metrics.detected_count,       color: 'text-amber-400' },
          { label: 'Connections', value: metrics.connections_attempted, color: 'text-accent' },
        ].map(m => (
          <div key={m.label} className="px-5 py-3 text-center">
            <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm">AI is analyzing your simulation...</p>
        </div>
      )}

      {/* Report content */}
      {report && (
        <div className="p-5 space-y-5">
          {/* Risk + Summary */}
          <div className="flex gap-5 items-start bg-secondary/30 rounded-xl p-4">
            <div className="text-center shrink-0">
              <p className={`text-4xl font-black ${report.risk_score >= 8 ? 'text-destructive' : report.risk_score >= 6 ? 'text-orange-400' : report.risk_score >= 4 ? 'text-amber-400' : 'text-primary'}`}>
                {report.risk_score}<span className="text-base text-muted-foreground font-semibold">/10</span>
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Risk Score</p>
            </div>
            <div className="flex-1 border-l border-border pl-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Executive Summary</p>
              <p className="text-sm text-foreground leading-relaxed">{report.executive_summary}</p>
            </div>
          </div>

          {/* Phase breakdown */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Phase Breakdown</p>
            <div className="space-y-2">
              {(report.phase_breakdown || []).map((p, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.outcome}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vulnerabilities */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Vulnerabilities Exposed</p>
            <div className="space-y-2">
              {(report.vulnerabilities || []).map((v, i) => (
                <div key={i} className="flex gap-3 items-start py-2 border-b border-border last:border-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${severityBadge[v.severity?.toLowerCase()] || severityBadge.medium}`}>
                    {v.severity?.toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{v.name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{v.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remediation */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Remediation Steps</p>
            <ol className="space-y-2">
              {(report.remediation_steps || []).map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                  <p className="text-sm text-foreground leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Prompt before generation */}
      {!loading && !report && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
          <FileText className="w-10 h-10 opacity-30" />
          <p className="text-sm">Click "Generate Report" to get an AI-powered analysis</p>
          <p className="text-xs">Covers phase outcomes, vulnerabilities, and remediation steps</p>
        </div>
      )}
    </div>
  );
}