import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { base44 } from '@/api/base44Client';
import '@xterm/xterm/css/xterm.css';

const WELCOME_MSG = [
  '\x1b[1;32m╔══════════════════════════════════════════╗\x1b[0m',
  '\x1b[1;32m║   Kali Linux Practice Terminal v1.0      ║\x1b[0m',
  '\x1b[1;32m║   Powered by AI Simulation               ║\x1b[0m',
  '\x1b[1;32m╚══════════════════════════════════════════╝\x1b[0m',
  '',
  '\x1b[90mType Linux or Nmap commands to practice.\x1b[0m',
  '\x1b[90mExamples: ls, pwd, whoami, nmap -sV 10.10.10.10\x1b[0m',
  '\x1b[90mType \x1b[1;37mhelp\x1b[0m\x1b[90m for a list of supported commands.\x1b[0m',
  '',
];

const PROMPT = '\x1b[1;32mroot@kali\x1b[0m:\x1b[1;34m~\x1b[0m# ';

export default function TerminalEmulator({ roomContext }) {
  const terminalRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  const inputBufferRef = useRef('');
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        black: '#484f58',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#f0f6fc',
      },
      allowTransparency: true,
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Print welcome message
    WELCOME_MSG.forEach(line => term.writeln(line));
    term.write(PROMPT);

    // Handle keyboard input
    term.onKey(({ key, domEvent }) => {
      if (isLoadingRef.current) return;

      const code = domEvent.keyCode;

      if (code === 13) {
        // Enter
        const cmd = inputBufferRef.current.trim();
        term.writeln('');
        inputBufferRef.current = '';
        if (cmd) {
          executeCommand(cmd, term);
        } else {
          term.write(PROMPT);
        }
      } else if (code === 8) {
        // Backspace
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (key.charCodeAt(0) >= 32) {
        inputBufferRef.current += key;
        term.write(key);
      }
    });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
    };
  }, []);

  const executeCommand = async (cmd, term) => {
    // Local commands
    if (cmd === 'clear') {
      term.clear();
      term.write(PROMPT);
      return;
    }

    if (cmd === 'help') {
      const helpLines = [
        '\x1b[1;33mSupported command categories:\x1b[0m',
        '  \x1b[1;36mFile System:\x1b[0m   ls, pwd, cd, cat, mkdir, touch, rm, cp, mv, find',
        '  \x1b[1;36mSystem:\x1b[0m        whoami, id, uname, ps, top, df, free, env, history',
        '  \x1b[1;36mNetwork:\x1b[0m       nmap, ping, ifconfig, ip, netstat, curl, wget, ssh',
        '  \x1b[1;36mKali Tools:\x1b[0m    nmap, metasploit, aircrack-ng, nikto, dirb, john, hydra',
        '  \x1b[1;36mText:\x1b[0m          grep, awk, sed, cut, sort, wc, head, tail',
        '  \x1b[1;36mPrivilege:\x1b[0m     sudo, su, chmod, chown',
        '',
        '\x1b[90mCommands are AI-simulated for learning purposes.\x1b[0m',
      ];
      helpLines.forEach(l => term.writeln(l));
      term.write(PROMPT);
      return;
    }

    // AI-simulated execution
    isLoadingRef.current = true;
    setIsLoading(true);
    term.write('\x1b[90mExecuting...\x1b[0m');

    const contextInfo = roomContext
      ? `The user is practicing in a room titled "${roomContext.title}" (category: ${roomContext.category}, difficulty: ${roomContext.difficulty}).`
      : 'The user is practicing general Linux and security commands.';

    const prompt = `You are simulating a Kali Linux terminal for cybersecurity learning.
${contextInfo}

The user ran this command: \`${cmd}\`

Simulate realistic terminal output as if this command ran on Kali Linux against a practice target machine (IP: 10.10.10.10 if needed, hostname: target.thm).
- Be educational and realistic — show plausible output a student would see.
- For nmap scans, show realistic open ports and services.
- For file system commands, simulate a typical Kali home directory.
- For tools like metasploit, nikto, dirb, john, hydra — show realistic startup/usage output.
- Keep output concise but informative (max ~20 lines).
- Use plain text only, no markdown, no backticks. Just raw terminal output.
- If the command is dangerous (rm -rf /, etc), print an appropriate warning instead.
- If the command is completely unrecognized, print: "command not found: <cmd>"`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      // Clear the "Executing..." text
      term.write('\r\x1b[K');
      const lines = result.split('\n');
      lines.forEach(line => term.writeln(line));
    } catch (e) {
      term.write('\r\x1b[K');
      term.writeln('\x1b[31mError: Could not execute command. Please try again.\x1b[0m');
    }

    isLoadingRef.current = false;
    setIsLoading(false);
    term.write(PROMPT);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-[#0d1117]">
      {/* Terminal header bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-muted-foreground font-mono mx-auto">root@kali:~</span>
        {isLoading && (
          <span className="text-xs text-primary animate-pulse font-mono">processing...</span>
        )}
      </div>
      <div ref={terminalRef} className="w-full" style={{ height: '380px', padding: '8px' }} />
    </div>
  );
}