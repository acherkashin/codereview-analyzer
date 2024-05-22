import { useEffect } from 'react';

export function useUnhandledRefection(callback: (event: PromiseRejectionEvent) => void, deps: React.DependencyList) {
  useEffect(() => {
    window.addEventListener('unhandledrejection', callback);

    return () => {
      window.removeEventListener('unhandledrejection', callback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
