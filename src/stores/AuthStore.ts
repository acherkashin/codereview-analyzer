import create from 'zustand';
import { Gitlab } from '@gitbeaker/browser';
import { UserSchema } from '@gitbeaker/core/dist/types/types';
import { Gitlab as GitlabType } from '@gitbeaker/core/dist/types';
import { clearCredentials, saveCredentials } from '../utils/CredentialUtils';
import { isValidHttpUrl } from '../utils/UrlUtils';
import { Client } from '../clients/types/Client';
import { GiteaClient } from '../clients/GiteaClient';
import { User } from '../clients/types/User';

export interface AuthStore {
  host: string | null;
  token: string | null;
  user: User | null;
  client: GitlabType | null;
  genericClient: Client | null;
  isSigningIn: boolean;
  signInError: string | null;
  signIn: (host: string, token: string) => Promise<void>;
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
  signIn: async (host: string, token: string) => {
    if (!isValidHttpUrl(host)) {
      throw Error(`Incorrect url provided: ${host}`);
    }

    if (get().isSigningIn) {
      return;
    }

    set({ isSigningIn: true });

    // const client = new Gitlab({
    //   token,
    //   host,
    // });

    const client: Client = new GiteaClient(host, token);

    try {
      const user = await client.getCurrentUser();
      saveCredentials({ token, host });

      set({
        host,
        token,
        user,
        client: null,
        genericClient: client,
      });
    } catch (e) {
      set({
        host: null,
        token: null,
        user: null,
        client: null,
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
      host: null,
      token: null,
      user: null,
      client: null,
      genericClient: null,
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

export function useClient(): GitlabType {
  return useAuthStore(getClient)!;
}

function getClient(store: AuthStore) {
  return store.client;
}
