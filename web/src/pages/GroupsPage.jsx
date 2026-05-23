import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Intent,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  InputGroup,
} from "@blueprintjs/core";
import {
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../api/groups";
import { fetchNodesSilent } from "../api/cluster";
import { fetchWorkflows, updateWorkflow } from "../api/workflows";
import { useToast } from "../context/ToastContext";

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [color, setColor] = useState("#666666");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = () => {
    fetchGroups()
      .then((d) => setGroups(d.groups || []))
      .catch(() => {});
    fetchNodesSilent()
      .then((d) => setNodes(d.nodes || []))
      .catch(() => {});
    fetchWorkflows()
      .then((d) => setWorkflows(d.workflows || []))
      .catch(() => {});
  };
  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setAlias("");
    setColor("#666666");
    setEditOpen(true);
  };
  const openEdit = (g) => {
    setEditing(g);
    setName(g.name);
    setAlias(g.alias || "");
    setColor(g.color || "#666666");
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      editing
        ? await updateGroup(editing.id, { name, alias, color })
        : await createGroup({ name, alias, color });
      setEditOpen(false);
      load();
      toast.success(editing ? "Updated" : "Created");
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id) => {
    await deleteGroup(id);
    load();
    setSelected(null);
    toast.success("Deleted");
  };

  const groupNodes = (gid) => nodes.filter((n) => n.groupId === gid);
  const groupWorkflows = (gid) => workflows.filter((w) => w.groupId === gid);

  const assignWorkflow = async (wfId, gid) => {
    await updateWorkflow(wfId, { groupId: gid });
    load();
    toast.success('Workflow assigned');
  };

  const unassignWorkflow = async (wfId) => {
    await updateWorkflow(wfId, { groupId: null });
    load();
    toast.success('Workflow unassigned');
  };

  return (
    <div className="cluster-page">
      <div className="cluster-status-bar">
        <span className="cluster-stat">
          Groups: <strong>{groups.length}</strong>
        </span>
        <span className="cluster-stat">
          Nodes: <strong>{nodes.length}</strong>
        </span>
        <Button
          icon="plus"
          text="New Group"
          intent={Intent.PRIMARY}
          small
          style={{ marginLeft: "auto" }}
          onClick={openCreate}
        />
      </div>

      <div className="cluster-grid">
        <div className="cluster-node-list">
          <h3 className="cluster-section-title">Group Registry</h3>
          {groups.map((g) => (
            <div
              key={g.id}
              className={
                "cluster-node-card" +
                (selected?.id === g.id ? " cluster-node-card--selected" : "")
              }
              onClick={() => setSelected(g)}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: g.color,
                  flexShrink: 0,
                }}
              />
              <div className="cluster-node-info">
                <span className="cluster-node-name">{g.name}</span>
                <span className="cluster-node-group">
                  {g.alias || "—"} &middot; {groupNodes(g.id).length} nodes
                </span>
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <p className="cluster-detail-placeholder">No groups defined.</p>
          )}
        </div>

        <div className="cluster-right">
          <Card className="cluster-detail-card">
            {selected ? (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        background: selected.color,
                      }}
                    />
                    <h3
                      className="cluster-section-title"
                      style={{ border: "none", padding: 0, margin: 0 }}
                    >
                      {selected.name}
                    </h3>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Button
                      icon="edit"
                      text="Edit"
                      small
                      onClick={() => openEdit(selected)}
                    />
                    <Button
                      icon="trash"
                      text="Delete"
                      intent={Intent.DANGER}
                      small
                      onClick={() => handleDelete(selected.id)}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="cluster-detail-grid">
                    <DetailCol label="Alias" value={selected.alias || "—"} />
                    <DetailCol label="Color" value={selected.color} />
                    <DetailCol
                      label="Nodes"
                      value={String(groupNodes(selected.id).length)}
                    />
                    <DetailCol
                      label="Created"
                      value={
                        selected.createdAt
                          ? new Date(selected.createdAt).toLocaleDateString()
                          : "—"
                      }
                    />
                  </div>

                  {groupNodes(selected.id).length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h4 className="cluster-section-title">Assigned Nodes</h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        {groupNodes(selected.id).map((n) => (
                          <div
                            key={n.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontSize: 13,
                              padding: "4px 0",
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: n.online ? "#15b371" : "#cd4246",
                              }}
                            />
                            <span>{n.name}</span>
                            <span
                              style={{
                                color: "var(--bp-palette-gray-4)",
                                fontSize: 11,
                                marginLeft: "auto",
                              }}
                            >
                              {n.battery}%
                            </span>
                            <span
                              style={{
                                color: "var(--bp-palette-gray-3)",
                                fontSize: 11,
                              }}
                            >
                              {n.online ? "ONLINE" : "OFFLINE"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Workflows */}
                  <div style={{ marginTop: 16 }}>
                    <h4 className="cluster-section-title">Workflows</h4>
                    {groupWorkflows(selected.id).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {groupWorkflows(selected.id).map((w) => (
                          <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '4px 0' }}>
                            <span>{w.name}</span>
                            <span style={{ color: w.enabled ? '#15b371' : '#cd4246', fontSize: 10 }}>{w.enabled ? 'ON' : 'OFF'}</span>
                            <Button icon="cross" minimal small onClick={() => unassignWorkflow(w.id)} style={{ marginLeft: 'auto' }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--bp-palette-gray-3)', marginBottom: 8 }}>No workflows assigned.</p>
                    )}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {workflows.filter(w => !w.groupId || w.groupId === selected.id).slice(0, 5).map(w => (
                        <Button key={w.id} text={w.name} small minimal
                          onClick={() => assignWorkflow(w.id, selected.id)}
                          disabled={w.groupId === selected.id}
                          style={{ fontSize: 11 }} />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="cluster-detail-placeholder">
                Select a group to view details
              </p>
            )}
          </Card>
        </div>
      </div>

      <Dialog
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title={editing ? "Edit Group" : "New Group"}
        icon={editing ? "edit" : "plus"}
      >
        <DialogBody>
          <FormGroup label="Name" labelFor="g-name">
            <InputGroup
              id="g-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 奇点"
              maxLength={16}
              autoFocus
            />
          </FormGroup>
          <FormGroup label="Alias">
            <InputGroup
              value={alias}
              onChange={(e) => setAlias(e.target.value.toUpperCase())}
              placeholder="SINGULARITY"
              maxLength={20}
            />
          </FormGroup>
          <FormGroup label="Color">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  width: 36,
                  height: 30,
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: 13, fontFamily: "monospace" }}>
                {color}
              </span>
            </div>
          </FormGroup>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Cancel" onClick={() => setEditOpen(false)} />
              <Button
                text={editing ? "Save" : "Create"}
                intent={Intent.PRIMARY}
                loading={saving}
                disabled={!name.trim()}
                onClick={handleSave}
              />
            </>
          }
        />
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
