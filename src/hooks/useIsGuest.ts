import { getUserContext } from '../utils/UserContextUtils';

export function useIsGuest() {
  return getUserContext()?.access === 'guest';
}
