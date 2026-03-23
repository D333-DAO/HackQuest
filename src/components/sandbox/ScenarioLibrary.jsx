import React, { useState, useMemo } from 'react';
import { ATTACK_SCENARIOS, SCENARIO_CATEGORIES } from '@/lib/attackScenarios';
import { DIFFICULTY_LEVELS, DEFAULT_DIFFICULTY } from '@/lib/attackDifficulty';
import { Play, Loader2, Search, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SEVERITY_STYLE = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  low:      'bg-primary/15 text-primary border-primary/30',
};

const ALL = 'All';

function ScenarioCard({ scenario, isSelected, isRunning, onSelect, onLaunch, targetMissing }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all duration-150 overflow-hidden ${
        isSelected
          ? `${scenario.bg} ${scenario.border} shadow-md`
          : 'bg-secondary/20 border-border hover:border-muted-foreground/40'
      }`}
    >
      {/* Main row */}
      <div
        className={`w-full text-left px-4 py-3 flex items-center gap-3 cursor-pointer ${isRunning ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => onSelect(scenario)}
      >
        <span className="text-xl flex-shrink-0">{scenario.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${isSelected ? scenario.color : 'text-foreground'}`}>
              {scenario.name}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_STYLE[scenario.severity]}`}>
              {scenario.severity.toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">{scenario.category}</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          className="p-1 rounded hover:bg-white/10 text-muted-foreground flex-shrink-0"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{scenario.description}</p>

          {scenario.defenseStrategy && (
            <div className="flex items-start gap-2 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
              <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-0.5">Defense Strategy</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{scenario.defenseStrategy}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {scenario.phases.map((p, i) => (
              <span key={i} className="text-[10px] bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                {i + 1}. {p.label}
              </span>
            ))}
          </div>

          {isSelected && (
            <Button
              size="sm"
              className="w-full gap-2 mt-1"
              disabled={targetMissing || isRunning}
              onClick={() => onLaunch(scenario)}
            >
              {isRunning
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Simulating...</>
                : <><Play className="w-3.5 h-3.5" /> Launch This Scenario</>
              }
            </Button>
          )}
          {isSelected && targetMissing && (
            <p className="text-[11px] text-muted-foreground text-center">Select a target VM first</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Difficulty Selector ────────────────────────────────────────────────────────
function DifficultySelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attack Difficulty</p>
      <div className="grid grid-cols-3 gap-2">
        {DIFFICULTY_LEVELS.map(d => {
          const isActive = value.id === d.id;
          return (
            <button
              key={d.id}
              onClick={() => onChange(d)}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-center transition-all ${
                isActive
                  ? `${d.activeBg} ${d.border} shadow-sm`
                  : 'bg-secondary/20 border-border hover:border-muted-foreground/40'
              }`}
            >
              <span className="text-lg">{d.icon}</span>
              <span className={`text-xs font-bold ${isActive ? d.color : 'text-foreground'}`}>{d.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{value.description}</p>
      {/* Difficulty param chips */}
      <div className="flex flex-wrap gap-1.5">
        {value.params.obfuscation_steps > 0 && (
          <span className="text-[9px] font-mono bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded-full">
            {value.params.obfuscation_steps} obfuscation steps
          </span>
        )}
        {value.params.exploit_chain_required && (
          <span className="text-[9px] font-mono bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded-full">
            exploit chaining
          </span>
        )}
        <span className="text-[9px] font-mono bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded-full">
          stealth: {value.params.stealth_level}
        </span>
        <span className="text-[9px] font-mono bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded-full">
          detection: {value.params.detection_difficulty}
        </span>
      </div>
    </div>
  );
}

export default function ScenarioLibrary({ target, isRunning, currentAttack, onLaunch }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);

  const filtered = useMemo(() => {
    return ATTACK_SCENARIOS.filter(s => {
      const matchCat = activeCategory === ALL || s.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const handleLaunch = (scenario) => {
    if (!target || isRunning) return;
    onLaunch(scenario, difficulty);
  };

  return (
    <div className="bg-card border border-border rounded-2xl flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          2. Choose Attack Scenario
          <span className="text-[10px] font-normal bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
            {ATTACK_SCENARIOS.length} scenarios
          </span>
        </h3>
      </div>

      {/* Difficulty Selector */}
      <DifficultySelector value={difficulty} onChange={setDifficulty} />

      <div className="border-t border-border" />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search scenarios..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-secondary/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {[ALL, ...SCENARIO_CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
              activeCategory === cat
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Scenario list */}
      <div className="space-y-1.5 overflow-y-auto max-h-72 pr-0.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No scenarios match your search.</p>
        ) : (
          filtered.map(s => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              isSelected={selected?.id === s.id}
              isRunning={isRunning}
              targetMissing={!target}
              onSelect={setSelected}
              onLaunch={handleLaunch}
            />
          ))
        )}
      </div>

      {/* Bottom launch button */}
      {selected && (
        <Button
          className="w-full gap-2 shrink-0"
          disabled={!target || isRunning}
          onClick={() => handleLaunch(selected)}
        >
          {isRunning
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Simulating Attack...</>
            : <><Play className="w-4 h-4" /> Launch — {selected.name} [{difficulty.label}]</>
          }
        </Button>
      )}
      {!target && (
        <p className="text-[11px] text-muted-foreground text-center -mt-2">Select a target VM first</p>
      )}
    </div>
  );
}