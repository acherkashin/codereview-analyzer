import create from 'zustand';
import { Gitlab as GitlabType } from '@gitbeaker/core/dist/types';
import { clearCredentials, getCredentials, saveCredentials } from '../utils/CredentialUtils';
import { isValidHttpUrl } from '../utils/UrlUtils';
import { User } from '../services/types';
import { GitService, HostingType, getGitService } from '../services/GitService';

export interface AuthStore {
  host: string | null;
  hostType: HostingType | null;
  token: string | null;
  user: User | null;
  client: GitlabType | null;
  genericClient: GitService | null;
  isSigningIn: boolean;
  signInError: string | null;
  signInGuest: () => void;
  signIn: (host: string, token: string, hostType: HostingType) => Promise<void>;
  signOut: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  host: null,
  token: null,
  user: null,
  client: null,
  isSigningIn: false,
  signInError: null,
  genericClient: null,
  hostType: null,
  signInGuest: () => {
    saveCredentials('guest');
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
      saveCredentials({ token, host, hostType });

      set({
        host,
        token,
        user,
        client: null,
        genericClient: client,
        hostType,
      });
    } catch (e) {
      set({
        host: null,
        token: null,
        user: null,
        client: null,
        genericClient: null,
        hostType: null,
      });

      set({ signInError: (e as any).toString() });

      throw e;
    } finally {
      set({ isSigningIn: false });
    }
  },
  signOut() {
    set({
      host: null,
      token: null,
      user: null,
      client: null,
      genericClient: null,
      hostType: null,
    });
    clearCredentials();
  },
}));

export function getIsAuthenticated(store: AuthStore) {
  return store.user != null || getCredentials() === 'guest';
}

export function getSignIn(store: AuthStore) {
  return store.signIn;
}

export function getSignOut(store: AuthStore) {
  return store.signOut;
}

export function getCurrentUser(store: AuthStore) {
  return store.user;
}

export function getHostType(store: AuthStore) {
  return store.hostType;
}

export function useClient(): GitService {
  return useAuthStore((store) => store.genericClient)!;
}
