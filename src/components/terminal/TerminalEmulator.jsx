import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { base44 } from '@/api/base44Client';
import '@xterm/xterm/css/xterm.css';

const PROMPT = '\x1b[1;32mroot@kali\x1b[0m:\x1b[1;34m~\x1b[0m\x1b[1;33m#\x1b[0m ';

const WELCOME_LINES = (room) => [
  '\x1b[1;32m╔══════════════════════════════════════════════════╗\x1b[0m',
  '\x1b[1;32m║        Hack-Quest Interactive Terminal v2.0      ║\x1b[0m',
  '\x1b[1;32m╚══════════════════════════════════════════════════╝\x1b[0m',
  '',
  room
    ? `\x1b[1;33m[*]\x1b[0m Target: \x1b[1;36mtarget.htb\x1b[0m (10.10.10.10) — \x1b[1;35m${room.title}\x1b[0m`
    : '\x1b[1;33m[*]\x1b[0m Target: \x1b[1;36mtarget.htb\x1b[0m (10.10.10.10)',
  '\x1b[1;33m[*]\x1b[0m Attacker: \x1b[1;32m10.10.14.5\x1b[0m (kali)',
  '\x1b[90m[*] Commands are AI-simulated. Type \x1b[37mhelp\x1b[90m for command list.\x1b[0m',
  '',
];

export default function TerminalEmulator({ roomContext }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitRef = useRef(null);
  const inputRef = useRef('');
  const historyRef = useRef([]); // [{cmd, output}]
  const cmdHistoryRef = useRef([]); // for up-arrow navigation
  const cmdHistoryIdxRef = useRef(-1);
  const isLoadingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  const writePrompt = useCallback((term) => {
    term.write(PROMPT);
  }, []);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#d4d4d4',
        cursor: '#7cfc00',
        cursorAccent: '#000000',
        black: '#3c3c3c',
        red: '#f14c4c',
        green: '#23d18b',
        yellow: '#f5f543',
        blue: '#3b8eea',
        magenta: '#d670d6',
        cyan: '#29b8db',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f1897f',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      allowTransparency: true,
      scrollback: 2000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    // Welcome message
    WELCOME_LINES(roomContext).forEach(line => term.writeln(line));
    writePrompt(term);

    // Input handler
    term.onKey(({ key, domEvent }) => {
      if (isLoadingRef.current) return;

      const code = domEvent.keyCode;

      if (code === 13) {
        // Enter
        const cmd = inputRef.current.trim();
        term.writeln('');
        inputRef.current = '';
        cmdHistoryIdxRef.current = -1;
        if (cmd) handleCommand(cmd, term);
        else writePrompt(term);

      } else if (code === 8) {
        // Backspace
        if (inputRef.current.length > 0) {
          inputRef.current = inputRef.current.slice(0, -1);
          term.write('\b \b');
        }

      } else if (code === 38) {
        // Up arrow — history navigation
        const hist = cmdHistoryRef.current;
        if (hist.length === 0) return;
        cmdHistoryIdxRef.current = Math.min(cmdHistoryIdxRef.current + 1, hist.length - 1);
        const prev = hist[hist.length - 1 - cmdHistoryIdxRef.current];
        clearCurrentInput(term);
        inputRef.current = prev;
        term.write(prev);

      } else if (code === 40) {
        // Down arrow
        const hist = cmdHistoryRef.current;
        cmdHistoryIdxRef.current = Math.max(cmdHistoryIdxRef.current - 1, -1);
        clearCurrentInput(term);
        if (cmdHistoryIdxRef.current === -1) {
          inputRef.current = '';
        } else {
          const next = hist[hist.length - 1 - cmdHistoryIdxRef.current];
          inputRef.current = next;
          term.write(next);
        }

      } else if (code === 67 && domEvent.ctrlKey) {
        // Ctrl+C
        term.writeln('^C');
        inputRef.current = '';
        isLoadingRef.current = false;
        setIsLoading(false);
        writePrompt(term);

      } else if (code === 76 && domEvent.ctrlKey) {
        // Ctrl+L = clear
        term.clear();
        writePrompt(term);

      } else if (key.charCodeAt(0) >= 32) {
        inputRef.current += key;
        term.write(key);
      }
    });

    const ro = new ResizeObserver(() => fitAddon.fit());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      term.dispose();
    };
  }, []);

  const clearCurrentInput = (term) => {
    const len = inputRef.current.length;
    if (len > 0) term.write('\b \b'.repeat(len));
  };

  const handleCommand = async (cmd, term) => {
    // Add to command history
    cmdHistoryRef.current.push(cmd);

    // Clear handled locally
    if (cmd === 'clear' || cmd === 'cls') {
      term.clear();
      writePrompt(term);
      return;
    }

    // Loading indicator
    isLoadingRef.current = true;
    setIsLoading(true);
    term.write('\x1b[90m⟳ executing...\x1b[0m');

    let output = '';
    try {
      const res = await base44.functions.invoke('terminalExecute', {
        command: cmd,
        roomContext: roomContext || null,
        sessionHistory: historyRef.current.slice(-8),
      });

      output = res.data?.output ?? '';

      // Handle close action (exit/logout)
      if (res.data?.action === 'close') {
        term.writeln('\r\x1b[K\x1b[33mSession closed. Type any command to restart.\x1b[0m');
        historyRef.current = [];
        isLoadingRef.current = false;
        setIsLoading(false);
        writePrompt(term);
        return;
      }

      term.write('\r\x1b[K'); // clear "executing..."
      if (output) {
        output.split('\n').forEach(line => term.writeln(line));
      }
    } catch (e) {
      term.write('\r\x1b[K');
      term.writeln('\x1b[31mbash: connection error — check your network and retry\x1b[0m');
    }

    // Store in session history
    historyRef.current.push({ cmd, output: output.replace(/\x1b\[[0-9;]*m/g, '') });

    isLoadingRef.current = false;
    setIsLoading(false);
    writePrompt(term);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-2xl shadow-black/60">
      {/* macOS-style title bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 cursor-default" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110 cursor-default" />
          <div className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 cursor-default" />
        </div>
        <span className="text-xs text-[#666] font-mono flex-1 text-center">
          root@kali — bash
          {roomContext && <span className="ml-2 text-primary/70">({roomContext.title})</span>}
        </span>
        {isLoading && (
          <span className="text-xs text-primary font-mono animate-pulse">● running</span>
        )}
      </div>
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: '420px', padding: '6px', backgroundColor: '#0a0a0a' }}
      />
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#1a1a1a] border-t border-[#2a2a2a]">
        <span className="text-[10px] text-[#555] font-mono">
          ↑↓ history &nbsp;|&nbsp; ctrl+c cancel &nbsp;|&nbsp; ctrl+l clear
        </span>
        <span className="text-[10px] font-mono text-primary/50">
          {roomContext ? `target: ${roomContext.category}` : 'practice mode'}
        </span>
      </div>
    </div>
  );
}