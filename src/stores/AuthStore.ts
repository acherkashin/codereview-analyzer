import create from 'zustand';
import { Gitlab } from '@gitbeaker/browser';
import { UserSchema } from '@gitbeaker/core/dist/types/types';
import { Gitlab as GitlabType } from '@gitbeaker/core/dist/types';

export interface AuthStore {
  host: string | null;
  token: string | null;
  user: UserSchema | null;
  client: GitlabType | null;
  signIn: (host: string, token: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  host: null,
  token: null,
  user: null,
  client: null,
  signIn: async (host: string, token: string) => {
    const client = new Gitlab({
      token,
      host,
    });

    try {
      const user = await client.Users.current();

      set({
        host,
        token,
        user,
        client,
      });
    } catch (e) {
      console.error(e);

      set({
        host: null,
        token: null,
        user: null,
        client: null,
      });
    }
  },
}));
