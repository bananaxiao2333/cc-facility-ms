import { useState, useEffect } from 'react';
import { Card } from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';
import { fetchNodesSilent, fetchActiveRunsSilent } from '../api/cluster';
import { fetchGroupsSilent } from '../api/groups';
import { fetchActionsSilent } from '../api/actions';
import { fetchWorkflowsSilent } from '../api/workflows';

// ---- severity banner ----
function getAlarm(nodes) {
  if (!nodes.length) return { text: 'NO NODES REGISTERED — SYSTEM UNINITIALIZED', color: '#cd4246' };
  const online = nodes.filter(n => n.online).length;
  const pct = Math.round((online / nodes.length) * 100);
  if (pct === 100) return { text: 'ALL NODES ONLINE — CLUSTER HEALTHY', color: '#15b371' };
  if (pct >= 75) return { text: `${pct}% NODES ONLINE — CLUSTER NOMINAL`, color: '#c87619' };
  if (pct >= 50) return { text: `${pct}% NODES ONLINE — DEGRADED PERFORMANCE`, color: '#c87619' };
  if (pct > 0) return { text: `${pct}% NODES ONLINE — CRITICAL: MAJORITY OFFLINE`, color: '#cd4246' };
  return { text: 'ALL NODES OFFLINE — CLUSTER UNREACHABLE', color: '#cd4246' };
}

// ---- skeleton ----
const Skl = ({ w = '100%', h = 14 }) => (
  <div className="dash-skl" style={{ width: w, height: h }} />
);

// ---- main ----
export default function DashboardPage() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState(null);
  const [runs, setRuns] = useState(null);
  const [groups, setGroups] = useState(null);
  const [actions, setActions] = useState(null);
  const [workflows, setWorkflows] = useState(null);
  const [events, setEvents] = useState([]);

  const loaded = nodes && runs && groups && actions && workflows;

  useEffect(() => {
    const poll = () => {
      fetchNodesSilent().then(d => setNodes(d.nodes || [])).catch(() => {});
      fetchActiveRunsSilent().then(d => setRuns(d.runs || [])).catch(() => {});
      fetchGroupsSilent().then(d => setGroups(d.groups || [])).catch(() => {});
      fetchActionsSilent().then(d => setActions(d.actions || [])).catch(() => {});
      fetchWorkflowsSilent().then(d => setWorkflows(d.workflows || [])).catch(() => {});
    };
    poll();
    const iv = setInterval(poll, 20000);
    return () => clearInterval(iv);
  }, []);

  // Feed real-time events from nodes and runs
  useEffect(() => {
    if (!loaded) return;
    const feed = [];
    nodes.forEach(n => {
      if (n.online && n.lastSeen) {
        feed.push({ time: new Date(n.lastSeen).toLocaleTimeString(), text: `${n.name} heartbeat` });
      }
    });
    runs.filter(r => r.status === 'running').forEach(r => {
      feed.push({ time: new Date().toLocaleTimeString(), text: `"${r.workflowName}" on ${r.nodeName} · step ${r.currentStep}/${r.totalSteps}` });
    });
    setEvents(feed.slice(0, 12));
  }, [nodes, runs, loaded]);

  const alarm = nodes ? getAlarm(nodes) : { text: 'CONNECTING...', color: '#8f99a8' };
  const online = nodes ? nodes.filter(n => n.online).length : 0;
  const offline = nodes ? nodes.filter(n => !n.online).length : 0;
  const activeRuns = runs ? runs.filter(r => r.status === 'running').length : 0;
  const enabledWfs = workflows ? workflows.filter(w => w.enabled).length : 0;
  const assignedNodes = nodes ? nodes.filter(n => n.groupId).length : 0;

  return (
    <div className="dashboard-page">
      {/* Alarm Banner */}
      <div className="cluster-alarm-banner" style={{ borderColor: alarm.color }}>
        <div className="cluster-alarm-scroll">
          {[1, 2, 3, 4].map(i => <span key={i} className="cluster-alarm-item" style={{ color: alarm.color }}>{alarm.text}</span>)}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Dashboard</h1>
        <span style={{ fontSize: 13, color: 'var(--bp-palette-gray-3)' }}>{user.displayName || user.username}</span>
      </div>

      {/* Stat row — no backgrounds */}
      <div className="dash-stat-row">
        <div className="dash-stat-box dash-stat-box--flat">
          <div className="dash-stat-value" style={{ color: '#2d72d2' }}>{nodes ? nodes.length : <Skl w={40} h={36} />}</div>
          <div className="dash-stat-label">Nodes</div>
          <div className="dash-stat-sub">{loaded ? `${online} online · ${offline} offline` : <Skl w={80} />}</div>
        </div>
        <div className="dash-stat-box dash-stat-box--flat">
          <div className="dash-stat-value" style={{ color: '#c87619' }}>{groups ? groups.length : <Skl w={40} h={36} />}</div>
          <div className="dash-stat-label">Groups</div>
          <div className="dash-stat-sub">{loaded ? `${assignedNodes} assigned` : <Skl w={60} />}</div>
        </div>
        <div className="dash-stat-box dash-stat-box--flat">
          <div className="dash-stat-value" style={{ color: '#ac2f33' }}>{actions ? actions.length : <Skl w={40} h={36} />}</div>
          <div className="dash-stat-label">Actions</div>
        </div>
        <div className="dash-stat-box dash-stat-box--flat">
          <div className="dash-stat-value" style={{ color: '#15b371' }}>{workflows ? workflows.length : <Skl w={40} h={36} />}</div>
          <div className="dash-stat-label">Workflows</div>
          <div className="dash-stat-sub">{loaded ? `${enabledWfs} enabled · ${activeRuns} running` : <Skl w={80} />}</div>
        </div>
      </div>

      {/* Main grid */}
      <div className="dash-grid">
        {/* Nodes */}
        <Card className="dash-card">
          <h3 className="cluster-section-title">Cluster Nodes</h3>
          {!nodes ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Skl /><Skl w="80%" /><Skl w="60%" /></div>
          : nodes.length === 0 ? <p className="cluster-detail-placeholder">No nodes registered.</p>
          : (
            <div className="dash-node-list">
              {nodes.slice(0, 10).map(n => (
                <div key={n.id} className="dash-node-row">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: n.online ? '#15b371' : '#cd4246', flexShrink: 0 }} />
                  <span className="dash-node-name">{n.name}</span>
                  <span className="dash-node-group">{groups?.find(g => g.id === n.groupId)?.name || '—'}</span>
                  <span className="dash-node-battery">{n.online ? 'ON' : 'OFF'}</span>
                  <span className="dash-node-status" style={{ background: n.online ? '#15b371' : '#cd4246' }}>{n.online ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Workflow Runs */}
        <Card className="dash-card">
          <h3 className="cluster-section-title">Workflow Runs</h3>
          {!runs ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Skl /><Skl w="70%" /><Skl w="50%" /></div>
          : runs.length === 0 ? <p className="cluster-detail-placeholder">No workflow runs.</p>
          : (
            <div className="dash-run-list">
              {runs.slice(0, 8).map(r => {
                const pct = r.totalSteps > 0 ? Math.round((r.currentStep / r.totalSteps) * 100) : 0;
                return (
                  <div key={r.key} className="dash-run-row">
                    <div className="dash-run-name">{r.workflowName}</div>
                    <div className="dash-run-meta">
                      <span>{r.nodeName}</span>
                      <span className="dash-run-status" style={{ color: r.status === 'running' ? '#15b371' : '#c87619' }}>{r.status.toUpperCase()}</span>
                    </div>
                    <div className="dash-run-progress"><div className="dash-run-bar" style={{ width: pct + '%' }} /></div>
                    <div className="dash-run-foot">
                      <span>Step {r.currentStep}/{r.totalSteps}</span>
                      <span>{r.triggerType} · {r.startedAt ? Math.round((Date.now() - r.startedAt) / 1000) + 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Groups */}
        <Card className="dash-card">
          <h3 className="cluster-section-title">Groups</h3>
          {!groups ? <div style={{ display: 'flex', gap: 8 }}><Skl w={60} h={28} /><Skl w={60} h={28} /><Skl w={60} h={28} /></div>
          : groups.length === 0 ? <p className="cluster-detail-placeholder">No groups defined.</p>
          : (
            <div className="dash-group-grid">
              {groups.map(g => {
                const gn = nodes ? nodes.filter(n => n.groupId === g.id).length : 0;
                return (
                  <div key={g.id} className="dash-group-chip">
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: g.color, flexShrink: 0 }} />
                    <span>{g.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--bp-palette-gray-4)' }}>{gn}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Action Library */}
        <Card className="dash-card">
          <h3 className="cluster-section-title">Action Library</h3>
          {!actions ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Skl /><Skl w="70%" /><Skl w="50%" /></div>
          : actions.length === 0 ? <p className="cluster-detail-placeholder">No actions defined.</p>
          : (
            <div className="dash-action-list">
              {actions.slice(0, 8).map(a => (
                <div key={a.id} className="dash-action-row">
                  <span>{a.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--bp-palette-gray-4)' }}>{a.params?.length || 0} params</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Event Feed */}
        <Card className="dash-card">
          <h3 className="cluster-section-title">CCFMS Broadcast</h3>
          {events.length === 0 ? (
            <p className="cluster-detail-placeholder">{loaded ? 'No recent events.' : 'Loading...'}</p>
          ) : (
            <div className="dash-event-list">
              {events.map((e, i) => (
                <div key={i} className="dash-event-row">
                  <span className="dash-event-time">[{e.time}]</span>
                  <span>{e.text}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
