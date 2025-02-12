import create, { StoreApi } from 'zustand';
import {
  GuestUserContext,
  TokenUserContext,
  UserContext,
  clearUserContext,
  getUserContext,
  saveUserContext,
} from '../utils/UserContextUtils';
import { HostingType, User } from '../services/types';
import { GitService, getGitService } from '../services/GitService';
import { makeCancelable } from '../utils/PromiseUtils';

const initialState = {
  // setup user context on page loading
  userContext: getUserContext(),
  user: null as User | null,
  isSigningIn: false,
  signInError: null as string | null,
  genericClient: null as GitService | null,
};

export type AuthState = typeof initialState;

export type AuthStore = AuthState & { actions: ReturnType<typeof getActions> };

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,
  actions: getActions(set, get),
}));

function getActions(set: StoreApi<AuthStore>['setState'], get: StoreApi<AuthStore>['getState']) {
  let _cancel: (() => void) | null = null;

  return {
    signInGuest: () => {
      const guestContext: GuestUserContext = { access: 'guest' };
      saveUserContext(guestContext);
      set({
        userContext: guestContext,
        user: null,
        genericClient: null,
      });
    },
    signIn: async (host: string, token: string, hostType: HostingType) => {
      if (get().isSigningIn) {
        return;
      }

      set({ isSigningIn: true });

      const client = getGitService({ host, token, hostType });

      try {
        const userPromise = makeCancelable(client.getCurrentUser());
        const user = await userPromise.promise;
        const userContext: UserContext = { token, host, hostType, access: 'full' };
        saveUserContext(userContext);

        set({
          userContext,
          user,
          genericClient: client,
          signInError: null,
        });
      } catch (e: any) {
        if (e.isCanceled) {
          return;
        }

        set({
          userContext: null,
          user: null,
          genericClient: null,
          signInError: client.getErrorMessage(e),
        });

        throw e;
      } finally {
        _cancel = null;
        set({ isSigningIn: false });
      }
    },
    signOut() {
      set({
        userContext: null,
        user: null,
        genericClient: null,
      });
      clearUserContext();
    },
    cancelSignIn() {
      if (_cancel != null) {
        _cancel();
        _cancel = null;
      }

      set({ isSigningIn: false });
      get().actions.signOut();
    },
  };
}

export function getIsAuthenticated(store: AuthStore) {
  return store.userContext != null;
}

export function getSignIn(store: AuthStore) {
  return store.actions.signIn;
}

export function getSignInGuest(store: AuthStore) {
  return store.actions.signInGuest;
}

export function getSignOut(store: AuthStore) {
  return store.actions.signOut;
}

export function getCurrentUser(store: AuthStore) {
  return store.user;
}

export function getHostType(store: AuthStore) {
  return (store.userContext as TokenUserContext)?.hostType;
}

export function useClient(): GitService {
  return useAuthStore((store) => store.genericClient)!;
}
