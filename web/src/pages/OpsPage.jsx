import { useState, useEffect } from 'react';
import { Card, Button, Intent, Tag, HTMLSelect } from '@blueprintjs/core';
import { fetchNodesSilent, fetchActiveRunsSilent, sendCommand, triggerWorkflow } from '../api/cluster';
import { fetchWorkflowsSilent } from '../api/workflows';
import { fetchGroups } from '../api/groups';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = { online: '#15b371', offline: '#cd4246' };
const INTENT_MAP = {
  ping: Intent.NONE, exec: Intent.PRIMARY, refuel: Intent.WARNING, sleep: Intent.NONE,
  scan: Intent.SUCCESS, dig: Intent.WARNING, forward: Intent.NONE, back: Intent.NONE,
  up: Intent.NONE, down: Intent.NONE, turnLeft: Intent.NONE, turnRight: Intent.NONE,
};

export default function OpsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [nodes, setNodes] = useState([]);
  const [runs, setRuns] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [target, setTarget] = useState('');
  const [log, setLog] = useState([]);

  useEffect(() => {
    const poll = () => {
      fetchNodesSilent().then(d => setNodes(d.nodes || [])).catch(() => {});
      fetchActiveRunsSilent().then(d => setRuns(d.runs || [])).catch(() => {});
      fetchWorkflowsSilent().then(d => setWorkflows(d.workflows || [])).catch(() => {});
      fetchGroups().then(d => setGroups(d.groups || [])).catch(() => {});
    };
    poll();
    const iv = setInterval(poll, 10000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!target && nodes.length > 0) setTarget(nodes[0].id);
  }, [nodes, target]);

  const addLog = (text, error) => setLog(p => [{ time: new Date().toLocaleTimeString(), text, error }, ...p].slice(0, 50));

  const online = nodes.filter(n => n.online).length;
  const activeRuns = runs.filter(r => r.status === 'running');
  const targetNode = nodes.find(n => n.id === target);
  const targetGroupName = groups.find(g => g.id === targetNode?.groupId)?.name;

  // Workflows for this node (direct + inherited)
  const directWfs = workflows.filter(w => w.nodeId === target);
  const inheritedWfs = workflows.filter(w => targetNode?.groupId && w.groupId === targetNode.groupId && w.nodeId !== target);

  const handleCmd = async (type, payload) => {
    if (!target) return;
    try {
      const data = await sendCommand(target, type, payload);
      addLog(`→ ${targetNode?.name}: ${type} ${JSON.stringify(payload)}`);
      toast.success(`Sent ${type} to ${targetNode?.name}`);
    } catch (err) {
      addLog(`ERR: ${err.message}`, true);
      toast.error(err.message);
    }
  };

  const handleTrigger = async (wf) => {
    if (!target) return;
    try {
      await triggerWorkflow(target, wf.id);
      addLog(`▶ ${wf.name} triggered on ${targetNode?.name}`);
      toast.success(`Triggered ${wf.name}`);
    } catch (err) { toast.error(err.message); }
  };

  const QuickCmd = ({ type, label, payload }) => (
    <Button text={label} small intent={INTENT_MAP[type] || Intent.NONE}
      onClick={() => handleCmd(type, payload || {})}
      disabled={!target} />
  );

  return (
    <div className="cluster-page">
      <div className="cluster-status-bar">
        <span className="cluster-stat">Nodes: <strong>{nodes.length}</strong></span>
        <span className="cluster-stat cluster-stat--online">Online: <strong>{online}</strong></span>
        <span className="cluster-stat">Runs: <strong>{activeRuns.length}</strong></span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--bp-palette-gray-3)' }}>Target:</span>
          <HTMLSelect value={target} onChange={e => setTarget(e.target.value)} minimal style={{ minWidth: 160 }}>
            <option value="">— Select node —</option>
            {nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.online ? 'ON' : 'OFF'})</option>)}
          </HTMLSelect>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {/* Commands */}
        <Card className="dash-card">
          <h3 className="cluster-section-title">Commands</h3>
          {targetNode && (
            <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--bp-palette-gray-3)' }}>
              Target: <strong>{targetNode.name}</strong>
              {targetGroupName && <span> · {targetGroupName}</span>}
              <Tag intent={targetNode.online ? Intent.SUCCESS : Intent.DANGER} style={{ marginLeft: 8, fontSize: 10 }}>
                {targetNode.online ? 'ONLINE' : 'OFFLINE'}
              </Tag>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            <QuickCmd type="ping" label="Ping" />
            <QuickCmd type="scan" label="Scan" />
            <QuickCmd type="report" label="Report" />
            <QuickCmd type="sleep" label="Sleep 1s" payload={{ ms: 1000 }} />
            <QuickCmd type="sleep" label="Sleep 5s" payload={{ ms: 5000 }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--bp-palette-gray-4)', marginBottom: 4 }}>Turtle movement:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            <QuickCmd type="forward" label="Forward" />
            <QuickCmd type="back" label="Back" />
            <QuickCmd type="up" label="Up" />
            <QuickCmd type="down" label="Down" />
            <QuickCmd type="turnLeft" label="Left" />
            <QuickCmd type="turnRight" label="Right" />
          </div>
          <div style={{ fontSize: 11, color: 'var(--bp-palette-gray-4)', marginBottom: 4 }}>Actions:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <QuickCmd type="dig" label="Dig" />
            <QuickCmd type="place" label="Place" />
            <QuickCmd type="suck" label="Suck" />
            <QuickCmd type="drop" label="Drop" />
            <QuickCmd type="refuel" label="Refuel" />
            <QuickCmd type="inspect" label="Inspect" />
          </div>
          {!target && <p className="cluster-detail-placeholder">Select a target node above.</p>}
        </Card>

        {/* Workflow triggers */}
        <Card className="dash-card">
          <h3 className="cluster-section-title">Workflow Triggers</h3>
          {activeRuns.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--bp-palette-gray-4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Active Runs <span style={{ color: '#15b371' }}>({activeRuns.length})</span>
              </div>
              {activeRuns.map(r => {
                const pct = r.totalSteps > 0 ? Math.round((r.currentStep / r.totalSteps) * 100) : 0;
                return (
                  <div key={r.key} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--bp-palette-light-gray-5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{r.workflowName}</strong>
                      <span style={{ color: 'var(--bp-palette-gray-4)', fontSize: 11 }}>{r.nodeName}</span>
                    </div>
                    <div className="dash-run-progress" style={{ marginTop: 4 }}>
                      <div className="dash-run-bar" style={{ width: pct + '%' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--bp-palette-gray-4)' }}>
                      <span>Step {r.currentStep}/{r.totalSteps}</span>
                      <span>{r.triggerType}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {target && (
            <>
              {directWfs.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--bp-palette-gray-4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Direct</div>
                  {directWfs.map(w => (
                    <Button key={w.id} text={w.name} small intent={Intent.PRIMARY}
                      onClick={() => handleTrigger(w)} style={{ marginBottom: 4 }} fill />
                  ))}
                </div>
              )}
              {inheritedWfs.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--bp-palette-gray-4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    Inherited from {targetGroupName || 'group'}
                  </div>
                  {inheritedWfs.map(w => (
                    <Button key={w.id} text={w.name} small onClick={() => handleTrigger(w)} style={{ marginBottom: 4 }} fill />
                  ))}
                </div>
              )}
              {directWfs.length === 0 && inheritedWfs.length === 0 && (
                <p className="cluster-detail-placeholder">No workflows available for this node.</p>
              )}
            </>
          )}
          {!target && <p className="cluster-detail-placeholder">Select a target node above.</p>}
        </Card>

        {/* Log */}
        <Card className="dash-card">
          <h3 className="cluster-section-title">Activity Log</h3>
          <div style={{ maxHeight: 400, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
            {log.length === 0 && <p className="cluster-detail-placeholder">No activity yet.</p>}
            {log.map((entry, i) => (
              <div key={i} style={{
                padding: '3px 0', borderBottom: '1px solid var(--bp-palette-light-gray-5)',
                color: entry.error ? 'var(--bp-intent-danger-rest)' : 'var(--bp-palette-gray-2)',
              }}>
                <span style={{ color: 'var(--bp-palette-gray-4)', marginRight: 8 }}>[{entry.time}]</span>
                {entry.text}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
