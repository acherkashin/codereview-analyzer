import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIsAuthenticated, getSignIn, useAuthStore } from '../stores/AuthStore';
import { getCredentials } from '../utils/CredentialUtils';

export interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): JSX.Element | null {
  const isAuthenticated = useAuthStore(getIsAuthenticated);
  const navigate = useNavigate();
  const signIn = useAuthStore(getSignIn);

  useEffect(() => {
    if (!isAuthenticated) {
      const credentials = getCredentials();
      if (credentials) {
        signIn(credentials.host, credentials.token);
        return;
      }
      console.log('Not authenticated, redirecting');
      navigate('/login');
    }
  }, [isAuthenticated, navigate, signIn]);

  if (!isAuthenticated) {
    return null;
  }

  // If got here, it means that the redirect did not occur, and that tells us that the user is
  // authenticated / authorized.

  return <>{children}</>;
}
