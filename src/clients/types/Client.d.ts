import type { User } from './User';

export interface Client {
  getCurrentUser(): Promise<User>;
}
