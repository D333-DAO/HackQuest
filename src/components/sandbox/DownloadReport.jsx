import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';

export default function DownloadReport({ logs, metrics, target, attack }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const canGenerate = logs.length > 0 && target;

  const buildPDF = (analysis) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentW = pageW - margin * 2;
    let y = margin;

    const checkPage = (needed = 20) => {
      if (y + needed > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const text = (str, { size = 10, bold = false, color = [220, 230, 245], indent = 0, lh = 14 } = {}) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(String(str), contentW - indent);
      lines.forEach(line => { checkPage(lh + 2); doc.text(line, margin + indent, y); y += lh; });
    };

    const divider = (color = [40, 55, 75]) => {
      checkPage(12);
      doc.setDrawColor(...color);
      doc.line(margin, y, margin + contentW, y);
      y += 12;
    };

    const sectionHeader = (label, accentColor = [34, 197, 94]) => {
      checkPage(30);
      y += 6;
      doc.setFillColor(...accentColor, 30);
      doc.roundedRect(margin, y - 12, contentW, 20, 3, 3, 'F');
      text(label, { size: 11, bold: true, color: accentColor, lh: 16 });
      y += 4;
    };

    // ── Cover header ──────────────────────────────────────────────
    doc.setFillColor(10, 18, 35);
    doc.rect(0, 0, pageW, 85, 'F');
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 85, pageW, 3, 'F');

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('Simulation Security Report', margin, 34);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 50);
    doc.text(
      `Target: ${target?.name || 'Unknown'} — ${target?.ip || 'N/A'} — ${target?.os || 'Unknown'}`,
      margin, 63
    );
    if (attack?.name) doc.text(`Attack Scenario: ${attack.name}  (${attack.category || 'N/A'})`, margin, 76);
    y = 106;

    // ── Metrics summary ───────────────────────────────────────────
    sectionHeader('SIMULATION METRICS', [34, 197, 94]);
    const metricPairs = [
      ['Blocked Attempts', metrics.blocked],
      ['Detected Events', metrics.detected],
      ['Connections Attempted', metrics.connections],
      ['Total Log Entries', logs.length],
      ['Alert Level', metrics.alerts?.slice(-1)[0]?.level?.toUpperCase() || 'N/A'],
    ];
    metricPairs.forEach(([label, val]) => {
      checkPage(16);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(148, 163, 184);
      doc.text(`${label}:`, margin + 8, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(220, 230, 245);
      doc.text(String(val), margin + 185, y);
      y += 15;
    });
    y += 4;
    divider();

    // ── AI-generated content ──────────────────────────────────────
    if (analysis) {
      // Risk score
      sectionHeader('RISK ASSESSMENT', [239, 68, 68]);
      const riskColor = analysis.risk_score >= 8 ? [239, 68, 68] : analysis.risk_score >= 6 ? [249, 115, 22] : analysis.risk_score >= 4 ? [234, 179, 8] : [34, 197, 94];
      text(`Risk Score: ${analysis.risk_score}/10`, { size: 14, bold: true, color: riskColor, lh: 18 });
      text(analysis.attack_summary || '', { color: [180, 195, 215], lh: 14 });
      if (analysis.risk_justification) text(analysis.risk_justification, { color: [130, 145, 165], lh: 13 });
      y += 4; divider();

      // Vulnerabilities
      sectionHeader('KEY VULNERABILITIES IDENTIFIED', [239, 68, 68]);
      (analysis.vulnerabilities || []).forEach((v, i) => {
        checkPage(50);
        const sevColor =
          v.severity?.toLowerCase() === 'critical' ? [239, 68, 68] :
          v.severity?.toLowerCase() === 'high'     ? [249, 115, 22] :
          v.severity?.toLowerCase() === 'medium'   ? [234, 179, 8] :
                                                     [34, 197, 94];
        text(`${i + 1}. ${v.name}`, { bold: true, color: [220, 230, 245], lh: 14 });
        text(`Severity: ${v.severity?.toUpperCase()}`, { color: sevColor, indent: 14, lh: 13 });
        text(v.explanation, { color: [160, 175, 195], indent: 14, lh: 13 });
        y += 5;
      });
      y += 4; divider();

      // Remediation
      sectionHeader('STEP-BY-STEP REMEDIATION ADVICE', [34, 197, 94]);
      (analysis.remediation_steps || []).forEach((step, i) => {
        checkPage(35);
        text(`Step ${i + 1}:`, { bold: true, color: [34, 197, 94], lh: 13 });
        text(step, { color: [180, 195, 215], indent: 14, lh: 13 });
        y += 4;
      });
      y += 4; divider();
    }

    // ── Blocked-attack log ────────────────────────────────────────
    const blockedLogs = logs.filter(l => l.type === 'firewall' || l.type === 'ids');
    sectionHeader('BLOCKED / DETECTED ATTACK LOGS', [147, 51, 234]);
    if (blockedLogs.length === 0) {
      text('No blocked/detected events recorded.', { color: [100, 120, 140] });
    } else {
      blockedLogs.slice(0, 60).forEach(log => {
        checkPage(13);
        const time = log.time ? new Date(log.time).toLocaleTimeString() : '';
        const line = `[${time}] [${log.source}] ${log.message}`;
        const c = log.type === 'firewall' ? [34, 197, 94] : [251, 191, 36];
        doc.setFontSize(8);
        doc.setFont('courier', 'normal');
        doc.setTextColor(...c);
        doc.splitTextToSize(line, contentW).forEach(l => { checkPage(11); doc.text(l, margin, y); y += 11; });
      });
    }
    y += 4; divider();

    // ── Full timeline (last 60) ───────────────────────────────────
    sectionHeader('FULL ATTACK TIMELINE (LAST 60 EVENTS)', [96, 165, 250]);
    logs.slice(-60).forEach(log => {
      checkPage(12);
      const time = log.time ? new Date(log.time).toLocaleTimeString() : '';
      const line = `[${time}] [${log.source}] ${log.message}`;
      const colorMap = { attacker: [239, 68, 68], firewall: [34, 197, 94], ids: [251, 191, 36], siem: [147, 51, 234], system: [100, 116, 139], info: [96, 165, 250] };
      const c = colorMap[log.type?.toLowerCase()] || [120, 130, 145];
      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      doc.setTextColor(...c);
      doc.splitTextToSize(line, contentW).forEach(l => { checkPage(11); doc.text(l, margin, y); y += 11; });
    });

    // ── Footer ────────────────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 95, 115);
      doc.text(`Page ${i} of ${pageCount}  |  CyberSec Training Platform  |  Confidential`, margin, pageH - 22);
    }

    doc.save(`security-report-${target?.name || 'sandbox'}-${Date.now()}.pdf`);
  };

  const handleDownload = async () => {
    setIsGenerating(true);

    const logText = logs.slice(-80).map(l => `[${l.source}] ${l.message}`).join('\n');

    const prompt = `You are a senior cybersecurity analyst. Analyze this attack simulation.

Target: ${target?.name || 'Unknown'} (${target?.ip || 'N/A'}) — OS: ${target?.os || 'Unknown'} — Services: ${target?.services?.join(', ') || 'Unknown'}
Attack: ${attack?.name || 'Unknown'} (${attack?.category || 'N/A'})
Blocked: ${metrics.blocked}, Detected: ${metrics.detected}, Connections: ${metrics.connections}

--- LOGS ---
${logText}
--- END LOGS ---

Return structured JSON with:
1. vulnerabilities: 3-5 specific vulnerabilities exploited, each with name, severity (critical/high/medium/low), explanation.
2. attack_summary: 2-3 sentence executive summary.
3. remediation_steps: 5-7 concrete, step-by-step remediation actions tailored to ${target?.os || 'the target OS'} and its services (${target?.services?.join(', ') || 'unknown'}).
4. risk_score: number 1-10.
5. risk_justification: one sentence.`;

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
            items: { type: 'object', properties: { name: { type: 'string' }, severity: { type: 'string' }, explanation: { type: 'string' } } }
          },
          remediation_steps: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    buildPDF(result);
    setIsGenerating(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={!canGenerate || isGenerating}
      className="gap-1.5"
      title={!canGenerate ? 'Run a simulation first' : 'Generate PDF report'}
    >
      {isGenerating
        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
        : <><FileDown className="w-3.5 h-3.5" /> Download Report</>
      }
    </Button>
  );
}