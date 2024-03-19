import { HostingType } from '../services/types';

export interface GuestUserContext {
  access: 'guest';
}

export interface Credentials {
  token: string;
  host: string;
  hostType: HostingType;
}

export interface TokenUserContext extends Credentials {
  access: 'full';
}

export type UserContext = GuestUserContext | TokenUserContext;

export function getUserContext(): UserContext | null {
  const strCredentials = localStorage.getItem('credentials');
  if (strCredentials) {
    return JSON.parse(strCredentials) as UserContext;
  } else {
    return null;
  }
}

export function saveUserContext(userContext: UserContext) {
  localStorage.setItem('credentials', JSON.stringify(userContext));
}

export function clearUserContext() {
  localStorage.removeItem('credentials');
}
