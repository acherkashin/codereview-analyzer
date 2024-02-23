import { useEffect } from 'react';
import { getUserContext } from '../utils/UserContextUtils';
import { getIsAuthenticated, getSignIn, useAuthStore } from '../stores/AuthStore';
import { useNavigate } from 'react-router-dom';

export function useAuthGuard() {
  const isAuthenticated = useAuthStore(getIsAuthenticated);
  const signIn = useAuthStore(getSignIn);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      const credentials = getUserContext();
      if (credentials) {
        if (credentials.access === 'full') {
          signIn(credentials.host, credentials.token, credentials.hostType);
        }

        navigate('/personal');
        return;
      }
      console.log('Not authenticated, redirecting');
      navigate('/login');
    }
  }, [isAuthenticated, navigate, signIn]);
}
