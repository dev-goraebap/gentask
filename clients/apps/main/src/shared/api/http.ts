export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T = void>(path: string, options: RequestInit = {}): Promise<{ data: T; location: string | null }> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  const response = await fetch('/api/v1' + path, { ...options, credentials: 'same-origin', headers });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new ApiError(response.status, problem?.detail ?? problem?.title ?? `요청을 처리하지 못했습니다 (${response.status})`, problem?.code);
  }
  const body = await response.text();
  return { data: (body ? JSON.parse(body) : undefined) as T, location: response.headers.get('Location') };
}

export async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  return (await request<T>(path, { signal })).data;
}

export function createdId(location: string | null): string {
  if (!location) throw new Error('저장은 완료됐지만 생성한 항목의 주소를 받지 못했습니다. 목록을 새로고침해 주세요.');
  return decodeURIComponent(location.split('/').filter(Boolean).at(-1)!);
}
