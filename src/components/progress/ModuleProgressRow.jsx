import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MobileSelect } from '@/components/ui/MobileSelect';
import ProgressStatusBadge from './ProgressStatusBadge';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
];

export default function ModuleProgressRow({ module, onUpdated, onDeleted }) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    const updates = { status: newStatus };
    if (newStatus === 'completed' && !module.completion_date) {
      updates.completion_date = new Date().toISOString().split('T')[0];
    }
    if (newStatus !== 'completed') {
      updates.completion_date = null;
    }
    await base44.entities.CourseProgress.update(module.id, updates);
    toast.success('Progress updated');
    onUpdated();
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.CourseProgress.delete(module.id);
    toast.success('Module removed');
    onDeleted();
    setDeleting(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{module.module_title}</p>
        {module.completion_date && (
          <p className="text-xs text-muted-foreground mt-0.5">Completed {module.completion_date}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <MobileSelect
            value={module.status || 'not_started'}
            onValueChange={handleStatusChange}
            options={STATUS_OPTIONS}
            triggerClassName="text-xs py-1.5 px-2 h-auto min-h-0"
          />
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}