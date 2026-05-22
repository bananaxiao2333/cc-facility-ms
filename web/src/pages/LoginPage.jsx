import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, FormGroup, InputGroup, Button, Intent } from '@blueprintjs/core';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const MODE_META = {
  auto:  { icon: 'contrast',     label: 'Auto' },
  light: { icon: 'flash',        label: 'Light' },
  dark:  { icon: 'moon',         label: 'Dark' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const { mode, cycle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';
  const meta = MODE_META[mode];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card-wrapper">
        <div className="login-header">
          <img src="/favicon.png" alt="" className="login-header-icon" />
          <span className="login-header-title">CC Facility</span>
        </div>
        <Card>
          <form onSubmit={handleSubmit}>
            <FormGroup label="Username" labelFor="login-username">
              <InputGroup
                id="login-username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </FormGroup>
            <FormGroup label="Password" labelFor="login-password">
              <InputGroup
                id="login-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormGroup>
            {error && (
              <p style={{ color: 'var(--bp-intent-danger-rest)', fontSize: 14, marginBottom: 12 }}>
                {error}
              </p>
            )}
            <Button
              type="submit"
              intent={Intent.PRIMARY}
              text="Sign In"
              loading={submitting}
              disabled={!username || !password}
              fill
            />
          </form>
        </Card>
      </div>
      <div className="login-theme-toggle">
        <Button
          icon={meta.icon}
          minimal
          small
          text={`Theme: ${meta.label}`}
          onClick={cycle}
        />
      </div>
    </div>
  );
}
