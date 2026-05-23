import { useState, useEffect, useRef } from 'react';
import { Card, Button, Intent, Tag, Dialog, DialogBody, DialogFooter, FormGroup, InputGroup, HTMLSelect } from '@blueprintjs/core';
import { fetchNodes, fetchNodesSilent, sendCommand, registerNode, deleteNode, updateNode } from '../api/cluster';
import { fetchGroups } from '../api/groups';
import { useToast } from '../context/ToastContext';
import clientUrl from '@cc/ccfms-client.lua?url';

const STATUS_COLORS = { online: '#15b371', offline: '#cd4246', maintenance: '#c87619' };

function groupName(groups, groupId) {
  if (!groupId) return '—';
  const g = groups.find(x => x.id === groupId);
  return g ? g.name : groupId;
}

export default function ClusterPage() {
  const [nodes, setNodes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [cmdInput, setCmdInput] = useState('');
  const [cmdLog, setCmdLog] = useState([]);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [regOpen, setRegOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [deployCmd, setDeployCmd] = useState('');
  const [deployToken, setDeployToken] = useState('');
  const [deployNodeName, setDeployNodeName] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const firstLoad = useRef(true);
  const toast = useToast();
  const apiBase = import.meta.env.VITE_API_BASE || window.location.origin;

  const handleDelete = async (nodeId) => {
    setDeleting(true);
    try {
      await deleteNode(nodeId);
      setNodes(p => p.filter(n => n.id !== nodeId));
      if (selectedNode?.id === nodeId) setSelectedNode(null);
      toast.success('Node deleted');
    } catch { toast.error('Failed to delete node'); }
    finally { setDeleting(false); }
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      const data = await updateNode(selectedNode.id, { name: editName, groupId: editGroupId || null });
      setNodes(p => p.map(n => n.id === data.node.id ? data.node : n));
      setSelectedNode(data.node);
      setEditOpen(false);
      toast.success('Node updated');
    } catch { toast.error('Failed to update node'); }
    finally { setEditSaving(false); }
  };

  useEffect(() => {
    const load = firstLoad.current ? fetchNodes : fetchNodesSilent;
    load().then(d => {
      const list = d.nodes || [];
      setNodes(list);
      setSelectedNode(p => list.find(n => n.id === p?.id) || list[0] || null);
    }).catch(() => {});
    fetchGroups().then(d => setGroups(d.groups || [])).catch(() => {});
    firstLoad.current = false;
    const iv = setInterval(() => {
      setPolling(true);
      fetchNodesSilent().then(d => {
        const list = d.nodes || [];
        setNodes(list);
        setSelectedNode(p => list.find(n => n.id === p?.id) || (list[0] ?? p));
      }).catch(() => {}).finally(() => setPolling(false));
    }, 10000);
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
      toast.success(`Command ${type} sent to ${selectedNode.name}`);
    } catch (err) {
      toast.error(err.message);
      setCmdLog(p => [...p, { time: new Date().toLocaleTimeString(), text: `ERR: ${err.message}`, error: true }]);
    } finally { setSending(false); }
  };

  const online = nodes.filter(n => n.online).length;
  const offline = nodes.filter(n => !n.online).length;

  return (
    <div className="cluster-page">
      <div className="cluster-status-bar">
        <span className="cluster-stat">Nodes: <strong>{nodes.length}</strong></span>
        <span className="cluster-stat cluster-stat--online">Online: <strong>{online}</strong></span>
        <span className="cluster-stat cluster-stat--offline">Offline: <strong>{offline}</strong></span>
        <span className="cluster-stat">Idle: <strong>{nodes.length - online - offline}</strong></span>
        <span className={'cluster-poll-indicator' + (polling ? ' cluster-poll-indicator--active' : '')} />
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
              <span className="cluster-node-dot" style={{ background: (node.online ? STATUS_COLORS.online : STATUS_COLORS.offline) || '#8f99a8' }} />
              <div className="cluster-node-info">
                <span className="cluster-node-name">{node.name}</span>
                <span className="cluster-node-group">{groupName(groups, node.groupId)} &middot; {node.task || 'idle'}</span>
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
                </div>
                <div className="cluster-detail-grid" style={{ marginTop: 12 }}>
                  <DetailCol label="ID" value={selectedNode.id} />
                  <DetailCol label="Group" value={groupName(groups, selectedNode.groupId)} />
                  <DetailCol label="Status">
                    <Tag intent={selectedNode.online ? Intent.SUCCESS : Intent.WARNING}>
                      {(selectedNode.online ? 'ONLINE' : 'OFFLINE')}
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

          {/* Node Management */}
          {selectedNode && (
            <Card className="cluster-detail-card">
              <h3 className="cluster-section-title">Manage Node</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button icon="send-to" text="Deploy" small onClick={() => {
                  setDeployCmd(`wget run ${apiBase}/api/cluster/bootstrap?token=${selectedNode.token}`);
                  setDeployToken(selectedNode.token);
                  setDeployNodeName(selectedNode.name);
                  setDeployOpen(true);
                }} />
                <Button icon="edit" text="Edit Info" small onClick={() => {
                  setEditName(selectedNode.name);
                  setEditGroupId(selectedNode.groupId || '');
                  setEditOpen(true);
                }} />
                <Button icon="trash" text="Delete Node" intent={Intent.DANGER} small loading={deleting} onClick={() => handleDelete(selectedNode.id)} />
              </div>
            </Card>
          )}

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
      <RegisterDialog
        isOpen={regOpen}
        groups={groups}
        apiBase={apiBase}
        clientUrl={clientUrl}
        onClose={() => setRegOpen(false)}
        onCreated={(node) => {
          setNodes(p => [...p, node]);
          setRegOpen(false);
          toast.success(`Node ${node.name} registered`);
          setDeployCmd(`wget run ${apiBase}/api/cluster/bootstrap?token=${node.token}`);
          setDeployToken(node.token);
          setDeployNodeName(node.name);
          setDeployOpen(true);
        }}
      />

      {/* Deploy Guide Dialog */}
      <Dialog isOpen={deployOpen} onClose={() => setDeployOpen(false)} title={`Deploy Guide — ${deployNodeName}`} icon="send-to" style={{ width: 560 }}>
        <DialogBody>
          <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>One-Command Setup</h4>
          <p style={{ fontSize: 13, color: 'var(--bp-palette-gray-3)', marginBottom: 8 }}>
            Run this on your CC:Tweaked turtle to auto-install everything:
          </p>
          <pre style={{
            background: 'var(--bp-palette-black)', color: 'var(--bp-palette-green-3)',
            padding: 12, borderRadius: 4, fontSize: 13, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>{deployCmd}</pre>
          <Button icon="clipboard" text="Copy" small style={{ marginTop: 8 }}
            onClick={() => navigator.clipboard.writeText(deployCmd)} />

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bp-palette-gray-4)' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Manual Setup</h4>
            <p style={{ fontSize: 13, color: 'var(--bp-palette-gray-3)', marginBottom: 8 }}>
              Or download and place the files manually:
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <Button icon="download" text="config.lua" small onClick={() => {
                  const snippet = `-- /etc/facility/config.lua\nreturn {\n  node_id = "${deployNodeName}",\n  token = "${deployToken}",\n  api_base = "${apiBase}",\n  heartbeat_interval = 10,\n}`;
                  const b = new Blob([snippet], { type: 'text/plain' });
                  const u = URL.createObjectURL(b);
                  const a = document.createElement('a'); a.href = u; a.download = 'config.lua'; a.click();
                  URL.revokeObjectURL(u);
                }} />
                <p style={{ fontSize: 11, color: 'var(--bp-palette-gray-4)', marginTop: 4 }}>Save to <code>/etc/facility/config.lua</code></p>
              </div>
              <div>
                <Button icon="download" text="client.lua" small onClick={() => window.open(clientUrl, '_blank')} />
                <p style={{ fontSize: 11, color: 'var(--bp-palette-gray-4)', marginTop: 4 }}>Save to <code>/facility/client.lua</code></p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--bp-palette-gray-3)', marginTop: 12 }}>
              Then run: <code>shell.run("/facility/client.lua")</code>
            </p>
          </div>
        </DialogBody>
        <DialogFooter actions={<Button text="Done" intent={Intent.PRIMARY} onClick={() => setDeployOpen(false)} />} />
      </Dialog>

      {/* Edit Node Dialog */}
      <Dialog isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Node" icon="edit">
        <DialogBody>
          <FormGroup label="Name" labelFor="edit-name">
            <InputGroup id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Node name" autoFocus />
          </FormGroup>
          <FormGroup label="Group">
            <HTMLSelect value={editGroupId} onChange={e => setEditGroupId(e.target.value)} fill>
              <option value="">— None —</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </HTMLSelect>
          </FormGroup>
        </DialogBody>
        <DialogFooter actions={
          <><Button text="Cancel" onClick={() => setEditOpen(false)} /><Button text="Save" intent={Intent.PRIMARY} loading={editSaving} disabled={!editName.trim()} onClick={handleEditSave} /></>
        } />
      </Dialog>
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

// ---- Register Dialog ----

function RegisterDialog({ isOpen, groups, apiBase, clientUrl, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => { setName(''); setGroupId(''); };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const data = await registerNode({
        name,
        groupId: groupId || null,
        base: apiBase,
        clientUrl: clientUrl,
        configPath: '/etc/facility/config.lua',
        clientPath: '/facility/client.lua',
        startupPath: '/startup.lua',
      });
      onCreated(data.node);
      reset();
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <Dialog isOpen={isOpen} onClose={() => { onClose(); setTimeout(reset, 300); }} title="Register Cluster Node" icon="plus">
      <DialogBody>
        <FormGroup label="Node Name" labelFor="reg-name">
          <InputGroup id="reg-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. SCAN-01" autoFocus />
        </FormGroup>
        <FormGroup label="Group (optional)">
          <HTMLSelect value={groupId} onChange={e => setGroupId(e.target.value)} fill>
            <option value="">— None —</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </HTMLSelect>
        </FormGroup>
      </DialogBody>
      <DialogFooter actions={
        <><Button text="Cancel" onClick={() => { onClose(); reset(); }} /><Button text="Create Node" intent={Intent.PRIMARY} loading={loading} disabled={!name.trim()} onClick={handleCreate} /></>
      } />
    </Dialog>
  );
}

