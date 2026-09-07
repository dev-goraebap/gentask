import { get, request } from '@/shared/api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { components } from 'api-types';

export const sessionOptions = () => queryOptions({
  queryKey: ['session', 'me'],
  // 라우터도 기다리는 요청이므로 화면이 사라질 때 자동 취소하지 않는다.
  queryFn: () => get<components['schemas']['MeView']>('/me'),
  retry: false,
});
export const login = (input: { email: string; code: string }) => request('/auth/login/confirm', { method: 'POST', body: JSON.stringify(input) });
export const logout = () => request('/auth/logout', { method: 'POST' });
export function useSession() { return useQuery(sessionOptions()); }

export const requestLoginCode = (email: string) => request('/auth/login/code', { method: 'POST', body: JSON.stringify({ email }) });
