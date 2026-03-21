import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Zap, ChevronDown, ChevronUp, GripVertical, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ScenarioPhaseEditor from '@/components/scenarios/ScenarioPhaseEditor';
import ScenarioLogEditor from '@/components/scenarios/ScenarioLogEditor';
import ScenarioCard from '@/components/scenarios/ScenarioCard';

const ALL_TARGETS = [
  { id: 'web-server',          label: 'Web Server'        },
  { id: 'db-server',           label: 'Database Server'   },
  { id: 'windows-workstation', label: 'Win Workstation'   },
  { id: 'iot-device',          label: 'IoT Device'        },
];

const SEVERITY_OPTS = [
  { value: 'medium',   label: 'Medium',   cls: 'bg-amber-500/20 text-amber-400 border-amber-400/30'       },
  { value: 'high',     label: 'High',     cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30'    },
  { value: 'critical', label: 'Critical', cls: 'bg-destructive/20 text-destructive border-destructive/30' },
];

const ICONS = ['💀','🔥','🕵️','🐛','🧨','⚡','☢️','🗡️','🕸️','🧬','💣','🦠'];

function emptyScenario() {
  return {
    name: '',
    icon: '💀',
    category: '',
    description: '',
    severity: 'medium',
    compatible_targets: [],
    phases: [{ label: 'Reconnaissance', duration: 1000 }],
    log_templates: [
      { type: 'attacker', messages: [''] },
      { type: 'ids',      messages: [''] },
      { type: 'firewall', messages: [''] },
      { type: 'siem',     messages: [''] },
    ],
  };
}

export default function ScenarioBuilder() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyScenario());
  const [editingId, setEditingId] = useState(null);
  const [saved, setSaved] = useState(false);

  const { data: scenarios = [] } = useQuery({
    queryKey: ['custom-scenarios'],
    queryFn: () => base44.entities.CustomScenario.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingId
      ? base44.entities.CustomScenario.update(editingId, data)
      : base44.entities.CustomScenario.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-scenarios'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setForm(emptyScenario());
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomScenario.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-scenarios'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Clean empty messages
    const cleaned = {
      ...form,
      log_templates: form.log_templates.map(t => ({
        ...t,
        messages: t.messages.filter(m => m.trim()),
      })).filter(t => t.messages.length > 0),
    };
    saveMutation.mutate(cleaned);
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({
      name: s.name || '',
      icon: s.icon || '💀',
      category: s.category || '',
      description: s.description || '',
      severity: s.severity || 'medium',
      compatible_targets: s.compatible_targets || [],
      phases: s.phases?.length ? s.phases : [{ label: '', duration: 1000 }],
      log_templates: s.log_templates?.length ? s.log_templates : emptyScenario().log_templates,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => { setEditingId(null); setForm(emptyScenario()); };

  const toggleTarget = (id) => {
    setForm(f => ({
      ...f,
      compatible_targets: f.compatible_targets.includes(id)
        ? f.compatible_targets.filter(t => t !== id)
        : [...f.compatible_targets, id],
    }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/AttackSimulator" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Attack Simulator
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-accent" />
          Scenario Builder
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create custom attack scenarios that appear in the Attack Simulator alongside built-in scenarios.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 space-y-6">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          {editingId ? '✏️ Editing Scenario' : '➕ New Scenario'}
          {editingId && (
            <button type="button" onClick={cancelEdit} className="ml-auto text-xs text-muted-foreground hover:text-foreground underline">Cancel</button>
          )}
        </h2>

        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Icon picker */}
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button
                  key={ic} type="button"
                  onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className={`text-xl w-9 h-9 rounded-lg border flex items-center justify-center transition-all
                    ${form.icon === ic ? 'border-primary bg-primary/20' : 'border-border bg-secondary/40 hover:bg-secondary'}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Scenario Name *</label>
            <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Zero-Day Exploit" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
            <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Exploit, Recon, Malware" />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this attack do?" className="h-20 resize-none" />
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Severity</label>
          <div className="flex gap-2 flex-wrap">
            {SEVERITY_OPTS.map(s => (
              <button
                key={s.value} type="button"
                onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                className={`px-4 py-1.5 rounded-full border text-xs font-semibold transition-all
                  ${form.severity === s.value ? s.cls + ' ring-2 ring-offset-1 ring-offset-card ring-current' : 'border-border text-muted-foreground hover:text-foreground bg-secondary/40'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compatible targets */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Compatible Targets</label>
          <div className="flex gap-2 flex-wrap">
            {ALL_TARGETS.map(t => (
              <button
                key={t.id} type="button"
                onClick={() => toggleTarget(t.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                  ${form.compatible_targets.includes(t.id)
                    ? 'bg-accent/20 border-accent/40 text-accent'
                    : 'border-border text-muted-foreground hover:text-foreground bg-secondary/40'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phases */}
        <ScenarioPhaseEditor
          phases={form.phases}
          onChange={(phases) => setForm(f => ({ ...f, phases }))}
        />

        {/* Log templates */}
        <ScenarioLogEditor
          templates={form.log_templates}
          onChange={(log_templates) => setForm(f => ({ ...f, log_templates }))}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending} className="gap-2 min-w-32">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : saved ? '✓ Saved!' : editingId ? 'Update Scenario' : 'Save Scenario'}
          </Button>
        </div>
      </form>

      {/* Saved scenarios list */}
      {scenarios.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Your Custom Scenarios ({scenarios.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenarios.map(s => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                onEdit={() => startEdit(s)}
                onDelete={() => deleteMutation.mutate(s.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}