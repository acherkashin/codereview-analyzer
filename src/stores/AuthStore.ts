import create from 'zustand';
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

export interface AuthStore {
  userContext: UserContext | null;
  user: User | null;
  genericClient: GitService | null;
  isSigningIn: boolean;
  signInError: string | null;
  signInGuest: () => void;
  signIn: (host: string, token: string, hostType: HostingType) => Promise<void>;
  signOut: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  userContext: null,
  user: null,
  isSigningIn: false,
  signInError: null,
  genericClient: null,
  hostType: null,
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
}));

export function getIsAuthenticated(store: AuthStore) {
  return store.userContext != null;
}

export function getSignIn(store: AuthStore) {
  return store.signIn;
}

export function getSignInGuest(store: AuthStore) {
  return store.signInGuest;
}

export function getSignOut(store: AuthStore) {
  return store.signOut;
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
