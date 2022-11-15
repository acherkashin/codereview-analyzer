import create from 'zustand';
import { Gitlab } from '@gitbeaker/browser';
import { UserSchema } from '@gitbeaker/core/dist/types/types';
import { Gitlab as GitlabType } from '@gitbeaker/core/dist/types';
import { clearCredentials, saveCredentials } from '../utils/CredentialUtils';
import { isValidHttpUrl } from '../utils/UrlUtils';

export interface AuthStore {
  host: string | null;
  token: string | null;
  user: UserSchema | null;
  client: GitlabType | null;
  isSigningIn: boolean;
  signIn: (host: string, token: string) => Promise<void>;
  signOut: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  host: null,
  token: null,
  user: null,
  client: null,
  isSigningIn: false,
  signIn: async (host: string, token: string) => {
    if (!isValidHttpUrl(host)) {
      throw Error(`Incorrect url provided: ${host}`);
    }

    if (get().isSigningIn) {
      return;
    }

    set({ isSigningIn: true });

    const client = new Gitlab({
      token,
      host,
    });

    try {
      const user = await client.Users.current();
      saveCredentials({ token, host });

      set({
        host,
        token,
        user,
        client,
      });
    } catch (e) {
      set({
        host: null,
        token: null,
        user: null,
        client: null,
      });

      console.error(e);

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
    });
    clearCredentials();
  },
}));

export function getIsAuthenticated(store: AuthStore) {
  return store.client != null;
}

export function getSignIn(store: AuthStore) {
  return store.signIn;
}

export function useClient(): GitlabType {
  return useAuthStore(getClient)!;
}

function getClient(store: AuthStore) {
  return store.client;
}
