import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, ChevronDown, ChevronUp, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export default function TaskLearningMaterial({ task, room, taskIdx, isAdmin, onMaterialGenerated }) {
  const [expanded, setExpanded] = useState(true);
  const [generating, setGenerating] = useState(false);

  const material = task.learning_material;

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cybersecurity educator. Write comprehensive learning material for a CTF room task.

Room: "${room.title}" (${room.difficulty} ${room.category})
Task: "${task.title}"
Task description: "${task.description}"

Write educational content that:
1. Explains the core concepts and theory needed for this task
2. Covers relevant tools, techniques, and commands
3. Provides real-world context and examples
4. Guides the learner on how to approach the task (without giving away answers)

Format with markdown: use ## headings, **bold** for key terms, \`code\` for commands/tools, and bullet lists.
Length: 300-500 words. Be technical and practical.`,
    });

    // Save back to the room entity by updating the task's learning_material
    const updatedTasks = [...(room.tasks || [])];
    updatedTasks[taskIdx] = { ...updatedTasks[taskIdx], learning_material: result };
    await base44.entities.Room.update(room.id, { tasks: updatedTasks });

    onMaterialGenerated(result, taskIdx);
    setGenerating(false);
    setExpanded(true);
  };

  if (!material && !isAdmin) return null;

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Learning Material</span>
          {!material && isAdmin && (
            <span className="text-xs text-muted-foreground ml-1">(not yet generated)</span>
          )}
        </div>
        {material ? (
          expanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />
        ) : null}
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4">
          {material ? (
            <div className="prose prose-sm prose-invert max-w-none text-foreground
              [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-3 [&_h2]:mb-1
              [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-2 [&_h3]:mb-1
              [&_p]:text-xs [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:my-1
              [&_ul]:my-1 [&_ul]:ml-4 [&_li]:text-xs [&_li]:text-muted-foreground [&_li]:my-0.5
              [&_code]:bg-secondary [&_code]:text-primary [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
              [&_strong]:text-foreground [&_strong]:font-semibold">
              <ReactMarkdown>{material}</ReactMarkdown>
            </div>
          ) : isAdmin ? (
            <div className="py-2">
              <p className="text-xs text-muted-foreground mb-3">
                No learning material for this task yet. Generate it with AI to help users learn the concepts.
              </p>
              <Button size="sm" onClick={handleGenerate} disabled={generating} className="w-full sm:w-auto">
                {generating ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="w-3.5 h-3.5" /> Generate with AI</>
                )}
              </Button>
            </div>
          ) : null}

          {material && isAdmin && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <Button size="sm" variant="ghost" onClick={handleGenerate} disabled={generating} className="text-xs text-muted-foreground hover:text-primary">
                {generating ? <><Loader2 className="w-3 h-3 animate-spin" /> Regenerating...</> : <><Wand2 className="w-3 h-3" /> Regenerate</>}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}