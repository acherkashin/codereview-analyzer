import type { User } from './User';

export interface Client {
  getCurrentUser(): Promise<User>;
  getPullRequests(params: any): Promise<any>;
  getComments(params: any): Promise<any>;
}
