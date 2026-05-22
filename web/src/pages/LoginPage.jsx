import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, FormGroup, InputGroup, Button, Intent, H2 } from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

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
    <div style={{ maxWidth: 400, margin: '80px auto 0' }}>
      <Card>
        <H2>Login</H2>
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
  );
}
