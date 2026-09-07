import { ApiError } from '@/shared/api';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

let onExpired: (() => void) | undefined;
export function onSessionExpired(handler: () => void) { onExpired = handler; }
const expired = (error: Error) => { if (error instanceof ApiError && error.status === 401) onExpired?.(); };
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: expired }),
  mutationCache: new MutationCache({ onError: (error, _variables, _result, mutation) => { if (!mutation.meta?.login) expired(error); } }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => count < 2 && (!(error instanceof ApiError) || error.status >= 500),
    },
    mutations: { retry: false },
  },
});
