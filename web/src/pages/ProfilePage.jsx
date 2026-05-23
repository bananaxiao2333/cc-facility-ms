import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormGroup, InputGroup, Button, Intent, Dialog, DialogBody, DialogFooter } from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateProfile, changePassword } from '../api/auth';

const GROUP_META = {
  group_1: { name: '奇点', color: '#b00020', desc: 'Singularity — the origin point from which all structure unfolds. Singularity operatives are the foundational architects of facility infrastructure, tasked with maintaining core systems, enforcing integrity protocols, and ensuring that every subsystem converges toward a unified operational state.' },
  group_2: { name: '星云', color: '#3526a7', desc: 'Nebula — vast, diffuse clouds of latent potential coalescing into form. Nebula operatives specialise in expansion, outreach, and the transformation of unstructured resources into high-value operational assets.' },
  group_3: { name: '脉冲星', color: '#8a7b00', desc: 'Pulsar — precision-timed emissions cutting through the noise with unwavering regularity. Pulsar operatives govern monitoring, reporting, and operational cadence. Every metric passes through their instruments.' },
  group_4: { name: '磁陀星', color: '#7b008f', desc: 'Magnetar — an intense gravitational presence that shapes the behaviour of everything within its field. Magnetar operatives control resource distribution, allocation policy, and the delicate equilibrium of power across the facility.' },
};

const ADMIN_GROUP = { name: '—', color: '#5f6b7c', desc: 'Administrator — unrestricted access across all facility domains. The administrator holds root authority over user provisioning, ledger reconciliation, reward distribution, and system configuration. Every audit trail begins and ends here. There is no oversight because the administrator is the oversight.' };

const DEFAULT_GROUP = { name: '—', color: '#5f6b7c', desc: 'Operator — the steady hand that keeps the facility breathing. Operators respond to incidents, monitor system health, perform routine maintenance, and ensure that every component remains in its designated operating envelope. No shift goes uncovered; no alert goes unanswered.' };

function getGroup(groupId) {
  if (!groupId) return ADMIN_GROUP;
  return GROUP_META[groupId] || DEFAULT_GROUP;
}

function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const group = getGroup(user.groupId);

  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [nameOpen, setNameOpen] = useState(false);
  const [nameMsg, setNameMsg] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [nextPw, setNextPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleSaveName = async () => {
    setSavingName(true);
    setNameMsg('');
    try {
      const data = await updateProfile({ displayName });
      setDisplayName(data.user.displayName || '');
      await refreshUser();
      setNameMsg('Saved');
      toast.success('Display name updated');
      setTimeout(() => setNameOpen(false), 800);
    } catch (e) {
      toast.error(e.message);
      setNameMsg(e.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePw = async () => {
    setPwErr(false);
    setPwMsg('');
    setSavingPw(true);
    try {
      await changePassword(currentPw, nextPw);
      setPwMsg('Password changed. Logging out...');
      toast.success('Password changed — logging out');
      setTimeout(() => { logout(); navigate('/login'); }, 1500);
    } catch (e) {
      toast.error(e.message);
      setPwMsg(e.message);
      setPwErr(true);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="profile-page">
      {/* Username — absolute, huge, stroke text, rotated -90deg */}
      <div className="profile-username-abs">
        {user.displayName || user.username}
      </div>

      {/* Body: ID + lines + description */}
      <div className="profile-body">
        <div className="profile-id-block">
          <span className="profile-id-text">{user.id.toUpperCase()}</span>
          <span className="profile-role-text">{user.role.toUpperCase()}</span>
        </div>
        <div className="profile-three-lines" />
        <p className="profile-group-desc">{group.desc}</p>
      </div>

      {/* Favicon between desc and params, right-aligned */}
      <div className="profile-favicon-row">
        <img src="/favicon.png" alt="" className="profile-favicon" />
      </div>

      {/* Parameters section */}
      <div className="profile-params">
        <h3 className="profile-params-title">Parameters</h3>
        <div className="profile-params-table">
          <div className="profile-params-col">
            <span className="profile-params-head">Username</span>
            <span className="profile-params-val">{user.username}</span>
          </div>
          <span className="profile-params-sep" />
          <div className="profile-params-col">
            <span className="profile-params-head">Display</span>
            <span className="profile-params-val">{user.displayName || '—'}</span>
          </div>
          <span className="profile-params-sep" />
          <div className="profile-params-col">
            <span className="profile-params-head">Role</span>
            <span className="profile-params-val">{user.role}</span>
          </div>
          <span className="profile-params-sep" />
          <div className="profile-params-col">
            <span className="profile-params-head">Group</span>
            <span className="profile-params-val">{group.name}</span>
          </div>
          <span className="profile-params-sep" />
          <div className="profile-params-col">
            <span className="profile-params-head">Created</span>
            <span className="profile-params-val">{fmtDate(user.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Divider + Actions */}
      <div className="profile-actions-section">
        <h3 className="profile-actions-title">Settings</h3>
      </div>
      <div className="profile-actions">
        <Button
          icon="edit"
          text="Change Display Name"
          onClick={() => { setNameOpen(true); setNameMsg(''); }}
        />
        <Button
          icon="lock"
          text="Change Password"
          intent={Intent.WARNING}
          style={{ marginTop: 8 }}
          onClick={() => { setPwOpen(true); setCurrentPw(''); setNextPw(''); setPwMsg(''); }}
        />
      </div>

      {/* Change Display Name Dialog */}
      <Dialog isOpen={nameOpen} onClose={() => setNameOpen(false)} title="Change Display Name" icon="edit">
        <DialogBody>
          <FormGroup label="Display Name">
            <InputGroup
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
              autoFocus
            />
          </FormGroup>
          {nameMsg && <p style={{ fontSize: 13, color: 'var(--bp-intent-success-rest)' }}>{nameMsg}</p>}
        </DialogBody>
        <DialogFooter actions={<><Button text="Cancel" onClick={() => setNameOpen(false)} /><Button text="Save" intent={Intent.PRIMARY} loading={savingName} disabled={!displayName} onClick={handleSaveName} /></>} />
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog isOpen={pwOpen} onClose={() => setPwOpen(false)} title="Change Password" icon="lock">
        <DialogBody>
          <FormGroup label="Current password">
            <InputGroup type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Current password" />
          </FormGroup>
          <FormGroup label="New password">
            <InputGroup type="password" value={nextPw} onChange={(e) => setNextPw(e.target.value)} placeholder="New password (min 8 chars)" />
          </FormGroup>
          {pwMsg && <p style={{ fontSize: 13, color: pwErr ? 'var(--bp-intent-danger-rest)' : 'var(--bp-intent-success-rest)' }}>{pwMsg}</p>}
        </DialogBody>
        <DialogFooter actions={<><Button text="Cancel" onClick={() => setPwOpen(false)} /><Button text="Change Password" intent={Intent.WARNING} loading={savingPw} disabled={!currentPw || !nextPw} onClick={handleChangePw} /></>} />
      </Dialog>
    </div>
  );
}
