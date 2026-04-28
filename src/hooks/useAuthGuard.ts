import { useEffect, useRef } from 'react';
import { getSignIn, useAuthStore } from '../stores/AuthStore';
import { useLocation, useNavigate } from 'react-router-dom';

export function useAuthGuard() {
  const userContext = useAuthStore((store) => store.userContext);
  const genericClient = useAuthStore((store) => store.genericClient);
  const isSigningIn = useAuthStore((store) => store.isSigningIn);
  const signIn = useAuthStore(getSignIn);
  const navigate = useNavigate();
  const location = useLocation();
  const isRehydrating = useRef(false);

  useEffect(() => {
    const isPublicRoute = location.pathname === '/login';
    const redirectTarget = getRedirectTarget(location.state);

    if (!userContext) {
      isRehydrating.current = false;

      if (!isPublicRoute && !isSigningIn) {
        navigate('/login', {
          replace: true,
          state: { from: getCurrentPath(location) },
        });
      }

      return;
    }

    if (userContext.access === 'guest') {
      isRehydrating.current = false;

      if (isPublicRoute) {
        navigate(redirectTarget, { replace: true });
      }

      return;
    }

    if (!genericClient && !isSigningIn && !isRehydrating.current) {
      isRehydrating.current = true;
      signIn(userContext.host, userContext.token, userContext.hostType).catch(() => {
        isRehydrating.current = false;
      });
      return;
    }

    if (genericClient) {
      isRehydrating.current = false;

      if (isPublicRoute) {
        navigate(redirectTarget, { replace: true });
      }
    }
  }, [genericClient, isSigningIn, location, navigate, signIn, userContext]);
}

function getCurrentPath(location: ReturnType<typeof useLocation>) {
  return `${location.pathname}${location.search}${location.hash}`;
}

function getRedirectTarget(state: unknown) {
  const from = typeof state === 'object' && state != null && 'from' in state ? state.from : null;

  if (typeof from === 'string' && from !== '/login') {
    return from;
  }

  return '/charts';
}
