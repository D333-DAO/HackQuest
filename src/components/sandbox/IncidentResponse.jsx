import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Zap, Loader2, CheckCircle2, Terminal, ShieldPlus, ChevronDown, ChevronRight, Play } from 'lucide-react';
import { updateNodeStatus } from '@/lib/networkStore';

const PATCH_STATUS = {
  pending:  { label: 'Pending',   cls: 'bg-secondary text-muted-foreground border-border' },
  applying: { label: 'Applying…', cls: 'bg-accent/10 text-accent border-accent/30' },
  applied:  { label: 'Applied',   cls: 'bg-primary/10 text-primary border-primary/30' },
};

function PatchCard({ patch, onApply, applied, applying }) {
  const [open, setOpen] = useState(false);
  const status = applying ? 'applying' : applied ? 'applied' : 'pending';
  const cfg = PATCH_STATUS[status];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-secondary/30">
        <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 flex-1 text-left min-w-0">
          {open
            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
          <span className="text-sm font-medium text-foreground truncate">{patch.title}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.cls}`}>
            {cfg.label}
          </span>
        </button>
        <Button
          size="sm"
          variant={applied ? 'ghost' : 'outline'}
          className={`gap-1.5 flex-shrink-0 h-7 text-xs ${applied ? 'text-primary cursor-default' : 'border-primary/30 text-primary hover:bg-primary/10'}`}
          disabled={applied || applying}
          onClick={() => onApply(patch)}
        >
          {applying ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : applied ? (
            <><CheckCircle2 className="w-3 h-3" /> Applied</>
          ) : (
            <><Play className="w-3 h-3" /> Apply</>
          )}
        </Button>
      </div>

      {open && (
        <div className="px-4 py-3 space-y-3 bg-card">
          <p className="text-xs text-muted-foreground leading-relaxed">{patch.description}</p>
          {patch.commands?.length > 0 && (
            <div className="bg-background border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-secondary/40">
                <Terminal className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Patch Commands</span>
              </div>
              <div className="p-3 space-y-1">
                {patch.commands.map((cmd, i) => (
                  <p key={i} className="text-xs font-mono text-primary leading-relaxed">{cmd}</p>
                ))}
              </div>
            </div>
          )}
          {patch.firewall_rules?.length > 0 && (
            <div className="bg-background border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-secondary/40">
                <ShieldPlus className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Firewall Rules</span>
              </div>
              <div className="p-3 space-y-1">
                {patch.firewall_rules.map((rule, i) => (
                  <p key={i} className="text-xs font-mono text-accent leading-relaxed">{rule}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function IncidentResponse({ vulnerabilities, target }) {
  const [patches, setPatches] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [patchStatus, setPatchStatus] = useState({});  // id -> 'applying' | 'applied'
  const [applyLog, setApplyLog] = useState([]);
  const [allApplied, setAllApplied] = useState(false);

  const hasVulns = vulnerabilities?.length > 0;

  const generatePatches = async () => {
    setIsGenerating(true);
    setPatches(null);
    setPatchStatus({});
    setApplyLog([]);
    setAllApplied(false);

    const vulnList = vulnerabilities.map(v => `- ${v.name} (${v.severity}): ${v.explanation}`).join('\n');

    const prompt = `You are an automated incident response system for a simulated cybersecurity environment.

Target machine: ${target?.name || 'Unknown'} (${target?.ip || 'N/A'}) running ${target?.os || 'Unknown'}
Exposed services: ${target?.services?.join(', ') || 'Unknown'}

Detected vulnerabilities:
${vulnList}

Generate a set of 4-6 specific, actionable remediation patches. Each patch should address one or more of the vulnerabilities. For each patch provide:
- title: short patch title
- description: 1-2 sentences explaining what it fixes and why
- commands: 2-4 realistic shell/config commands to apply the patch (realistic for the target OS)
- firewall_rules: 1-3 iptables/ufw/netsh/firewall rules (if applicable, else empty array)
- targets_vuln: which vulnerability name(s) it addresses
- priority: "critical" | "high" | "medium"

Return JSON.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          patches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title:        { type: 'string' },
                description:  { type: 'string' },
                commands:     { type: 'array', items: { type: 'string' } },
                firewall_rules: { type: 'array', items: { type: 'string' } },
                targets_vuln: { type: 'array', items: { type: 'string' } },
                priority:     { type: 'string' },
              }
            }
          }
        }
      }
    });

    const patchList = (result.patches || []).map((p, i) => ({ ...p, id: `patch-${i}` }));
    setPatches(patchList);
    setIsGenerating(false);
  };

  const applyPatch = async (patch) => {
    setPatchStatus(prev => ({ ...prev, [patch.id]: 'applying' }));

    // Simulate applying — stream fake terminal output over ~2 seconds
    const lines = [
      `[${new Date().toLocaleTimeString()}] Applying patch: ${patch.title}`,
      ...(patch.commands || []).map(cmd => `  $ ${cmd}`),
      ...(patch.firewall_rules || []).map(rule => `  # firewall: ${rule}`),
      `[${new Date().toLocaleTimeString()}] ✓ Patch applied successfully`,
    ];

    for (let i = 0; i < lines.length; i++) {
      await new Promise(r => setTimeout(r, 350));
      setApplyLog(prev => [...prev, lines[i]]);
    }

    setPatchStatus(prev => ({ ...prev, [patch.id]: 'applied' }));

    // Update the network topology node to 'healthy' once patches are applied
    if (target?.id) {
      const currentApplied = Object.values({ ...patchStatus, [patch.id]: 'applied' }).filter(s => s === 'applied').length;
      const total = patches?.length || 1;
      if (currentApplied >= total) {
        updateNodeStatus(target.id, { status: 'healthy', label: 'Patched' });
        updateNodeStatus('firewall', { status: 'healthy' });
        setAllApplied(true);
      }
    }
  };

  const applyAll = async () => {
    for (const patch of patches) {
      if (patchStatus[patch.id] !== 'applied') {
        await applyPatch(patch);
      }
    }
  };

  const priorityOrder = { critical: 0, high: 1, medium: 2 };
  const sortedPatches = patches
    ? [...patches].sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3))
    : [];

  const appliedCount = Object.values(patchStatus).filter(s => s === 'applied').length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Auto-Remediate
            {patches && (
              <span className="text-[10px] font-semibold bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                {appliedCount}/{patches.length} applied
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {patches
              ? 'Review and apply AI-generated firewall rules and configuration patches.'
              : 'Generate targeted patches and firewall rules for the detected vulnerabilities.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {patches && appliedCount < patches.length && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
              onClick={applyAll}
              disabled={Object.values(patchStatus).some(s => s === 'applying')}
            >
              <Zap className="w-3.5 h-3.5" /> Apply All
            </Button>
          )}
          <Button
            size="sm"
            onClick={generatePatches}
            disabled={!hasVulns || isGenerating}
            className="gap-1.5"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldPlus className="w-3.5 h-3.5" />}
            {isGenerating ? 'Generating…' : patches ? 'Regenerate' : 'Generate Patches'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {!hasVulns && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Run an AI analysis first to identify vulnerabilities, then generate patches here.
          </p>
        )}

        {hasVulns && !patches && !isGenerating && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Click <strong className="text-foreground">Generate Patches</strong> to get AI-suggested firewall rules and configuration fixes for the {vulnerabilities.length} detected vulnerabilities.
          </p>
        )}

        {isGenerating && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating incident response patches…</p>
          </div>
        )}

        {sortedPatches.length > 0 && (
          <div className="space-y-2">
            {sortedPatches.map(patch => (
              <PatchCard
                key={patch.id}
                patch={patch}
                applied={patchStatus[patch.id] === 'applied'}
                applying={patchStatus[patch.id] === 'applying'}
                onApply={applyPatch}
              />
            ))}
          </div>
        )}

        {/* Terminal apply log */}
        {applyLog.length > 0 && (
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/40">
              <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Patch Output</span>
              {allApplied && (
                <span className="ml-auto flex items-center gap-1 text-primary text-[10px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> All patches applied — node restored to healthy
                </span>
              )}
            </div>
            <div className="p-3 max-h-44 overflow-y-auto space-y-0.5">
              {applyLog.map((line, i) => (
                <p key={i} className={`text-xs font-mono leading-relaxed ${
                  line.includes('✓') ? 'text-primary' :
                  line.startsWith('  $') ? 'text-accent' :
                  line.startsWith('  #') ? 'text-amber-400' :
                  'text-muted-foreground'
                }`}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}