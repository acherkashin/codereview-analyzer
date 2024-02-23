import { Credentials } from '../services/GitService';

export function getCredentials(): Credentials | 'guest' | null {
  const strCredentials = localStorage.getItem('credentials');
  if (strCredentials) {
    return JSON.parse(strCredentials) as Credentials | 'guest';
  } else {
    return null;
  }
}

export function saveCredentials(credentials: Credentials | 'guest') {
  localStorage.setItem('credentials', JSON.stringify(credentials));
}

export function clearCredentials() {
  localStorage.removeItem('credentials');
}
