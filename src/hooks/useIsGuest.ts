import { useAuthStore } from '../stores/AuthStore';

export function useIsGuest() {
  return useAuthStore((store) => store.userContext?.access) === 'guest';
}
