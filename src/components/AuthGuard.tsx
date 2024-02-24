import { getIsAuthenticated, useAuthStore } from '../stores/AuthStore';
import { CircularProgress, Stack, Typography } from '@mui/material';
import { useAuthGuard } from '../hooks/useAuthGuard';

export interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): JSX.Element | null {
  const isAuthenticated = useAuthStore(getIsAuthenticated);
  const isSigningIn = useAuthStore((store) => store.isSigningIn);

  // redirects to login if not authenticated
  useAuthGuard();

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
