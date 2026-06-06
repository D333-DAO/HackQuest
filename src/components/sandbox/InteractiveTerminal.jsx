import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Loader2, Trash2, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PROMPT_COLOR = 'text-primary';
const ERROR_COLOR  = 'text-red-400';
const INFO_COLOR   = 'text-cyan-400';
const SUCCESS_COLOR = 'text-green-400';
const DIM_COLOR    = 'text-slate-500';

// Commands that are valid to simulate
const KNOWN_COMMANDS = [
  'nmap', 'ping', 'ssh', 'curl', 'wget', 'traceroute', 'netstat', 'ss', 'arp',
  'dig', 'nslookup', 'whois', 'nikto', 'gobuster', 'hydra', 'sqlmap', 'nc',
  'netcat', 'telnet', 'ftp', 'scp', 'ifconfig', 'ip', 'route', 'iptables',
  'tcpdump', 'wireshark', 'ncat', 'masscan', 'dirb', 'wfuzz', 'medusa',
  'msfconsole', 'msfvenom', 'exploit', 'payload', 'enum4linux', 'smbclient',
  'rpcclient', 'ldapsearch', 'crackmapexec', 'impacket', 'hashcat', 'john',
  'aircrack-ng', 'reaver', 'wifite', 'metasploit', 'burpsuite',
];

// Local commands handled without AI
function handleLocalCommand(cmd, target) {
  const parts = cmd.trim().split(/\s+/);
  const base = parts[0].toLowerCase();

  if (base === 'help') {
    return {
      lines: [
        { text: 'Available simulation commands:', color: INFO_COLOR },
        { text: '  nmap <target>          — Port scan', color: 'text-slate-300' },
        { text: '  ping <target>          — ICMP reachability check', color: 'text-slate-300' },
        { text: '  ssh <user>@<target>    — SSH connection attempt', color: 'text-slate-300' },
        { text: '  curl <url>             — HTTP request', color: 'text-slate-300' },
        { text: '  traceroute <target>    — Network path trace', color: 'text-slate-300' },
        { text: '  dig <domain>           — DNS lookup', color: 'text-slate-300' },
        { text: '  arp -n                 — ARP table', color: 'text-slate-300' },
        { text: '  clear                  — Clear terminal', color: 'text-slate-300' },
        { text: '', color: '' },
        { text: 'Select a target node first, then run any pentesting tool.', color: DIM_COLOR },
      ],
      useAI: false,
    };
  }

  if (base === 'clear') return { clear: true, useAI: false };
  if (base === 'whoami') return { lines: [{ text: 'root', color: SUCCESS_COLOR }], useAI: false };
  if (base === 'id') return { lines: [{ text: 'uid=0(root) gid=0(root) groups=0(root)', color: 'text-slate-300' }], useAI: false };
  if (base === 'uname') return { lines: [{ text: 'Linux kali 6.1.0-kali9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.1.27 x86_64 GNU/Linux', color: 'text-slate-300' }], useAI: false };
  if (base === 'pwd') return { lines: [{ text: '/root', color: 'text-slate-300' }], useAI: false };
  if (base === 'ls') return {
    lines: [
      { text: 'tools/    exploits/    loot/    wordlists/    scripts/', color: SUCCESS_COLOR },
    ],
    useAI: false,
  };
  if (base === 'date') return { lines: [{ text: new Date().toString(), color: 'text-slate-300' }], useAI: false };

  const isKnown = KNOWN_COMMANDS.includes(base);
  if (!isKnown) {
    return {
      lines: [{ text: `bash: ${base}: command not found`, color: ERROR_COLOR }],
      useAI: false,
    };
  }

  // needs AI
  return { useAI: true };
}

function OutputLine({ line }) {
  return (
    <div className={`font-mono text-xs leading-relaxed ${line.color || 'text-slate-300'}`}>
      {line.text}
    </div>
  );
}

function PromptLine({ host, path = '~' }) {
  return (
    <span>
      <span className="text-red-400">root</span>
      <span className="text-slate-500">@</span>
      <span className="text-primary">kali</span>
      <span className="text-slate-500">:</span>
      <span className="text-cyan-400">{path}</span>
      <span className="text-white">$ </span>
    </span>
  );
}

export default function InteractiveTerminal({ target }) {
  const [history, setHistory] = useState([
    { type: 'banner', lines: [
      { text: '╔══════════════════════════════════════════════════════╗', color: 'text-primary' },
      { text: '║     Kali Linux Interactive Terminal — CyberLab v2     ║', color: 'text-primary' },
      { text: '╚══════════════════════════════════════════════════════╝', color: 'text-primary' },
      { text: 'Type "help" to see available commands.', color: DIM_COLOR },
      { text: 'Select a target node from the topology map above first.', color: DIM_COLOR },
      { text: '', color: '' },
    ]}
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);


  const inputRef  = useRef(null);

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history]);

  useEffect(() => {
    // Announce target change
    if (target) {
      setHistory(prev => [...prev, {
        type: 'system',
        lines: [
          { text: `[*] Target changed: ${target.name} (${target.ip}) — ${target.os}`, color: INFO_COLOR },
          { text: `[*] Open services: ${target.services.join(', ')}`, color: INFO_COLOR },
        ]
      }]);
    }
  }, [target?.id]);

  const runCommand = async (cmd) => {
    if (!cmd.trim()) return;

    // Add to cmd history
    setCmdHistory(prev => [cmd, ...prev].slice(0, 50));
    setHistoryIdx(-1);

    // Echo the command
    const cmdEntry = { type: 'cmd', cmd, target };

    const local = handleLocalCommand(cmd, target);

    if (local.clear) {
      setHistory([]);
      setInput('');
      return;
    }

    if (!local.useAI) {
      setHistory(prev => [...prev, cmdEntry, { type: 'output', lines: local.lines }]);
      setInput('');
      return;
    }

    // Requires AI simulation
    if (!target) {
      setHistory(prev => [...prev, cmdEntry, {
        type: 'output',
        lines: [{ text: 'Error: No target selected. Choose a node from the topology map.', color: ERROR_COLOR }]
      }]);
      setInput('');
      return;
    }

    setHistory(prev => [...prev, cmdEntry]);
    setInput('');
    setIsLoading(true);

    const prompt = `You are a cybersecurity lab terminal simulator running on Kali Linux.
The user is targeting a virtual machine:
- Name: ${target.name}
- IP: ${target.ip}
- OS: ${target.os}
- Open services/ports: ${target.services.join(', ')}

The user ran the following command against the target:
  ${cmd}

Simulate realistic terminal output for this command. Rules:
1. Output must be authentic-looking CLI output for the tool used
2. Include actual-looking IP addresses, port numbers, service versions, banners, hashes, paths, etc.
3. Some commands may succeed partially, some services may be filtered/closed
4. If it's a scan (nmap, masscan), show port table output
5. If it's an exploit attempt, show partial or full success/failure
6. Never break character — only output what the terminal would actually print
7. Max 25 lines of output. Be concise but realistic.
8. For SSH/FTP login attempts: sometimes succeed (show shell prompt), sometimes fail (auth error)

Return JSON:
{
  "lines": [
    { "text": "...", "type": "normal"|"success"|"error"|"info"|"dim" }
  ]
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          lines: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                type: { type: 'string' },
              }
            }
          }
        }
      }
    });

    setIsLoading(false);

    const colorMap = {
      success: SUCCESS_COLOR,
      error:   ERROR_COLOR,
      info:    INFO_COLOR,
      dim:     DIM_COLOR,
      normal:  'text-slate-300',
    };

    const lines = (result.lines || []).map(l => ({
      text: l.text,
      color: colorMap[l.type] || 'text-slate-300',
    }));

    setHistory(prev => [...prev, { type: 'output', lines }]);
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
      // basic autocomplete from known commands
      const match = KNOWN_COMMANDS.find(c => c.startsWith(input.toLowerCase()));
      if (match) setInput(match + ' ');
    }
  };

  const clearTerminal = () => setHistory([]);

  return (
    <div
      className="bg-[#0d1117] border border-border rounded-2xl overflow-hidden flex flex-col"
      style={{ minHeight: 420 }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border-b border-border shrink-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-amber-400/70" />
          <div className="w-3 h-3 rounded-full bg-primary/70" />
        </div>
        <Terminal className="w-3.5 h-3.5 text-muted-foreground ml-2" />
        <span className="text-xs text-muted-foreground font-mono flex-1">
          root@kali:~$
          {target && (
            <span className="ml-2 text-primary/70">— targeting {target.name} ({target.ip})</span>
          )}
        </span>
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
        <button
          onClick={(e) => { e.stopPropagation(); clearTerminal(); }}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          title="Clear terminal"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Output area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs" style={{ minHeight: 320 }}>
        {history.map((entry, i) => {
          if (entry.type === 'banner' || entry.type === 'output' || entry.type === 'system') {
            return (
              <div key={i} className="space-y-0.5">
                {entry.lines.map((line, j) => <OutputLine key={j} line={line} />)}
              </div>
            );
          }
          if (entry.type === 'cmd') {
            return (
              <div key={i} className="flex items-start gap-1 mt-2">
                <PromptLine />
                <span className="text-white break-all">{entry.cmd}</span>
              </div>
            );
          }
          return null;
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-primary text-xs mt-1">
            <span className="animate-pulse">▋</span>
            <span className="text-muted-foreground">Simulating...</span>
          </div>
        )}


      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-[#0d1117] shrink-0">
        <PromptLine />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="flex-1 bg-transparent outline-none text-white font-mono text-xs caret-primary placeholder-slate-600 disabled:opacity-50"
          placeholder={target ? `Enter command (e.g. nmap -sV ${target.ip})` : 'Select a target node to begin...'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        {input && (
          <button
            onClick={() => runCommand(input)}
            disabled={isLoading}
            className="text-primary hover:text-primary/70 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}