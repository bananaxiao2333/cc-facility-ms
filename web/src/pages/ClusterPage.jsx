import { useState, useEffect, useRef } from 'react';
import { Card, Button, Intent, Tag, MultistepDialog, DialogStep, DialogBody, FormGroup, InputGroup, HTMLSelect } from '@blueprintjs/core';
import { fetchNodes, fetchNodesSilent, sendCommand, registerNode, deleteNode } from '../api/cluster';
import turtleClientUrl from '@cc/turtle-client.lua?url';

const STATUS_COLORS = { online: '#15b371', offline: '#cd4246', maintenance: '#c87619' };

const GROUPS = [
  { id: 'group_1', name: '奇点' },
  { id: 'group_2', name: '星云' },
  { id: 'group_3', name: '脉冲星' },
  { id: 'group_4', name: '磁陀星' },
];

export default function ClusterPage() {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [cmdInput, setCmdInput] = useState('');
  const [cmdLog, setCmdLog] = useState([]);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [regOpen, setRegOpen] = useState(false);
  const firstLoad = useRef(true);

  const handleDelete = async (nodeId) => {
    setDeleting(true);
    try {
      await deleteNode(nodeId);
      setNodes(p => p.filter(n => n.id !== nodeId));
      if (selectedNode?.id === nodeId) setSelectedNode(null);
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  };

  useEffect(() => {
    const load = firstLoad.current ? fetchNodes : fetchNodesSilent;
    load().then(d => {
      setNodes(d.nodes || []);
      if (d.nodes?.length) setSelectedNode(p => p || d.nodes[0]);
    }).catch(() => {});
    firstLoad.current = false;
    const iv = setInterval(() => {
      fetchNodesSilent().then(d => setNodes(d.nodes || [])).catch(() => {});
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const handleSend = async (e) => {
    e?.preventDefault();
    const raw = cmdInput.trim();
    if (!raw || !selectedNode) return;
    const parts = raw.split(/\s+/);
    const type = parts[0];
    let payload = {};
    try { if (parts.length > 1) payload = JSON.parse(parts.slice(1).join(' ')); }
    catch { payload = { raw: parts.slice(1).join(' ') }; }
    setSending(true);
    try {
      const data = await sendCommand(selectedNode.id, type, payload);
      setCmdLog(p => [...p, { time: new Date().toLocaleTimeString(), text: `${type} → ${selectedNode.name}`, id: data.command?.id }]);
      setCmdInput('');
    } catch (err) {
      setCmdLog(p => [...p, { time: new Date().toLocaleTimeString(), text: `ERR: ${err.message}`, error: true }]);
    } finally { setSending(false); }
  };

  const online = nodes.filter(n => n.status === 'online').length;
  const offline = nodes.filter(n => n.status === 'offline').length;

  return (
    <div className="cluster-page">
      <div className="cluster-status-bar">
        <span className="cluster-stat">Nodes: <strong>{nodes.length}</strong></span>
        <span className="cluster-stat cluster-stat--online">Online: <strong>{online}</strong></span>
        <span className="cluster-stat cluster-stat--offline">Offline: <strong>{offline}</strong></span>
        <span className="cluster-stat">Idle: <strong>{nodes.length - online - offline}</strong></span>
        <Button icon="plus" text="Register Node" intent={Intent.PRIMARY} small style={{ marginLeft: 'auto' }} onClick={() => setRegOpen(true)} />
      </div>

      <div className="cluster-grid">
        {/* Node list */}
        <div className="cluster-node-list">
          <h3 className="cluster-section-title">Node Registry</h3>
          {nodes.length === 0 && (
            <p className="cluster-detail-placeholder">No nodes registered. Click "Register Node" to add one.</p>
          )}
          {nodes.map(node => (
            <div key={node.id}
              className={'cluster-node-card' + (selectedNode?.id === node.id ? ' cluster-node-card--selected' : '')}
              onClick={() => { setSelectedNode(node); setCmdLog([]); }}>
              <span className="cluster-node-dot" style={{ background: STATUS_COLORS[node.status] || '#8f99a8' }} />
              <div className="cluster-node-info">
                <span className="cluster-node-name">{node.name}</span>
                <span className="cluster-node-group">{node.groupId || '—'} &middot; {node.task || 'idle'}</span>
              </div>
              <div className="cluster-node-meta">
                {node.position && <span className="cluster-node-coords">{node.position.x}, {node.position.y}, {node.position.z}</span>}
                <span className="cluster-node-battery">{node.battery}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail + Console */}
        <div className="cluster-right">
          <Card className="cluster-detail-card">
            {selectedNode ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="cluster-section-title" style={{ border: 'none', padding: 0, margin: 0 }}>{selectedNode.name}</h3>
                  <Button icon="trash" text="Delete" intent={Intent.DANGER} small loading={deleting} onClick={() => handleDelete(selectedNode.id)} />
                </div>
                <div className="cluster-detail-grid" style={{ marginTop: 12 }}>
                  <DetailCol label="ID" value={selectedNode.id} />
                  <DetailCol label="Group" value={selectedNode.groupId || '—'} />
                  <DetailCol label="Status">
                    <Tag intent={selectedNode.status === 'online' ? Intent.SUCCESS : selectedNode.status === 'offline' ? Intent.DANGER : Intent.WARNING}>
                      {selectedNode.status?.toUpperCase()}
                    </Tag>
                  </DetailCol>
                  <DetailCol label="Battery" value={`${selectedNode.battery}%`} />
                  <DetailCol label="Position" value={selectedNode.position ? `${selectedNode.position.x}, ${selectedNode.position.y}, ${selectedNode.position.z}` : '—'} />
                  <DetailCol label="Task" value={selectedNode.task || 'idle'} />
                  <DetailCol label="Last Seen" value={selectedNode.lastSeen ? new Date(selectedNode.lastSeen).toLocaleTimeString() : 'never'} />
                </div>
              </>
            ) : (
              <p className="cluster-detail-placeholder">Select a node to view details</p>
            )}
          </Card>

          <Card className="cluster-console-card">
            <h3 className="cluster-section-title">Command Console</h3>
            <div className="cluster-console-log">
              {cmdLog.length === 0 && <p className="cluster-detail-placeholder">Select a node and send a command.</p>}
              {cmdLog.map((entry, i) => (
                <div key={i} className={'cluster-console-entry' + (entry.error ? ' cluster-console-entry--error' : '')}>
                  <span className="cluster-console-time">[{entry.time}]</span> {entry.text}
                  {entry.id && <span className="cluster-console-id"> [{entry.id}]</span>}
                </div>
              ))}
            </div>
            <form className="cluster-console-input-row" onSubmit={handleSend}>
              <span className="cluster-console-prompt">&gt;</span>
              <input className="cluster-console-input" value={cmdInput} onChange={e => setCmdInput(e.target.value)}
                placeholder={selectedNode ? 'move {"x":0,"y":64,"z":0}' : 'Select a node first'} disabled={!selectedNode} />
              <Button type="submit" text="Send" intent={Intent.PRIMARY} small loading={sending} disabled={!selectedNode || !cmdInput.trim()} />
            </form>
          </Card>
        </div>
      </div>

      {/* Register Node Dialog */}
      <RegisterNodeDialog isOpen={regOpen} onClose={() => setRegOpen(false)} onDone={(node) => {
        setNodes(p => [...p, node]);
        setRegOpen(false);
      }} />
    </div>
  );
}

function DetailCol({ label, value, children }) {
  return (
    <div className="cluster-detail-col">
      <span className="cluster-detail-label">{label}</span>
      {children || <span>{value}</span>}
    </div>
  );
}

// ---- Multi-step Register Dialog ----

function RegisterNodeDialog({ isOpen, onClose, onDone }) {
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [currentStep, setCurrentStep] = useState('info');
  const apiBase = import.meta.env.VITE_API_BASE || window.location.origin;

  const reset = () => { setName(''); setGroupId(''); setCreated(null); setCurrentStep('info'); };

  const handleStepChange = (newStep, prevStep) => {
    setCurrentStep(newStep);
    if (newStep === 'deploy' && prevStep === 'info' && !created) {
      setLoading(true);
      registerNode({
        name,
        groupId: groupId || null,
        base: apiBase,
        clientUrl: turtleClientUrl,
        configPath: '/etc/facility/config.lua',
        clientPath: '/facility/client.lua',
        startupPath: '/startup.lua',
      })
        .then(data => setCreated(data.node))
        .catch(() => setCurrentStep('info'))
        .finally(() => setLoading(false));
    }
  };

  const configSnippet = created ? [
    '-- /etc/facility/config.lua',
    'return {',
    `  node_id = "${created.id}",`,
    `  token = "${created.token}",`,
    `  api_base = "${apiBase}",`,
    '  heartbeat_interval = 2,',
    '}',
  ].join('\n') : '';

  const copyConfig = () => navigator.clipboard.writeText(configSnippet).catch(() => {});
  const downloadConfig = () => {
    const blob = new Blob([configSnippet], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.lua';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MultistepDialog
      isOpen={isOpen}
      onClose={() => { onClose(); setTimeout(reset, 300); }}
      title="Register Cluster Node"
      icon="plus"
      navigationPosition="left"
      canOutsideClickClose={false}
      onChange={handleStepChange}
      finalButtonProps={{
        text: 'Done',
        intent: 'success',
        disabled: currentStep !== 'deploy',
        onClick: () => { onDone(created); reset(); },
      }}
    >
      <DialogStep
        id="info"
        title="Node Info"
        panel={
          <DialogBody>
            <FormGroup label="Node Name" labelFor="reg-name">
              <InputGroup id="reg-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. SCAN-01" autoFocus />
            </FormGroup>
            <FormGroup label="Group (optional)">
              <HTMLSelect value={groupId} onChange={e => setGroupId(e.target.value)} fill>
                <option value="">— None —</option>
                {GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </HTMLSelect>
            </FormGroup>
          </DialogBody>
        }
        nextButtonProps={{
          text: 'Create Node',
          intent: 'primary',
          disabled: !name.trim(),
        }}
      />

      <DialogStep
        id="deploy"
        title="Deploy"
        panel={
          <DialogBody>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              {loading && !created && <p style={{ color: 'var(--bp-palette-gray-3)' }}>Registering node...</p>}
              {created && (<>
              <p style={{ fontWeight: 600 }}>One-Command Setup</p>
              <p>Run this on your CC:Tweaked turtle:</p>
              <pre style={{
                background: 'var(--bp-palette-black)', color: 'var(--bp-palette-green-3)',
                padding: 12, borderRadius: 4, fontSize: 13, overflow: 'auto', whiteSpace: 'pre-wrap',
              }}>{`wget run ${apiBase}/api/cluster/bootstrap?token=${created?.token}`}</pre>
              <Button icon="clipboard" text="Copy Command" small
                onClick={() => navigator.clipboard.writeText(`wget run ${apiBase}/api/cluster/bootstrap?token=${created?.token}`)} />

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bp-palette-gray-4)' }}>
                <p style={{ fontWeight: 600 }}>Manual Setup</p>
                <p>Download and place these files on the turtle:</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button icon="download" text="config.lua" small onClick={downloadConfig} />
                  <Button icon="download" text="turtle-client.lua" small onClick={() => window.open(turtleClientUrl, '_blank')} />
                </div>
                <p style={{ color: 'var(--bp-palette-gray-3)', marginTop: 8, fontSize: 13 }}>Save to <code>/etc/facility/config.lua</code> and <code>/facility/client.lua</code>, then run <code>shell.run("/facility/client.lua")</code>.</p>
              </div>

              </>)}
            </div>
          </DialogBody>
        }
      />
    </MultistepDialog>
  );
}
