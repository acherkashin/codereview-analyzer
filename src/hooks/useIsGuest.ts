import { getCredentials } from '../utils/CredentialUtils';

export function useIsGuest() {
  return getCredentials() === 'guest';
}
