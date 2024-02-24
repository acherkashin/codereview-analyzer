import create, { StoreApi } from 'zustand';
import {
  GuestUserContext,
  HostingType,
  TokenUserContext,
  UserContext,
  clearUserContext,
  saveUserContext,
} from '../utils/UserContextUtils';
import { isValidHttpUrl } from '../utils/UrlUtils';
import { User } from '../services/types';
import { GitService, getGitService } from '../services/GitService';

const initialState = {
  userContext: null as UserContext | null,
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
      if (!isValidHttpUrl(host)) {
        throw Error(`Incorrect url provided: ${host}`);
      }

      if (get().isSigningIn) {
        return;
      }

      set({ isSigningIn: true });

      const client = getGitService({ host, token, hostType });

      try {
        const user = await client.getCurrentUser();
        const userContext: UserContext = { token, host, hostType, access: 'full' };
        saveUserContext(userContext);

        set({
          userContext,
          user,
          genericClient: client,
        });
      } catch (e) {
        set({
          userContext: null,
          user: null,
          genericClient: null,
        });

        set({ signInError: (e as any).toString() });

        throw e;
      } finally {
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
