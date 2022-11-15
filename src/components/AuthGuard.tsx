import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIsAuthenticated, useAuthStore } from '../stores/AuthStore';
import { getCredentials } from '../utils/CredentialUtils';

export interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): JSX.Element | null {
  const isAuthenticated = useAuthStore(getIsAuthenticated);
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const { signIn } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      const credentials = getCredentials();
      if (credentials) {
        signIn(credentials.token, credentials.host).then(() => setChecked(true));
        return;
      }
      console.log('Not authenticated, redirecting');
      navigate('/login');
    } else {
      setChecked(true);
    }
  }, [isAuthenticated, navigate, signIn]);

  if (!checked) {
    return null;
  }

  // If got here, it means that the redirect did not occur, and that tells us that the user is
  // authenticated / authorized.

  return <>{children}</>;
}
