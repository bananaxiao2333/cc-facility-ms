import { useState, useEffect } from 'react';
import { Card, Button, Intent, Dialog, DialogBody, DialogFooter, FormGroup, InputGroup } from '@blueprintjs/core';
import { fetchGroups, createGroup, updateGroup, deleteGroup } from '../api/groups';
import { fetchNodesSilent } from '../api/cluster';
import { useToast } from '../context/ToastContext';


export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [color, setColor] = useState('#666666');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({});
  const toast = useToast();

  const load = () => {
    fetchGroups().then(d => setGroups(d.groups || [])).catch(() => {});
    fetchNodesSilent().then(d => setNodes(d.nodes || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName(''); setAlias(''); setColor('#666666');
    setEditOpen(true);
  };

  const openEdit = (g) => {
    setEditing(g);
    setName(g.name); setAlias(g.alias || ''); setColor(g.color || '#666666');
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      editing ? await updateGroup(editing.id, { name, alias, color }) : await createGroup({ name, alias, color });
      setEditOpen(false);
      load();
      toast.success(editing ? 'Group updated' : 'Group created');
    } catch { toast.error('Failed to save group'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await deleteGroup(id);
    load();
    toast.success('Group deleted');
  };

  const toggleExpand = (e, id) => { e.stopPropagation(); setExpanded(p => ({ ...p, [id]: !p[id] })); };

  return (
    <div>
      <div className="cluster-status-bar">
        <span className="cluster-stat">Groups: <strong>{groups.length}</strong></span>
        <span className="cluster-stat">Nodes: <strong>{nodes.length}</strong></span>
        <Button icon="plus" text="New Group" intent={Intent.PRIMARY} small style={{ marginLeft: 'auto' }} onClick={openCreate} />
      </div>

      <div className="groups-grid">
        {groups.map(g => {
          const groupNodes = nodes.filter(n => n.groupId === g.id);
          const showNodes = expanded[g.id] ? groupNodes : groupNodes.slice(0, 3);
          return (
            <Card key={g.id} onClick={() => openEdit(g)} className="groups-card">
              <div className="groups-card-header">
                <span style={{ width: 14, height: 14, borderRadius: 3, background: g.color, flexShrink: 0 }} />
                <span className="groups-card-name">{g.name}</span>
              </div>
              <div className="groups-card-alias">{g.alias || '—'}</div>

              {groupNodes.length > 0 && (
                <>
                  <h4 className="cluster-section-title" style={{ marginTop: 12 }}>Nodes — {groupNodes.length}</h4>
                  <div className="groups-node-list">
                    {showNodes.map(n => {
                      return (
                        <div key={n.id} className="groups-node-item">
                          <span className="groups-node-dot" style={{ background: n.online ? '#15b371' : '#cd4246' }} />
                          <span>{n.name}</span>
                          <span className="groups-node-battery">{n.battery}%</span>
                        </div>
                      );
                    })}
                  </div>
                  {groupNodes.length > 3 && (
                    <Button minimal small text={expanded[g.id] ? 'Collapse' : `+${groupNodes.length - 3} more`}
                      onClick={(e) => toggleExpand(e, g.id)} style={{ fontSize: 12, marginTop: 4 }} />
                  )}
                </>
              )}
            </Card>
          );
        })}
        {groups.length === 0 && (
          <p className="cluster-detail-placeholder">No groups defined. Click "New Group" to create one.</p>
        )}
      </div>

      <Dialog isOpen={editOpen} onClose={() => setEditOpen(false)} title={editing ? 'Edit Group' : 'New Group'} icon={editing ? 'edit' : 'plus'}>
        <DialogBody>
          <FormGroup label="Name" labelFor="g-name">
            <InputGroup id="g-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 奇点" maxLength={16} autoFocus />
          </FormGroup>
          <FormGroup label="Alias" labelFor="g-alias">
            <InputGroup id="g-alias" value={alias} onChange={e => setAlias(e.target.value.toUpperCase())} placeholder="e.g. SINGULARITY" maxLength={20} />
          </FormGroup>
          <FormGroup label="Color" labelFor="g-color">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: 36, height: 30, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }} />
              <span style={{ fontSize: 13, fontFamily: 'monospace' }}>{color}</span>
            </div>
          </FormGroup>
        </DialogBody>
        <DialogFooter actions={
          <>
            {editing && <Button text="Delete" intent={Intent.DANGER} onClick={() => { handleDelete(editing.id); setEditOpen(false); }} style={{ marginRight: 'auto' }} />}
            <Button text="Cancel" onClick={() => setEditOpen(false)} />
            <Button text={editing ? 'Save' : 'Create'} intent={Intent.PRIMARY} loading={saving} disabled={!name.trim()} onClick={handleSave} />
          </>
        } />
      </Dialog>
    </div>
  );
}
