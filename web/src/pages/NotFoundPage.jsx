import { NonIdealState, Button } from '@blueprintjs/core';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <NonIdealState
      icon="search"
      title="Page not found"
      description="The page you are looking for does not exist."
      action={
        <Button intent="primary" text="Go Home" onClick={() => navigate('/')} />
      }
    />
  );
}
