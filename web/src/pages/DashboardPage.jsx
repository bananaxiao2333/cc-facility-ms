import { H1 } from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <H1>Dashboard</H1>
      <p>Welcome back, {user.displayName || user.username}.</p>
    </>
  );
}
