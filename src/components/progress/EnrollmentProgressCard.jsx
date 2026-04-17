import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import ModuleProgressRow from './ModuleProgressRow';
import AIRecommendations from './AIRecommendations';
import { toast } from 'sonner';

function ProgressBar({ modules }) {
  const total = modules.length;
  const completed = modules.filter(m => m.status === 'completed').length;
  const inProgress = modules.filter(m => m.status === 'in_progress').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{completed}/{total} modules completed</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full flex">
          <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="text-primary font-medium">{completed} completed</span>
        <span className="text-amber-400">{inProgress} in progress</span>
        <span>{total - completed - inProgress} not started</span>
      </div>
    </div>
  );
}

export default function EnrollmentProgressCard({ enrollment }) {
  const [expanded, setExpanded] = useState(false);
  const [newModule, setNewModule] = useState('');
  const [adding, setAdding] = useState(false);
  const qc = useQueryClient();

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['course-progress', enrollment.id],
    queryFn: () => base44.entities.CourseProgress.filter({ enrollment_id: enrollment.id }),
    enabled: expanded,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['course-progress', enrollment.id] });

  const handleAddModule = async () => {
    if (!newModule.trim()) return;
    setAdding(true);
    await base44.entities.CourseProgress.create({
      enrollment_id: enrollment.id,
      module_title: newModule.trim(),
      status: 'not_started',
    });
    toast.success('Module added');
    setNewModule('');
    refresh();
    setAdding(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors text-left"
      >
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{enrollment.course_title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {enrollment.student_name}
            {enrollment.student_email && ` · ${enrollment.student_email}`}
          </p>
          {enrollment.enrollment_date && (
            <p className="text-xs text-muted-foreground">Enrolled {enrollment.enrollment_date}</p>
          )}
        </div>
        <div className="shrink-0 ml-3">
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Progress bar — only shown when modules exist */}
          {modules.length > 0 && <ProgressBar modules={modules} />}

          {/* Module list */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : modules.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No modules yet. Add one below.</p>
          ) : (
            <div className="space-y-2">
              {modules.map(m => (
                <ModuleProgressRow key={m.id} module={m} onUpdated={refresh} onDeleted={refresh} />
              ))}
            </div>
          )}

          {/* AI Recommendations */}
          {modules.length > 0 && (
            <AIRecommendations
              studentName={enrollment.student_name}
              studentEmail={enrollment.student_email}
              enrollments={[enrollment]}
              courseProgress={modules}
            />
          )}

          {/* Add module */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newModule}
              onChange={e => setNewModule(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddModule()}
              placeholder="Add module title..."
              className="flex-1 px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <Button size="sm" onClick={handleAddModule} disabled={adding || !newModule.trim()}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}