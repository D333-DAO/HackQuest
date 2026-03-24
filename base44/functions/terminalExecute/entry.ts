import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Stateless commands that don't need AI
const LOCAL_COMMANDS = {
  clear: null, // handled client-side
  help: `Supported commands:
  File System:   ls, pwd, cd, cat, mkdir, touch, rm, cp, mv, find, tree
  System:        whoami, id, uname, ps, top, df, free, env, uptime, hostname
  Network:       nmap, ping, ifconfig, ip a, netstat, curl, wget, traceroute
  Kali Tools:    nikto, dirb, gobuster, hydra, john, hashcat, sqlmap, wfuzz
  Exploitation:  msfconsole, msfvenom, searchsploit, exploit
  Crypto:        openssl, gpg, base64, md5sum, sha256sum
  Text Utils:    grep, awk, sed, cut, sort, wc, head, tail, strings
  Privilege:     sudo, su, chmod, chown, getcap, crontab
  Other:         clear, history, exit

Commands are AI-simulated in the context of your current room target.
Target IP: 10.10.10.10  |  Hostname: target.htb`,

  whoami: 'root',
  id: 'uid=0(root) gid=0(root) groups=0(root)',
  hostname: 'kali',
  pwd: '/root',
  uname: 'Linux kali 6.6.9-amd64 #1 SMP PREEMPT_DYNAMIC Kali Linux x86_64 GNU/Linux',
  uptime: ' 03:42:17 up 2:15,  1 user,  load average: 0.12, 0.08, 0.05',
  date: new Date().toUTCString(),
};

const DANGEROUS_COMMANDS = ['rm -rf /', 'mkfs', 'dd if=/dev/zero', 'fork bomb', ':(){ :|:& };:'];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { command, roomContext, sessionHistory } = await req.json();

  if (!command || !command.trim()) {
    return Response.json({ output: '' });
  }

  const cmd = command.trim();

  // Check for dangerous commands
  if (DANGEROUS_COMMANDS.some(d => cmd.toLowerCase().includes(d))) {
    return Response.json({
      output: `\x1b[31mDangerous command blocked: ${cmd}\x1b[0m\n\x1b[33mThis command could destroy the system. In a real pentest, think before you run!\x1b[0m`
    });
  }

  // Handle 'exit' / 'logout'
  if (cmd === 'exit' || cmd === 'logout') {
    return Response.json({ output: 'logout', action: 'close' });
  }

  // Static local commands
  const baseCmd = cmd.split(' ')[0].toLowerCase();
  if (LOCAL_COMMANDS[cmd] !== undefined || LOCAL_COMMANDS[baseCmd] !== undefined) {
    const out = LOCAL_COMMANDS[cmd] ?? LOCAL_COMMANDS[baseCmd];
    return Response.json({ output: out ?? '' });
  }

  // Build room context string
  const ctxLines = roomContext
    ? [
        `Room: "${roomContext.title}"`,
        `Category: ${roomContext.category}`,
        `Difficulty: ${roomContext.difficulty}`,
        `Description: ${roomContext.description || 'N/A'}`,
      ].join('\n')
    : 'General Kali Linux practice environment.';

  // Recent history for continuity
  const historyStr = (sessionHistory || [])
    .slice(-6)
    .map(h => `$ ${h.cmd}\n${h.output?.slice(0, 200)}`)
    .join('\n---\n');

  const prompt = `You are simulating an interactive Kali Linux terminal for cybersecurity students.

ENVIRONMENT:
- Shell: bash (running as root on Kali Linux)
- Target machine IP: 10.10.10.10
- Target hostname: target.htb
- Attacker IP: 10.10.14.5

ROOM CONTEXT:
${ctxLines}

RECENT TERMINAL HISTORY (for continuity):
${historyStr || '(session start)'}

USER RAN THIS COMMAND:
$ ${cmd}

INSTRUCTIONS:
1. Simulate REALISTIC terminal output as if this command ran against the room's target machine.
2. Be technically accurate — use real tool output formats (nmap XML-style results, gobuster directory listing style, etc).
3. For network/enumeration commands targeting the room's machine, return plausible results hinting at the room's attack path.
4. For file system commands, simulate a Kali /root directory with typical pentest files.
5. For service/tool startup (msfconsole, sqlmap, etc) show realistic banner and usage output.
6. Keep output under 25 lines. Be concise but informative.
7. Use ANSI escape codes for color where appropriate (e.g. \x1b[32m for green, \x1b[31m for red).
8. Raw terminal output ONLY — no markdown, no code blocks, no explanations outside the terminal output.
9. If command has a typo or doesn't exist: output "bash: <cmd>: command not found"`;

  let result = await base44.integrations.Core.InvokeLLM({ prompt });

  // Strip markdown code fences if AI adds them
  result = result.replace(/^```[a-z]*\n?/gm, '').replace(/^```$/gm, '').trim();

  return Response.json({ output: result });
});