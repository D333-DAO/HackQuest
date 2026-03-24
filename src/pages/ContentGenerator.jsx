import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Wand2, Server, BookOpen, Brain, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CATEGORIES = ['linux', 'windows', 'web_hacking', 'networking', 'cryptography', 'forensics', 'reverse_engineering', 'privilege_escalation', 'osint', 'other'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const TYPES = [
  { id: 'room', label: 'CTF Room / Machine', icon: Server, description: 'Generate a full pentesting room with tasks and questions in HackTheBox style' },
  { id: 'quiz', label: 'Knowledge Quiz', icon: Brain, description: 'Generate an 8-question multiple choice quiz on any security topic' },
  { id: 'path', label: 'Learning Path', icon: BookOpen, description: 'Generate a structured learning path description and metadata' },
];

function GeneratorForm({ type, onGenerate, isGenerating }) {
  const [category, setCategory] = useState('linux');
  const [difficulty, setDifficulty] = useState('easy');
  const [topic, setTopic] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Topic / Name</label>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder={type === 'room' ? 'e.g., Apache Tomcat RCE, Active Directory Kerberoasting...' : type === 'quiz' ? 'e.g., Buffer Overflows, Web Shells, Privilege Escalation...' : 'e.g., Red Team Operations, Cloud Pentesting...'}
          className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 text-sm"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Difficulty</label>
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 text-sm"
          >
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <Button
        onClick={() => onGenerate({ type, category, difficulty, topic })}
        disabled={isGenerating || !topic.trim()}
        className="w-full"
      >
        {isGenerating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating with AI...</>
        ) : (
          <><Wand2 className="w-4 h-4" /> Generate {type === 'room' ? 'Room' : type === 'quiz' ? 'Quiz' : 'Path'}</>
        )}
      </Button>
    </div>
  );
}

function GeneratedPreview({ result, type, onSave, isSaving }) {
  const [expanded, setExpanded] = useState(false);

  if (!result) return null;

  return (
    <div className="mt-6 border border-primary/30 rounded-xl bg-primary/5 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">{result.title}</span>
          {result.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
              result.difficulty === 'easy' ? 'bg-primary/10 text-primary border-primary/20' :
              result.difficulty === 'medium' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
              'bg-destructive/10 text-destructive border-destructive/20'
            }`}>{result.difficulty}</span>
          )}
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          <p className="text-sm text-muted-foreground">{result.description}</p>
          {type === 'room' && result.tasks && (
            <div className="space-y-2">
              {result.tasks.map((task, i) => (
                <div key={i} className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{task.questions?.length} questions</p>
                </div>
              ))}
            </div>
          )}
          {type === 'quiz' && result.questions && (
            <div className="space-y-2">
              {result.questions.slice(0, 3).map((q, i) => (
                <div key={i} className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-foreground">{i + 1}. {q.question}</p>
                </div>
              ))}
              {result.questions.length > 3 && (
                <p className="text-xs text-muted-foreground">+ {result.questions.length - 3} more questions...</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="p-4 border-t border-border">
        <Button onClick={onSave} disabled={isSaving} size="sm" className="w-full">
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save to Platform'}
        </Button>
      </div>
    </div>
  );
}

export default function ContentGenerator() {
  const [activeType, setActiveType] = useState('room');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [savedItems, setSavedItems] = useState([]);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const isAdmin = user?.role === 'admin';

  const handleGenerate = async ({ type, category, difficulty, topic }) => {
    setIsGenerating(true);
    setGeneratedResult(null);

    const prompt = type === 'room'
      ? `Generate a HackTheBox-style CTF machine/room for "${topic}". 
         Category: ${category}, Difficulty: ${difficulty}.
         Return a JSON object with:
         - title: string (machine name)
         - description: string (2-3 sentences describing the machine and attack path, realistic HTB style)
         - difficulty: "${difficulty}"
         - category: "${category}"
         - points: number (20 for easy, 30 for medium, 40 for hard)
         - tasks: array of 2-3 task objects, each with:
           - title: string (e.g. "Reconnaissance", "Initial Foothold", "Privilege Escalation")
           - description: string (what the task covers)
           - questions: array of 3-5 question objects, each with:
             - question: string (specific technical question about the exploitation step)
             - answer: string (short answer, e.g. flag placeholder "user"/"root" or specific technical answer)
             - hint: string (helpful hint without giving away the answer)
             - points: number (5-20)
         Make it realistic, educational, and aligned with real HTB machine styles. Use real CVEs, tools, and techniques.`
      : type === 'quiz'
      ? `Generate a cybersecurity quiz about "${topic}".
         Category: ${category}, Difficulty: ${difficulty}.
         Return a JSON object with:
         - title: string
         - description: string (what this quiz covers)
         - category: "${category}"
         - difficulty: "${difficulty}"
         - time_limit_minutes: number (10-20)
         - pass_threshold: 70
         - questions: array of exactly 8 multiple choice question objects, each with:
           - question: string
           - options: array of exactly 4 strings
           - correct_index: number (0-3)
           - explanation: string (explains why the answer is correct, educational)
           - points: 10
         Make questions technically accurate, educational, and relevant to real-world security scenarios.`
      : `Generate a cybersecurity learning path about "${topic}".
         Category: ${category === 'linux' || category === 'windows' ? 'offensive' : category === 'forensics' ? 'defensive' : 'general'}, Difficulty: ${difficulty}.
         Return a JSON object with:
         - title: string
         - description: string (3-4 sentences about what students will learn and the skills gained)
         - difficulty: "${difficulty === 'easy' ? 'beginner' : difficulty === 'medium' ? 'intermediate' : 'advanced'}"
         - category: "${category === 'linux' || category === 'windows' || category === 'web_hacking' ? 'offensive' : category === 'forensics' ? 'defensive' : 'general'}"
         - estimated_hours: number (10-60)`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: { type: 'object' },
    });

    setGeneratedResult(result);
    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!generatedResult) return;
    setIsSaving(true);

    if (activeType === 'room') {
      await base44.entities.Room.create(generatedResult);
      toast.success('Room saved to platform!');
    } else if (activeType === 'quiz') {
      await base44.entities.Quiz.create(generatedResult);
      toast.success('Quiz saved to platform!');
    } else {
      await base44.entities.LearningPath.create(generatedResult);
      toast.success('Learning path saved to platform!');
    }

    setSavedItems(prev => [{ ...generatedResult, type: activeType, savedAt: new Date() }, ...prev]);
    setGeneratedResult(null);
    setIsSaving(false);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <p className="text-foreground font-semibold">Admin Access Required</p>
          <p className="text-sm text-muted-foreground mt-1">This tool is only available to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Content Generator</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate HackTheBox-quality rooms, quizzes, and learning paths using AI</p>
      </div>

      {/* Type Selector */}
      <div className="grid grid-cols-3 gap-3">
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveType(t.id); setGeneratedResult(null); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeType === t.id
                ? 'border-primary/50 bg-primary/10'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <t.icon className={`w-5 h-5 mb-2 ${activeType === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className={`text-sm font-semibold ${activeType === t.id ? 'text-primary' : 'text-foreground'}`}>{t.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
          </button>
        ))}
      </div>

      {/* Generator Form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Generate {activeType === 'room' ? 'New Room' : activeType === 'quiz' ? 'New Quiz' : 'New Learning Path'}
        </h2>
        <GeneratorForm type={activeType} onGenerate={handleGenerate} isGenerating={isGenerating} />
        <GeneratedPreview result={generatedResult} type={activeType} onSave={handleSave} isSaving={isSaving} />
      </div>

      {/* Recently Saved */}
      {savedItems.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Recently Generated ({savedItems.length})</h2>
          <div className="space-y-2">
            {savedItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.type} • {item.difficulty || item.category}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}