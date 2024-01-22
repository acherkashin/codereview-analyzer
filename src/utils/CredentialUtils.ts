import { HostingType } from '../stores/AuthStore';

export interface Credentials {
  token: string;
  host: string;
  hostType: HostingType;
}

export function getCredentials() {
  const strCredentials = localStorage.getItem('credentials');
  if (strCredentials) {
    return JSON.parse(strCredentials) as Credentials;
  } else {
    return null;
  }
}

export function saveCredentials(credentials: Credentials) {
  localStorage.setItem('credentials', JSON.stringify(credentials));
}

export function clearCredentials() {
  localStorage.removeItem('credentials');
}
