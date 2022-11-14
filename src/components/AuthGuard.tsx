import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIsAuthenticated, useAuthStore } from '../stores/AuthStore';

export interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): JSX.Element | null {
  const isAuthenticated = useAuthStore(getIsAuthenticated);
  const navigate = useNavigate();
  const ignore = useRef(false);
  const [checked, setChecked] = useState(false);

  // Only do authentication check on component mount.
  // This flow allows you to manually redirect the user after sign-out, otherwise this will be
  // triggered and will automatically redirect to sign-in page.

  useEffect(() => {
    // Prevent from calling twice in development mode with React.StrictMode enabled
    if (ignore.current) {
      return;
    }

    ignore.current = true;

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting');
      navigate('/login');
    } else {
      setChecked(true);
    }
  }, [isAuthenticated, navigate]);

  if (!checked) {
    return null;
  }

  // If got here, it means that the redirect did not occur, and that tells us that the user is
  // authenticated / authorized.

  return <>{children}</>;
}
