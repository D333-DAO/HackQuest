/**
 * Difficulty configuration for attack simulations.
 * Adjusts LLM prompt parameters for obfuscation, stealth, and chaining requirements.
 */

export const DIFFICULTY_LEVELS = [
  {
    id: 'novice',
    label: 'Novice',
    icon: '🟢',
    description: 'Straightforward, noisy attack with minimal evasion. Defenses detect everything.',
    color: 'text-green-400',
    border: 'border-green-400/30',
    bg: 'bg-green-400/10',
    activeBg: 'bg-green-400/20',
    params: {
      obfuscation_steps: 0,
      stealth_level: 'none',
      exploit_chain_required: false,
      detection_difficulty: 'easy',
      log_count: '10-12',
      success_rate: 'low',
      evasion_techniques: 'none',
    },
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: '🟡',
    description: 'Attacker uses basic obfuscation and timing delays to evade some detection systems.',
    color: 'text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
    activeBg: 'bg-amber-400/20',
    params: {
      obfuscation_steps: 2,
      stealth_level: 'moderate',
      exploit_chain_required: true,
      detection_difficulty: 'medium',
      log_count: '13-16',
      success_rate: 'medium',
      evasion_techniques: 'traffic fragmentation, slow-rate scanning, user-agent spoofing',
    },
  },
  {
    id: 'expert',
    label: 'Expert',
    icon: '🔴',
    description: 'APT-level attack with heavy obfuscation, living-off-the-land techniques, and multi-stage exploit chains. Very hard to detect.',
    color: 'text-red-400',
    border: 'border-red-400/30',
    bg: 'bg-red-400/10',
    activeBg: 'bg-red-400/20',
    params: {
      obfuscation_steps: 5,
      stealth_level: 'maximum',
      exploit_chain_required: true,
      detection_difficulty: 'hard',
      log_count: '16-20',
      success_rate: 'high',
      evasion_techniques: 'polymorphic payloads, LOLBins, DNS tunneling for C2, process hollowing, timestomping, log tampering',
    },
  },
];

export const DEFAULT_DIFFICULTY = DIFFICULTY_LEVELS[0];

export function getDifficultyById(id) {
  return DIFFICULTY_LEVELS.find(d => d.id === id) || DEFAULT_DIFFICULTY;
}

/**
 * Builds the difficulty context string to inject into LLM prompts.
 */
export function buildDifficultyPromptContext(difficulty) {
  const p = difficulty.params;
  return `
ATTACK DIFFICULTY: ${difficulty.label.toUpperCase()}
- Stealth level: ${p.stealth_level}
- Obfuscation steps: ${p.obfuscation_steps} (${p.obfuscation_steps === 0 ? 'attacker makes no effort to hide — all traffic is loud and obvious' : p.obfuscation_steps <= 2 ? 'attacker uses basic evasion; most defenses catch it' : 'attacker uses heavy obfuscation; only behavioural detection may catch it'})
- Evasion techniques used: ${p.evasion_techniques || 'none'}
- Exploit chaining: ${p.exploit_chain_required ? 'YES — show multiple exploits chained together for privilege escalation or lateral movement' : 'NO — single, direct attack vector'}
- Detection difficulty: ${p.detection_difficulty} (${p.detection_difficulty === 'easy' ? 'all defenses fire immediately with high confidence' : p.detection_difficulty === 'medium' ? 'some detections are delayed or uncertain' : 'most signature-based defenses miss the attack entirely; only anomaly detection flags it'})
- Attacker success rate: ${p.success_rate} (${p.success_rate === 'low' ? 'most attempts blocked' : p.success_rate === 'medium' ? 'some steps succeed, some fail' : 'most steps succeed; attacker achieves objective'})
- Expected log volume: ${p.log_count} log lines

Simulate the attack AUTHENTICALLY at this difficulty. Adjust attacker commands, defensive response timing, and detection accuracy accordingly.`;
}