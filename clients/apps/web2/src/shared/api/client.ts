import type { components } from 'api-types';

/**
 * 세션 쿠키로 인증하므로 credentials 를 항상 실어 보낸다.
 * 실패는 RFC 9457 problem detail 로 온다.
 */
export interface ProblemDetail {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetail,
  ) {
    super(problem.detail ?? problem.title ?? `요청이 실패했습니다 (${status})`);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: {
      accept: 'application/json',
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let problem: ProblemDetail = { status: res.status };
    try {
      problem = { ...problem, ...(await res.json()) };
    } catch {
      // 본문이 없거나 JSON 이 아니면 상태 코드만 남긴다.
    }
    throw new ApiError(res.status, problem);
  }

  // 상태 변경은 204 로 온다. 본문을 읽지 않는다.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

type Schemas = components['schemas'];

export type TaskView = Schemas['TaskView'];
export type CreateTask = Schemas['CreateTask'];
export type EditTask = Schemas['EditTask'];
export type ProjectView = Schemas['ProjectView'];
export type CreateProject = Schemas['CreateProject'];
export type IssueSummary = Schemas['IssueSummary'];
export type IssueView = Schemas['IssueView'];
export type CreateIssue = Schemas['CreateIssue'];
export type DocumentSummary = Schemas['DocumentSummary'];
export type DocumentView = Schemas['DocumentView'];
export type DocumentFolderSummary = Schemas['DocumentFolderSummary'];
export type MeView = Schemas['MeView'];
export type IssuedApiToken = Schemas['IssuedApiToken'];
export type PresignedUpload = Schemas['PresignedUpload'];
export type PushConfigView = Schemas['PushConfigView'];
export type PushSubscriptionStateView = Schemas['PushSubscriptionStateView'];
export type Login = Schemas['Login'];
export type Signup = Schemas['Signup'];
export type AdminUserPageView = Schemas['AdminUserPageView'];
export type PushFailurePageView = Schemas['PushFailurePageView'];
