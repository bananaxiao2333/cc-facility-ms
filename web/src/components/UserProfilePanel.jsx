import { useState } from 'react';
import { Card, FormGroup, InputGroup, Button, Intent, Divider } from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../api/auth';

export default function UserProfilePanel() {
  const { user, logout } = useAuth();

  // Display name
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [nameMsg, setNameMsg] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Password
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
      setNameMsg('Updated');
    } catch (e) {
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
      setPwMsg('Password changed. Please log in again.');
      setTimeout(logout, 1500);
    } catch (e) {
      setPwMsg(e.message);
      setPwErr(true);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <Card style={{ width: 320 }}>
      <h3 style={{ margin: '0 0 12px' }}>Profile</h3>

      <div className="profile-info">
        <div className="profile-info-row">
          <span className="profile-info-label">Username</span>
          <span>{user.username}</span>
        </div>
        <div className="profile-info-row">
          <span className="profile-info-label">Role</span>
          <span>{user.role}</span>
        </div>
        <div className="profile-info-row">
          <span className="profile-info-label">Group</span>
          <span>{user.groupId || '—'}</span>
        </div>
      </div>

      <Divider />

      <h4 style={{ margin: '0 0 8px' }}>Display Name</h4>
      <FormGroup>
        <InputGroup
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter display name"
        />
      </FormGroup>
      {nameMsg && <p style={{ fontSize: 13, color: '#5f6b7c', marginTop: -8 }}>{nameMsg}</p>}
      <Button
        text="Save"
        intent={Intent.PRIMARY}
        small
        loading={savingName}
        disabled={!displayName}
        onClick={handleSaveName}
      />

      <Divider />

      <h4 style={{ margin: '0 0 8px' }}>Change Password</h4>
      <FormGroup label="Current password" style={{ marginBottom: 8 }}>
        <InputGroup
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="Current password"
        />
      </FormGroup>
      <FormGroup label="New password">
        <InputGroup
          type="password"
          value={nextPw}
          onChange={(e) => setNextPw(e.target.value)}
          placeholder="New password (min 8 chars)"
        />
      </FormGroup>
      {pwMsg && <p style={{ fontSize: 13, color: pwErr ? 'var(--bp-intent-danger-rest)' : '#5f6b7c', marginTop: -8 }}>{pwMsg}</p>}
      <Button
        text="Change Password"
        intent={Intent.WARNING}
        small
        loading={savingPw}
        disabled={!currentPw || !nextPw}
        onClick={handleChangePw}
      />
    </Card>
  );
}
