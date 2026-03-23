import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Swords, Play, Loader2, RotateCcw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MitreTechniqueChain from '@/components/mitre/MitreTechniqueChain';
import MitreTargetConfig from '@/components/mitre/MitreTargetConfig';
import MitreDifficultyPanel from '@/components/mitre/MitreDifficultyPanel';
import MitreSimulationOutput from '@/components/mitre/MitreSimulationOutput';
import { base44 } from '@/api/base44Client';

export default function MitreScenarioBuilder() {
  const [techniques, setTechniques] = useState([]);
  const [target, setTarget] = useState(null);
  const [difficulty, setDifficulty] = useState({
    stealth: 50,
    evasion: 30,
    persistence: 20,
    noise: 40,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const canRun = techniques.length > 0 && target;

  const handleRun = async () => {
    if (!canRun) return;
    setLoading(true);
    setResult(null);

    const chainDesc = techniques.map((t, i) => `${i + 1}. ${t.id} — ${t.name} (${t.tactic})`).join('\n');

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an elite red-team simulation engine. Simulate the following chained MITRE ATT&CK technique sequence against the described target.

TARGET:
- Name: ${target.name}
- OS: ${target.os}
- IP: ${target.ip}
- Services: ${target.services.join(', ')}
- Patch Level: ${target.patchLevel}
- Firewall: ${target.firewall}
- EDR: ${target.edr}

TECHNIQUE CHAIN:
${chainDesc}

ATTACKER PROFILE:
- Stealth level: ${difficulty.stealth}/100 (higher = quieter, slower)
- Evasion sophistication: ${difficulty.evasion}/100 (higher = more obfuscation/LOLbins)
- Persistence focus: ${difficulty.persistence}/100 (higher = more persistence mechanisms)
- Noise tolerance: ${difficulty.noise}/100 (higher = louder, faster but more detectable)

For each technique in the chain, generate:
1. Realistic attacker commands/payloads
2. System/EDR/firewall responses
3. Whether the technique succeeded, was detected, or was blocked

Also generate:
- An overall campaign outcome (success / partial / blocked)
- A kill chain narrative paragraph
- 3-5 key indicators of compromise (IOCs)
- Detection opportunities per technique

Return JSON matching the schema.`,
      response_json_schema: {
        type: 'object',
        properties: {
          campaign_outcome: { type: 'string' },
          kill_chain_narrative: { type: 'string' },
          technique_results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                technique_id: { type: 'string' },
                technique_name: { type: 'string' },
                outcome: { type: 'string' },
                commands: { type: 'array', items: { type: 'string' } },
                system_response: { type: 'string' },
                detection_opportunity: { type: 'string' },
                log_lines: { type: 'array', items: { type: 'string' } },
              }
            }
          },
          iocs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                value: { type: 'string' },
                context: { type: 'string' },
              }
            }
          },
          metrics: {
            type: 'object',
            properties: {
              techniques_succeeded: { type: 'number' },
              techniques_detected: { type: 'number' },
              techniques_blocked: { type: 'number' },
              overall_risk_score: { type: 'number' },
            }
          }
        }
      }
    });

    setResult(res);
    setLoading(false);
  };

  const handleReset = () => {
    setResult(null);
    setTechniques([]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Link to="/Dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Swords className="w-6 h-6 text-destructive" />
            MITRE ATT&CK Scenario Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chain real MITRE ATT&CK techniques, configure a target, tune attacker behaviour, and simulate the full kill chain.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          )}
          <Button
            size="sm"
            disabled={!canRun || loading}
            onClick={handleRun}
            className="gap-2 min-w-36"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Simulating...</>
              : <><Play className="w-4 h-4" /> Run Simulation</>
            }
          </Button>
        </div>
      </div>

      {/* Validation hint */}
      {!canRun && !loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 border border-border rounded-xl px-4 py-3">
          <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {techniques.length === 0 && !target && 'Add at least one MITRE technique and select a target to run the simulation.'}
          {techniques.length === 0 && target && 'Add at least one MITRE ATT&CK technique to the chain.'}
          {techniques.length > 0 && !target && 'Select a target configuration to run the simulation.'}
        </div>
      )}

      {/* Builder grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Technique chain — takes 2 cols */}
        <div className="xl:col-span-2 space-y-4">
          <MitreTechniqueChain techniques={techniques} onChange={setTechniques} />
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <MitreTargetConfig target={target} onChange={setTarget} />
          <MitreDifficultyPanel difficulty={difficulty} onChange={setDifficulty} />
        </div>
      </div>

      {/* Output */}
      {(result || loading) && (
        <MitreSimulationOutput result={result} loading={loading} techniques={techniques} />
      )}
    </div>
  );
}