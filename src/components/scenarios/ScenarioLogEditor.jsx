import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPE_META = {
  attacker: { label: 'Attacker',  color: 'text-destructive',  bg: 'bg-destructive/10 border-destructive/20'  },
  ids:      { label: 'IDS',       color: 'text-orange-400',   bg: 'bg-orange-500/10 border-orange-400/20'    },
  firewall: { label: 'Firewall',  color: 'text-primary',      bg: 'bg-primary/10 border-primary/20'          },
  siem:     { label: 'SIEM',      color: 'text-purple-400',   bg: 'bg-purple-500/10 border-purple-400/20'    },
  system:   { label: 'System',    color: 'text-accent',       bg: 'bg-accent/10 border-accent/20'            },
};

export default function ScenarioLogEditor({ templates, onChange }) {
  const updateMessage = (tIdx, mIdx, value) => {
    const updated = templates.map((t, ti) =>
      ti === tIdx ? { ...t, messages: t.messages.map((m, mi) => mi === mIdx ? value : m) } : t
    );
    onChange(updated);
  };

  const addMessage = (tIdx) => {
    const updated = templates.map((t, ti) =>
      ti === tIdx ? { ...t, messages: [...t.messages, ''] } : t
    );
    onChange(updated);
  };

  const removeMessage = (tIdx, mIdx) => {
    const updated = templates.map((t, ti) =>
      ti === tIdx ? { ...t, messages: t.messages.filter((_, mi) => mi !== mIdx) } : t
    );
    onChange(updated);
  };

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-2 block">
        Log Message Templates
        <span className="ml-1 opacity-60">— use <code className="bg-secondary px-1 rounded text-[10px]">{'{ip}'}</code> and <code className="bg-secondary px-1 rounded text-[10px]">{'{attacker_ip}'}</code> as placeholders</span>
      </label>

      <div className="space-y-3">
        {templates.map((tpl, tIdx) => {
          const meta = TYPE_META[tpl.type] || TYPE_META.system;
          return (
            <div key={tIdx} className={`border rounded-xl overflow-hidden ${meta.bg}`}>
              <div className={`flex items-center justify-between px-3 py-2 border-b ${meta.bg}`}>
                <span className={`text-[11px] font-bold ${meta.color}`}>[{tpl.type?.toUpperCase()}]</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => addMessage(tIdx)} className="h-6 gap-1 text-[10px] px-2">
                  <Plus className="w-3 h-3" /> Add line
                </Button>
              </div>
              <div className="p-2 space-y-1.5">
                {tpl.messages.map((msg, mIdx) => (
                  <div key={mIdx} className="flex items-center gap-1.5">
                    <span className={`text-[10px] shrink-0 font-mono ${meta.color}`}>›</span>
                    <input
                      type="text"
                      value={msg}
                      onChange={e => updateMessage(tIdx, mIdx, e.target.value)}
                      placeholder="Log message… e.g. sqlmap -u http://{ip}/login"
                      className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 border-0 outline-none font-mono py-0.5"
                    />
                    {tpl.messages.length > 1 && (
                      <button type="button" onClick={() => removeMessage(tIdx, mIdx)} className="text-muted-foreground/50 hover:text-destructive transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}