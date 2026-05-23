import { useState, useEffect } from 'react';
import { Card, Button, Intent, Dialog, DialogBody, DialogFooter, FormGroup, InputGroup, Switch, HTMLSelect, TextArea } from '@blueprintjs/core';
import { fetchWorkflows, createWorkflow, updateWorkflow, deleteWorkflow } from '../api/workflows';
import { fetchActions } from '../api/actions';
import { fetchGroups } from '../api/groups';
import { fetchNodesSilent } from '../api/cluster';
import { useToast } from '../context/ToastContext';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [actions, setActions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [wfName, setWfName] = useState('');
  const [wfEnabled, setWfEnabled] = useState(true);
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = () => {
    fetchWorkflows().then(d => setWorkflows(d.workflows || [])).catch(() => {});
    fetchActions().then(d => setActions(d.actions || [])).catch(() => {});
    fetchGroups().then(d => setGroups(d.groups || [])).catch(() => {});
    fetchNodesSilent().then(d => setNodes(d.nodes || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); setWfName(''); setWfEnabled(true); setSteps([]); setEditOpen(true);
  };
  const openEdit = (w) => {
    setEditing(w); setWfName(w.name); setWfEnabled(w.enabled);
    setSteps((w.steps || []).map(s => ({ ...s })));
    setEditOpen(true);
  };

  const addStep = (type) => {
    const base = { id: 's' + Date.now(), type, actionId: '', params: {}, expression: '', jumpTo: '', triggerType: 'manual', intervalMs: 60000, delayMs: 1000 };
    setSteps(p => [...p, base]);
  };

  const updateStep = (idx, field, val) => {
    setSteps(p => p.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  const removeStep = (idx) => setSteps(p => p.filter((_, i) => i !== idx));
  const moveStep = (idx, dir) => {
    setSteps(p => {
      const arr = [...p];
      const t = idx + dir;
      if (t < 0 || t >= arr.length) return p;
      [arr[idx], arr[t]] = [arr[t], arr[idx]];
      return arr;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { name: wfName, enabled: wfEnabled, steps };
      editing ? await updateWorkflow(editing.id, body) : await createWorkflow(body);
      setEditOpen(false); setSelected(null); load();
      toast.success(editing ? 'Updated' : 'Created');
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => { await deleteWorkflow(id); load(); setSelected(null); toast.success('Deleted'); };

  const exportItem = (w) => {
    const blob = new Blob([JSON.stringify(w, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const el = document.createElement('a'); el.href = u; el.download = `${w.name}.json`; el.click();
    URL.revokeObjectURL(u);
  };
  const exportAll = () => {
    const blob = new Blob([JSON.stringify(workflows, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const el = document.createElement('a'); el.href = u; el.download = 'workflows-export.json'; el.click();
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
            await createWorkflow({
              name: item.name, enabled: item.enabled !== false,
              steps: item.steps || [], groupId: item.groupId || null, nodeId: item.nodeId || null,
            });
          }
        }
        load(); toast.success(`Imported ${items.length} workflow(s)`);
      } catch { toast.error('Invalid JSON file'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const stepLabels = (w) => {
    const st = w.steps || [];
    if (!st.length) return '0 steps';
    return st.map(s => {
      if (s.type === 'trigger') return '⚡';
      if (s.type === 'delay') return '⏳' + (s.delayMs || 1000) + 'ms';
      if (s.type === 'condition') return '?';
      return actions.find(a => a.id === s.actionId)?.name || '—';
    }).join(' → ');
  };

  return (
    <div className="cluster-page">
      <div className="cluster-status-bar">
        <span className="cluster-stat">Workflows: <strong>{workflows.length}</strong></span>
        <input type="file" accept=".json" onChange={importFile} style={{ display: 'none' }} id="workflows-import" />
        <Button icon="import" text="Import" small minimal onClick={() => document.getElementById('workflows-import').click()} />
        <Button icon="export" text="Export All" small minimal onClick={exportAll} />
        <Button icon="plus" text="New Workflow" intent={Intent.PRIMARY} small style={{ marginLeft: 'auto' }} onClick={openCreate} />
      </div>

      <div className="cluster-grid">
        <div className="cluster-node-list">
          <h3 className="cluster-section-title">Workflows</h3>
          {workflows.map(w => (
            <div key={w.id} className={'cluster-node-card' + (selected?.id === w.id ? ' cluster-node-card--selected' : '')} onClick={() => setSelected(w)}>
              <div className="cluster-node-info">
                <span className="cluster-node-name">{w.name}</span>
                <span className="cluster-node-group">{stepLabels(w)}</span>
              </div>
            </div>
          ))}
          {workflows.length === 0 && <p className="cluster-detail-placeholder">No workflows defined.</p>}
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
                    <Button icon="trash" text="Delete" intent={Intent.DANGER} small onClick={() => handleDelete(selected.id)} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13 }}>Status: <strong style={{ color: selected.enabled ? '#15b371' : '#cd4246' }}>{selected.enabled ? 'ENABLED' : 'DISABLED'}</strong></span>
                    <span style={{ fontSize: 13 }}>Group: <strong>{groups.find(g => g.id === selected.groupId)?.name || '—'}</strong></span>
                    <span style={{ fontSize: 13 }}>Node: <strong>{nodes.find(n => n.id === selected.nodeId)?.name || '—'}</strong></span>
                  </div>
                  {(selected.steps || []).length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h4 className="cluster-section-title">Steps</h4>
                      {(selected.steps || []).map((s, i) => (
                        <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--bp-palette-light-gray-4)' }}>
                          <span style={{ color: 'var(--bp-palette-gray-4)', fontSize: 11, minWidth: 20 }}>{i + 1}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3, color: '#fff',
                            background: s.type === 'trigger' ? '#c87619' : s.type === 'delay' ? '#5f6b7c' : s.type === 'condition' ? '#ac2f33' : '#2d72d2',
                          }}>{s.type === 'trigger' ? 'ON' : s.type === 'delay' ? 'WAIT' : s.type === 'condition' ? 'IF' : 'ACT'}</span>
                          <span>{s.type === 'trigger' ? (s.triggerType || 'manual') : s.type === 'delay' ? (s.delayMs || 1000) + 'ms' : s.type === 'condition' ? s.expression || '(empty)' : actions.find(a => a.id === s.actionId)?.name || '—'}</span>
                          {s.type === 'condition' && s.jumpTo && (
                            <span style={{ color: 'var(--bp-palette-gray-3)', fontSize: 11 }}>→ step {s.jumpTo}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="cluster-detail-placeholder">Select a workflow to view details</p>
            )}
          </Card>
        </div>
      </div>

      {/* Editor Dialog */}
      <Dialog isOpen={editOpen} onClose={() => setEditOpen(false)} title={editing ? 'Edit Workflow' : 'New Workflow'} style={{ width: 650 }}>
        <DialogBody>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <FormGroup label="Name" style={{ margin: 0, flex: 1 }}>
              <InputGroup value={wfName} onChange={e => setWfName(e.target.value)} placeholder="Workflow name" />
            </FormGroup>
            <Switch checked={wfEnabled} onChange={e => setWfEnabled(e.currentTarget.checked)} label="Enabled" />
          </div>

          <h4 className="cluster-section-title" style={{ marginTop: 0 }}>
            Steps
            <Button icon="plus" text="Trigger" small minimal style={{ marginLeft: 8 }} onClick={() => addStep('trigger')} />
            <Button icon="plus" text="Action" small minimal onClick={() => addStep('action')} />
            <Button icon="plus" text="Condition" small minimal onClick={() => addStep('condition')} />
            <Button icon="plus" text="Delay" small minimal onClick={() => addStep('delay')} />
          </h4>

          {steps.length === 0 && <p style={{ fontSize: 13, color: 'var(--bp-palette-gray-3)' }}>No steps. Add an action or condition to begin.</p>}

          {steps.map((s, i) => (
            <div key={s.id} style={{ marginBottom: 10, padding: 10, background: 'var(--bp-palette-light-gray-5)', borderRadius: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--bp-palette-gray-2)' }}>#{i + 1}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3, color: '#fff',
                  background: s.type === 'trigger' ? '#c87619' : s.type === 'delay' ? '#5f6b7c' : s.type === 'condition' ? '#ac2f33' : '#2d72d2',
                }}>{s.type === 'trigger' ? 'ON' : s.type === 'delay' ? 'WAIT' : s.type === 'condition' ? 'IF' : 'ACT'}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <Button icon="chevron-up" minimal small disabled={i === 0} onClick={() => moveStep(i, -1)} />
                  <Button icon="chevron-down" minimal small disabled={i === steps.length - 1} onClick={() => moveStep(i, 1)} />
                  <Button icon="cross" minimal small intent={Intent.DANGER} onClick={() => removeStep(i)} />
                </div>
              </div>

              {s.type === 'trigger' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <HTMLSelect value={s.triggerType || 'manual'} onChange={e => updateStep(i, 'triggerType', e.target.value)} minimal style={{ width: 120 }}>
                    <option value="manual">Manual</option>
                    <option value="interval">Interval</option>
                    <option value="startup">Startup</option>
                  </HTMLSelect>
                  {s.triggerType === 'interval' && (
                    <input type="number" placeholder="ms" value={s.intervalMs || 60000}
                      onChange={e => updateStep(i, 'intervalMs', parseInt(e.target.value) || 0)}
                      style={{ width: 100, border: '1px solid var(--bp-palette-gray-4)', borderRadius: 3, padding: '3px 6px', fontSize: 12 }} />
                  )}
                </div>
              )}

              {s.type === 'action' && (
                <div>
                  <HTMLSelect value={s.actionId} onChange={e => updateStep(i, 'actionId', e.target.value)} fill style={{ marginBottom: 4 }}>
                    <option value="">— Select action —</option>
                    {actions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </HTMLSelect>
                  {s.actionId && (() => {
                    const action = actions.find(a => a.id === s.actionId);
                    if (action?.params?.length) return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {action.params.map(p => (
                          <input key={p.key}
                            placeholder={p.label + (p.required ? ' *' : '')}
                            value={(s.params || {})[p.key] ?? p.default ?? ''}
                            onChange={e => updateStep(i, 'params', { ...s.params, [p.key]: e.target.value })}
                            style={{ fontSize: 12, border: '1px solid var(--bp-palette-gray-4)', borderRadius: 3, padding: '3px 6px', width: 120 }}
                          />
                        ))}
                      </div>
                    );
                    return null;
                  })()}
                </div>
              )}

              {s.type === 'condition' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, color: 'var(--bp-palette-gray-3)' }}>If expression is true</span>
                    <TextArea value={s.expression} onChange={e => updateStep(i, 'expression', e.target.value)}
                      placeholder='result.ok == true' rows={2} style={{ fontFamily: 'monospace', fontSize: 12 }} fill />
                  </div>
                  <div style={{ width: 100 }}>
                    <span style={{ fontSize: 11, color: 'var(--bp-palette-gray-3)' }}>Jump to step #</span>
                    <input type="number" min={1} max={steps.length} value={s.jumpTo || ''}
                      onChange={e => updateStep(i, 'jumpTo', e.target.value)}
                      placeholder="Skip"
                      style={{ width: '100%', border: '1px solid var(--bp-palette-gray-4)', borderRadius: 3, padding: '4px 6px', fontSize: 13 }} />
                  </div>
                </div>
              )}

              {s.type === 'delay' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--bp-palette-gray-3)' }}>Wait</span>
                  <input type="number" value={s.delayMs || 1000}
                    onChange={e => updateStep(i, 'delayMs', parseInt(e.target.value) || 0)}
                    style={{ width: 100, border: '1px solid var(--bp-palette-gray-4)', borderRadius: 3, padding: '3px 6px', fontSize: 13 }} />
                  <span style={{ fontSize: 12, color: 'var(--bp-palette-gray-3)' }}>ms</span>
                </div>
              )}
            </div>
          ))}
        </DialogBody>
        <DialogFooter actions={
          <><Button text="Cancel" onClick={() => setEditOpen(false)} /><Button text={editing ? 'Save' : 'Create'} intent={Intent.PRIMARY} loading={saving} disabled={!wfName.trim()} onClick={handleSave} /></>
        } />
      </Dialog>
    </div>
  );
}
