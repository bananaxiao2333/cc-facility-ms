import { useState, useEffect, useRef } from 'react';
import { H1, Card } from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';
import { fetchNodesSilent } from '../api/cluster';

const ALARMS = [
  'SYSCHECK OK — ALL CONTAINMENT PROTOCOLS NOMINAL',
  'NOTICE — FACILITY POWER GRID OPERATIONAL',
];

// ---- typewriter ----

function useTypewriterOnce(messages) {
  const [lines, setLines] = useState([]);
  const [current, setCurrent] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !messages.length) return;
    startedRef.current = true;
    playAll(messages, 0);
  }, [messages]);

  const playAll = (queue, idx) => {
    if (idx >= queue.length) return;
    let i = 0;
    const text = queue[idx];
    setCurrent('');
    const iv = setInterval(() => {
      if (i < text.length) {
        setCurrent(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(iv);
        setLines((prev) => [...prev, text]);
        setCurrent('');
        setTimeout(() => playAll(queue, idx + 1), 200);
      }
    }, 25);
  };

  return { lines, current };
}

function buildBroadcast(nodes) {
  if (!nodes.length) return ['CCFMS // No cluster nodes registered. Awaiting deployment.'];
  const lines = ['CCFMS // Initializing facility diagnostic sweep...'];
  for (const n of nodes) {
    const pos = n.position ? ` [${n.position.x},${n.position.y},${n.position.z}]` : ' [GPS —]';
    if (n.status === 'online') {
      lines.push(`CCFMS // Node ${n.name} — online, battery ${n.battery}%${pos}. Task: ${n.task || 'idle'}.`);
    } else if (n.status === 'offline') {
      const seen = n.lastSeen ? ` Last seen ${Math.round((Date.now() - n.lastSeen) / 1000)}s ago.` : '';
      lines.push(`CCFMS // Node ${n.name} — OFFLINE.${seen}`);
    } else {
      lines.push(`CCFMS // Node ${n.name} — ${n.status}.`);
    }
  }
  const online = nodes.filter(n => n.status === 'online').length;
  const offline = nodes.filter(n => n.status === 'offline').length;
  lines.push(`CCFMS // Sweep complete. ${online}/${nodes.length} operational.${offline ? ' ' + offline + ' offline.' : ''}`);
  lines.push('CCFMS // Standing by.');
  return lines;
}

// ---- main ----

export default function DashboardPage() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState([]);
  const terminalRef = useRef(null);

  const broadcastLines = useRef(['CCFMS // Loading...']);
  if (nodes.length) broadcastLines.current = buildBroadcast(nodes);
  const { lines, current } = useTypewriterOnce(broadcastLines.current);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [lines, current]);

  useEffect(() => {
    fetchNodesSilent().then(d => setNodes(d.nodes || [])).catch(() => {});
    const iv = setInterval(() => {
      fetchNodesSilent().then(d => setNodes(d.nodes || [])).catch(() => {});
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  const online = nodes.filter(n => n.status === 'online').length;
  const offline = nodes.filter(n => n.status === 'offline').length;

  return (
    <div className="dashboard-page">
      {/* Alarm Banner */}
      <div className="cluster-alarm-banner">
        <div className="cluster-alarm-scroll">
          {[...ALARMS, ...ALARMS].map((a, i) => (
            <span key={i} className="cluster-alarm-item">{a}</span>
          ))}
        </div>
      </div>

      <H1>Dashboard</H1>
      <p style={{ marginBottom: 24, color: 'var(--bp-palette-gray-3)' }}>
        Welcome back, {user.displayName || user.username}.
      </p>

      {/* Stat cards */}
      <div className="dashboard-stats">
        <StatCard label="Cluster Nodes" value={nodes.length} />
        <StatCard label="Online" value={online} intent="online" />
        <StatCard label="Offline" value={offline} intent="offline" />
        <StatCard label="Role" value={user.role} />
      </div>

      {/* Broadcast terminal */}
      <Card className="cluster-terminal-card" style={{ marginTop: 24 }}>
        <h3 className="cluster-section-title">
          CCFMS Broadcast
          <span className="cluster-terminal-badge">LIVE</span>
        </h3>
        <div className="cluster-terminal" ref={terminalRef}>
          {lines.map((line, i) => (
            <div key={i} className="cluster-terminal-line">{line}</div>
          ))}
          {current && (
            <div className="cluster-terminal-line cluster-terminal-line--active">
              {current}<span className="cluster-terminal-cursor">|</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, intent }) {
  const color = intent === 'online' ? 'var(--bp-intent-success-rest)'
    : intent === 'offline' ? 'var(--bp-intent-danger-rest)'
    : 'var(--bp-palette-gray-1)';
  return (
    <Card style={{ minWidth: 140, textAlign: 'center', padding: '20px 24px' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--bp-palette-gray-3)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{label}</div>
    </Card>
  );
}
