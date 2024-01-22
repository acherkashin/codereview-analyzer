import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIsAuthenticated, getSignIn, useAuthStore } from '../stores/AuthStore';
import { getCredentials } from '../utils/CredentialUtils';
import { CircularProgress, Stack, Typography } from '@mui/material';

export interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): JSX.Element | null {
  const isAuthenticated = useAuthStore(getIsAuthenticated);
  const { isSigningIn } = useAuthStore((store) => ({
    isSigningIn: store.isSigningIn,
  }));
  const navigate = useNavigate();
  const signIn = useAuthStore(getSignIn);

  useEffect(() => {
    if (!isAuthenticated) {
      const credentials = getCredentials();
      if (credentials) {
        signIn(credentials.host, credentials.token, credentials.hostType);
        return;
      }
      console.log('Not authenticated, redirecting');
      navigate('/login');
    }
  }, [isAuthenticated, navigate, signIn]);

  if (isSigningIn) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Stack spacing={2} direction="column">
          <CircularProgress style={{ alignSelf: 'center' }} />
          <Typography>Signing in</Typography>
        </Stack>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // If got here, it means that the redirect did not occur, and that tells us that the user is
  // authenticated / authorized.

  return <>{children}</>;
}
