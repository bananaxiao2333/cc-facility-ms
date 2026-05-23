import { useState, useEffect } from 'react';
import { Card, Button, Intent, Dialog, DialogBody, DialogFooter, FormGroup, InputGroup } from '@blueprintjs/core';
import { fetchGroups, createGroup, updateGroup, deleteGroup } from '../api/groups';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [color, setColor] = useState('#666666');
  const [saving, setSaving] = useState(false);

  const load = () => fetchGroups().then(d => setGroups(d.groups || [])).catch(() => {});

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setAlias('');
    setColor('#666666');
    setEditOpen(true);
  };

  const openEdit = (g) => {
    setEditing(g);
    setName(g.name);
    setAlias(g.alias || '');
    setColor(g.color || '#666666');
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await updateGroup(editing.id, { name, alias, color });
      } else {
        await createGroup({ name, alias, color });
      }
      setEditOpen(false);
      load();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await deleteGroup(id);
    load();
  };

  return (
    <div>
      <div className="cluster-status-bar">
        <span className="cluster-stat">Groups: <strong>{groups.length}</strong></span>
        <Button icon="plus" text="New Group" intent={Intent.PRIMARY} small style={{ marginLeft: 'auto' }} onClick={openCreate} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {groups.map(g => (
          <Card key={g.id} style={{ width: 220, padding: 16 }} onClick={() => openEdit(g)} className="cluster-node-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: g.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 15 }}>{g.name}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--bp-palette-gray-3)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {g.alias || '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--bp-palette-gray-4)', marginTop: 6 }}>
              Created {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : '—'}
            </div>
          </Card>
        ))}
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
