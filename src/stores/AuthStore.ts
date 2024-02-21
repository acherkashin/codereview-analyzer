import create from 'zustand';
import { Gitlab as GitlabType } from '@gitbeaker/core/dist/types';
import { clearCredentials, saveCredentials } from '../utils/CredentialUtils';
import { isValidHttpUrl } from '../utils/UrlUtils';
import { User } from '../clients/types';
import { Client, HostingType, getClient } from '../clients/Client';

export interface AuthStore {
  host: string | null;
  hostType: HostingType | null;
  token: string | null;
  user: User | null;
  client: GitlabType | null;
  genericClient: Client | null;
  isSigningIn: boolean;
  signInError: string | null;
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
  signIn: async (host: string, token: string, hostType: HostingType) => {
    if (!isValidHttpUrl(host)) {
      throw Error(`Incorrect url provided: ${host}`);
    }

    if (get().isSigningIn) {
      return;
    }

    set({ isSigningIn: true });

    const client = getClient({ host, token, hostType });

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
  return store.user != null;
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

export function useClient(): Client {
  return useAuthStore((store) => store.genericClient)!;
}
