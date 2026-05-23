import { useState, useEffect } from 'react';
import { Card, Button, Intent, Dialog, DialogBody, DialogFooter, FormGroup, InputGroup, TextArea, Switch, HTMLSelect } from '@blueprintjs/core';
import { fetchActions, createAction, updateAction, deleteAction } from '../api/actions';
import { useToast } from '../context/ToastContext';

const PARAM_TYPES = ['string', 'number', 'boolean', 'select'];

export default function ActionsPage() {
  const [actions, setActions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [code, setCode] = useState('');
  const [params, setParams] = useState([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = () => fetchActions().then(d => setActions(d.actions || [])).catch(() => {});

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); setName(''); setDesc(''); setCode(''); setParams([]); setEditOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a); setName(a.name); setDesc(a.description || ''); setCode(a.code || '');
    setParams((a.params || []).map(p => ({ ...p })));
    setEditOpen(true);
  };

  const addParam = () => setParams(p => [...p, { key: '', label: '', type: 'string', required: false, default: '', options: [] }]);

  const updateParam = (i, field, val) => {
    setParams(p => p.map((x, j) => j === i ? { ...x, [field]: val } : x));
  };

  const removeParam = (i) => setParams(p => p.filter((_, j) => j !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { name, description: desc, code, params: params.filter(p => p.key) };
      editing ? await updateAction(editing.id, body) : await createAction(body);
      setEditOpen(false); load();
      toast.success(editing ? 'Action updated' : 'Action created');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await deleteAction(id); load(); setSelected(null); toast.success('Action deleted');
  };

  const exportItem = (a) => {
    const blob = new Blob([JSON.stringify(a, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const el = document.createElement('a'); el.href = u; el.download = `${a.name}.json`; el.click();
    URL.revokeObjectURL(u);
  };
  const exportAll = () => {
    const blob = new Blob([JSON.stringify(actions, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const el = document.createElement('a'); el.href = u; el.download = 'actions-export.json'; el.click();
    URL.revokeObjectURL(u);
  };
  const importFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item.name) {
            await createAction({
              name: item.name, description: item.description || '',
              type: item.type || 'exec', params: item.params || [], code: item.code || '',
            });
          }
        }
        load(); toast.success(`Imported ${items.length} action(s)`);
      } catch { toast.error('Invalid JSON file'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="cluster-page">
      <div className="cluster-status-bar">
        <span className="cluster-stat">Actions: <strong>{actions.length}</strong></span>
        <input type="file" accept=".json" onChange={importFile} style={{ display: 'none' }} id="actions-import" />
        <Button icon="import" text="Import" small minimal onClick={() => document.getElementById('actions-import').click()} />
        <Button icon="export" text="Export All" small minimal onClick={exportAll} />
        <Button icon="plus" text="New Action" intent={Intent.PRIMARY} small style={{ marginLeft: 'auto' }} onClick={openCreate} />
      </div>

      <div className="cluster-grid">
        <div className="cluster-node-list">
          <h3 className="cluster-section-title">Action Registry</h3>
          {actions.map(a => (
            <div key={a.id}
              className={'cluster-node-card' + (selected?.id === a.id ? ' cluster-node-card--selected' : '')}
              onClick={() => setSelected(a)}>
              <div className="cluster-node-info">
                <span className="cluster-node-name">{a.name}</span>
                <span className="cluster-node-group">{a.type} &middot; {a.params?.length || 0} params</span>
              </div>
            </div>
          ))}
          {actions.length === 0 && <p className="cluster-detail-placeholder">No actions registered.</p>}
        </div>

        <div className="cluster-right">
          <Card className="cluster-detail-card">
            {selected ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="cluster-section-title" style={{ border: 'none', padding: 0, margin: 0 }}>{selected.name}</h3>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button icon="edit" text="Edit" small onClick={() => openEdit(selected)} />
                    <Button icon="export" text="Export" small onClick={() => exportItem(selected)} />
                    <Button icon="trash" text="Delete" intent={Intent.DANGER} small onClick={() => { handleDelete(selected.id); setSelected(null); }} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="cluster-detail-grid">
                    <DetailCol label="Type" value={selected.type} />
                    <DetailCol label="Params" value={String(selected.params?.length || 0)} />
                  </div>
                  {selected.description && <p style={{ marginTop: 8, color: 'var(--bp-palette-gray-3)', fontSize: 13 }}>{selected.description}</p>}
                  {selected.params?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <h4 className="cluster-section-title" style={{ fontSize: 11, marginBottom: 6 }}>Parameters</h4>
                      {selected.params.map((p, i) => (
                        <div key={i} style={{ fontSize: 13, padding: '3px 0', display: 'flex', gap: 8 }}>
                          <code>{p.key}</code>
                          <span style={{ color: 'var(--bp-palette-gray-3)' }}>{p.label} ({p.type})</span>
                          {p.required && <span style={{ color: 'var(--bp-palette-red-3)', fontSize: 11 }}>required</span>}
                          {p.default != null && p.default !== '' && <span style={{ color: 'var(--bp-palette-gray-4)', fontSize: 11 }}>default: {String(p.default)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {selected.code && (
                    <div style={{ marginTop: 8 }}>
                      <h4 className="cluster-section-title" style={{ fontSize: 11, marginBottom: 6 }}>Code</h4>
                      <pre style={{ background: 'var(--bp-palette-black)', color: 'var(--bp-palette-green-3)', padding: 10, borderRadius: 4, fontSize: 12, overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{selected.code}</pre>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="cluster-detail-placeholder">Select an action to view details</p>
            )}
          </Card>
        </div>
      </div>

      <Dialog isOpen={editOpen} onClose={() => setEditOpen(false)} title={editing ? 'Edit Action' : 'New Action'} icon={editing ? 'edit' : 'plus'} style={{ width: 600 }}>
        <DialogBody>
          <FormGroup label="Name" labelFor="a-name">
            <InputGroup id="a-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Send Alert" maxLength={64} autoFocus />
          </FormGroup>
          <FormGroup label="Description">
            <InputGroup value={desc} onChange={e => setDesc(e.target.value)} placeholder="What this action does" maxLength={256} />
          </FormGroup>
          <FormGroup label="Parameters">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {params.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input placeholder="key" value={p.key} onChange={e => updateParam(i, 'key', e.target.value)}
                    style={{ width: 80, border: '1px solid var(--bp-palette-gray-4)', borderRadius: 3, padding: '4px 6px', fontSize: 13 }} />
                  <input placeholder="label" value={p.label} onChange={e => updateParam(i, 'label', e.target.value)}
                    style={{ width: 70, border: '1px solid var(--bp-palette-gray-4)', borderRadius: 3, padding: '4px 6px', fontSize: 13 }} />
                  <HTMLSelect value={p.type} onChange={e => updateParam(i, 'type', e.target.value)} minimal style={{ width: 80 }}>
                    {PARAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </HTMLSelect>
                  <Switch checked={p.required} onChange={e => updateParam(i, 'required', e.currentTarget.checked)} label="Req" style={{ margin: 0, fontSize: 11 }} />
                  <input placeholder="default" value={p.default} onChange={e => updateParam(i, 'default', e.target.value)}
                    style={{ width: 60, border: '1px solid var(--bp-palette-gray-4)', borderRadius: 3, padding: '4px 6px', fontSize: 13 }} />
                  <Button icon="cross" minimal small onClick={() => removeParam(i)} />
                </div>
              ))}
              <Button icon="plus" text="Add Parameter" small minimal onClick={addParam} />
            </div>
          </FormGroup>
          <FormGroup label="Lua Code">
            <TextArea value={code} onChange={e => setCode(e.target.value)} placeholder="print('hello')" rows={6} style={{ fontFamily: 'monospace', fontSize: 13 }} fill />
          </FormGroup>
        </DialogBody>
        <DialogFooter actions={
          <><Button text="Cancel" onClick={() => setEditOpen(false)} /><Button text={editing ? 'Save' : 'Create'} intent={Intent.PRIMARY} loading={saving} disabled={!name.trim()} onClick={handleSave} /></>
        } />
      </Dialog>
    </div>
  );
}

function DetailCol({ label, value, children }) {
  return <div className="cluster-detail-col"><span className="cluster-detail-label">{label}</span>{children || <span>{value}</span>}</div>;
}
