import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, AlertTriangle, CheckCircle2, XCircle, ChevronRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Static IOC / signature library ────────────────────────────────────────
const IOC_SIGNATURES = [
  { id: 'sig-001', name: 'Mirai Botnet C2',        category: 'C2',           indicators: ['185.220.101.x', 'TCP/23', 'User-Agent: Go-http-client'] },
  { id: 'sig-002', name: 'Log4Shell Exploit',       category: 'RCE',          indicators: ['${jndi:ldap://', 'CVE-2021-44228', 'Port 1389'] },
  { id: 'sig-003', name: 'WannaCry Ransomware',     category: 'Ransomware',   indicators: ['SMB/445', 'ETERNALBLUE', 'MS17-010'] },
  { id: 'sig-004', name: 'Cobalt Strike Beacon',    category: 'C2',           indicators: ['HTTP GET /jquery-3.3.1.min.js', '208.67.222.x', 'sleep 60000'] },
  { id: 'sig-005', name: 'SQL Injection Probe',     category: 'Web Attack',   indicators: ["UNION SELECT", "' OR 1=1 --", 'sqlmap'] },
  { id: 'sig-006', name: 'Port Scan (Nmap)',         category: 'Recon',        indicators: ['SYN flood', 'TTL 64', 'Nmap NSE'] },
  { id: 'sig-007', name: 'XSS Payload',             category: 'Web Attack',   indicators: ['<script>alert(', 'document.cookie', 'onerror='] },
  { id: 'sig-008', name: 'SSH Brute Force',         category: 'Credential',   indicators: ['TCP/22', 'Failed password', 'root login'] },
  { id: 'sig-009', name: 'DNS Tunneling',           category: 'Exfiltration', indicators: ['TXT record > 512 bytes', 'iodine', 'base64 in subdomain'] },
  { id: 'sig-010', name: 'ICMP Flood DDoS',         category: 'DDoS',         indicators: ['ICMP type 8', 'pkt/s > 10000', 'TTL 128'] },
];

// ─── Traffic event generators ────────────────────────────────────────────────
const SOURCE_IPS = [
  '91.108.4.x','45.33.32.x','185.220.101.x','198.51.100.x','203.0.113.x',
  '10.0.0.x','172.16.0.x','208.67.222.x','192.0.2.x','104.21.x.x',
];
const DEST_PORTS  = [22, 23, 80, 443, 445, 1389, 3306, 3389, 8080, 1883];
const PROTOCOLS   = ['TCP', 'UDP', 'ICMP', 'HTTP', 'DNS', 'SMB'];
const COUNTRIES   = ['RU', 'CN', 'BR', 'US', 'KP', 'IR', 'UA', 'DE', 'NL', 'TW'];

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomIp() {
  const base = randomChoice(SOURCE_IPS);
  return base.replace('x', randomInt(1, 254));
}

function generateEvent() {
  const sig  = Math.random() < 0.55 ? randomChoice(IOC_SIGNATURES) : null;
  const ioc  = sig ? randomChoice(sig.indicators) : null;
  const proto = randomChoice(PROTOCOLS);
  const port  = randomChoice(DEST_PORTS);
  const srcIp = randomIp();
  const country = randomChoice(COUNTRIES);
  const severity = sig
    ? ['RCE','Ransomware','C2'].includes(sig.category) ? 'critical'
    : ['DDoS','Exfiltration'].includes(sig.category) ? 'high'
    : 'medium'
    : 'low';

  return {
    id:        `evt-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    time:      new Date(),
    srcIp,
    country,
    protocol:  proto,
    port,
    ioc,
    sig,
    severity,
    matched:   null,  // null = not answered, true/false = correct/wrong
  };
}

// ─── Severity config ──────────────────────────────────────────────────────────
const SEV = {
  critical: { cls: 'text-destructive bg-destructive/10 border-destructive/30', dot: 'bg-destructive' },
  high:     { cls: 'text-orange-400 bg-orange-500/10 border-orange-500/30',    dot: 'bg-orange-400' },
  medium:   { cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30',       dot: 'bg-amber-400'  },
  low:      { cls: 'text-primary bg-primary/10 border-primary/30',             dot: 'bg-primary'    },
};

const CAT_COLOR = {
  'C2':          'text-red-400',
  'RCE':         'text-orange-400',
  'Ransomware':  'text-destructive',
  'Web Attack':  'text-amber-400',
  'Recon':       'text-cyan-400',
  'Credential':  'text-purple-400',
  'Exfiltration':'text-pink-400',
  'DDoS':        'text-red-300',
};

// ─── Single event row ─────────────────────────────────────────────────────────
function EventRow({ event, onCorrelate, isActive, onSelect }) {
  const sev = SEV[event.severity] || SEV.low;

  return (
    <div
      className={`flex items-start gap-2.5 px-3 py-2 border-b border-border/50 cursor-pointer transition-colors ${
        isActive ? 'bg-accent/5' : 'hover:bg-secondary/30'
      }`}
      onClick={onSelect}
    >
      {/* Severity dot */}
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${sev.dot}`} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-muted-foreground">
            {event.time.toLocaleTimeString()}
          </span>
          <span className="text-[10px] font-semibold text-foreground font-mono">{event.srcIp}</span>
          <span className="text-[10px] text-muted-foreground">→</span>
          <span className="text-[10px] font-mono text-accent">{event.protocol}/{event.port}</span>
          <span className="text-[10px] text-muted-foreground">[{event.country}]</span>
        </div>
        {event.ioc && (
          <p className="text-[10px] text-amber-400 font-mono mt-0.5 truncate">
            IOC: {event.ioc}
          </p>
        )}
        {event.sig && (
          <p className={`text-[10px] font-medium mt-0.5 ${CAT_COLOR[event.sig.category] || 'text-muted-foreground'}`}>
            ⚑ {event.sig.name}
            <span className="text-muted-foreground ml-1">({event.sig.category})</span>
          </p>
        )}
      </div>

      {/* Match result badge */}
      {event.matched === true && (
        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      )}
      {event.matched === false && (
        <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
      )}
      {event.matched === null && event.ioc && (
        <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
      )}
    </div>
  );
}

// ─── Correlation challenge panel ──────────────────────────────────────────────
function CorrelationPanel({ event, onAnswer, onClose }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const options = IOC_SIGNATURES.slice().sort(() => Math.random() - 0.5).slice(0, 4);
  // Make sure correct answer is in options
  const hasCorrect = event.sig && options.find(o => o.id === event.sig.id);
  if (event.sig && !hasCorrect) { options[3] = event.sig; }
  const shuffled = options.sort(() => Math.random() - 0.5);

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    const correct = event.sig ? selected === event.sig.id : selected === 'none';
    setTimeout(() => onAnswer(correct), 1000);
  };

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/40 border-b border-border">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          Correlate this IOC to a known attack signature
        </p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
      </div>
      <div className="p-4 space-y-3">
        {/* IOC details */}
        <div className="bg-secondary/30 rounded-lg px-3 py-2 space-y-1">
          <p className="text-[10px] text-muted-foreground">Source IP</p>
          <p className="text-xs font-mono text-foreground">{event.srcIp} [{event.country}]</p>
          {event.ioc && (
            <>
              <p className="text-[10px] text-muted-foreground mt-1">Observed IOC</p>
              <p className="text-xs font-mono text-amber-400">{event.ioc}</p>
            </>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">Protocol / Port</p>
          <p className="text-xs font-mono text-accent">{event.protocol}/{event.port}</p>
        </div>

        {/* Options */}
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Which attack signature matches?</p>
        <div className="space-y-1.5">
          {shuffled.map(opt => {
            const isCorrect = event.sig?.id === opt.id;
            let cls = 'border border-border bg-secondary/30 hover:bg-secondary/60';
            if (submitted) {
              cls = isCorrect ? 'border border-primary bg-primary/10' : selected === opt.id ? 'border border-destructive bg-destructive/10' : 'border border-border bg-secondary/20 opacity-50';
            } else if (selected === opt.id) {
              cls = 'border border-accent bg-accent/10';
            }
            return (
              <button
                key={opt.id}
                disabled={submitted}
                onClick={() => setSelected(opt.id)}
                className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${cls}`}
              >
                <p className="text-xs font-semibold text-foreground">{opt.name}</p>
                <p className={`text-[10px] ${CAT_COLOR[opt.category] || 'text-muted-foreground'}`}>{opt.category}</p>
              </button>
            );
          })}
          {!event.sig && (
            <button
              disabled={submitted}
              onClick={() => setSelected('none')}
              className={`w-full text-left rounded-lg px-3 py-2 border transition-colors ${selected === 'none' ? 'border-accent bg-accent/10' : 'border-border bg-secondary/30 hover:bg-secondary/60'}`}
            >
              <p className="text-xs font-semibold text-foreground">None — benign traffic</p>
            </button>
          )}
        </div>

        <Button size="sm" className="w-full gap-1.5" onClick={handleSubmit} disabled={!selected || submitted}>
          {submitted ? (event.sig ? event.sig.id === selected ? '✓ Correct!' : '✗ Wrong' : 'Done') : 'Submit Correlation'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export default function GlobalThreatFeed() {
  const [events, setEvents]       = useState([]);
  const [running, setRunning]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [score, setScore]         = useState({ correct: 0, total: 0 });
  const feedRef                   = useRef(null);
  const timerRef                  = useRef(null);

  const addEvent = useCallback(() => {
    const evt = generateEvent();
    setEvents(prev => [evt, ...prev].slice(0, 60));
  }, []);

  useEffect(() => {
    // Seed with initial events
    for (let i = 0; i < 8; i++) setEvents(prev => [generateEvent(), ...prev]);
  }, []);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(addEvent, 2200);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running, addEvent]);

  const handleAnswer = (correct) => {
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
    setEvents(prev => prev.map(e => e.id === selected.id ? { ...e, matched: correct } : e));
    setSelected(null);
  };

  const selectEvent = (evt) => {
    if (!evt.ioc && !evt.sig) return;
    if (evt.matched !== null) return;
    setSelected(evt);
  };

  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const iocCount      = events.filter(e => e.ioc).length;
  const accuracy      = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 ${running ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
          <span className="text-sm font-semibold text-foreground">Global Threat Feed</span>
          {running && (
            <span className="text-[9px] font-bold text-destructive bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 rounded-full tracking-widest">LIVE</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground">
            <span><span className="text-destructive font-semibold">{criticalCount}</span> critical</span>
            <span><span className="text-amber-400 font-semibold">{iocCount}</span> IOCs</span>
            {accuracy !== null && (
              <span><span className={`font-semibold ${accuracy >= 70 ? 'text-primary' : 'text-orange-400'}`}>{accuracy}%</span> accuracy</span>
            )}
          </div>
          <button
            onClick={() => setRunning(r => !r)}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
              running
                ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                : 'border-primary/30 text-primary hover:bg-primary/10'
            }`}
          >
            {running ? '⏸ Pause' : '▶ Resume'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-0">
        {/* Feed */}
        <div ref={feedRef} className="flex-1 overflow-y-auto max-h-72 lg:max-h-80 scrollbar-thin">
          {events.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Waiting for events…</p>
          )}
          {events.map(evt => (
            <EventRow
              key={evt.id}
              event={evt}
              isActive={selected?.id === evt.id}
              onSelect={() => selectEvent(evt)}
            />
          ))}
        </div>

        {/* Correlation panel */}
        {selected && (
          <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-border p-3">
            <CorrelationPanel
              event={selected}
              onAnswer={handleAnswer}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-border bg-secondary/20 flex items-center gap-2">
        <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
        <p className="text-[10px] text-muted-foreground">
          Click any event with an <span className="text-amber-400 font-medium">IOC</span> marker to correlate it to a known attack signature.
          {score.total > 0 && <span className="ml-1 text-primary font-medium">{score.correct}/{score.total} correct</span>}
        </p>
      </div>
    </div>
  );
}