import { get, request } from '@/shared/api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { components } from 'api-types';

export const sessionOptions = () => queryOptions({
  queryKey: ['session', 'me'],
  queryFn: ({ signal }) => get<components['schemas']['MeView']>('/me', signal),
  retry: false,
});
export const login = (input: components['schemas']['Login']) => request('/auth/login', { method: 'POST', body: JSON.stringify(input) });
export const logout = () => request('/auth/logout', { method: 'POST' });
export function useSession() { return useQuery(sessionOptions()); }
