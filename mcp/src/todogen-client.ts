import type { Config } from './config.js';
import type { components } from './generated/schema.js';

/**
 * 작업 하나.
 *
 * <p>손으로 적지 않고 API 명세가 만든 것을 쓴다(결정-0003). 계약이 바뀌면 이 자리가 컴파일 오류로
 * 드러나며, 다시 적어 두면 그 변화가 조용히 지나간다.
 */
export type Task = components['schemas']['TaskView'];

/**
 * 서버가 거절했다.
 *
 * <p>사유를 그대로 옮긴다. 다시 시도할지 사용자에게 물을지는 이 서버가 정하지 않고 에이전트가 정한다.
 */
export class TodogenError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    detail: string,
  ) {
    super(detail);
    this.name = 'TodogenError';
  }
}

/** 자격이 서지 않았다. 토큰을 다시 발급해야 하는 자리이며 AGT-001 의 A2 다. */
export const UNAUTHENTICATED =
  '토큰이 받아들여지지 않았습니다. todogen 의 계정 화면에서 에이전트 토큰을 다시 발급해 설정에 두세요.';

/**
 * 작업 API 를 부르는 자리.
 *
 * <p>판정하거나 저장하는 것이 없다. 규칙은 모두 서버가 가지며 여기는 옮기기만 한다.
 */
export class TodogenClient {
  constructor(
    private readonly config: Config,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  list(): Promise<readonly Task[]> {
    return this.send<readonly Task[]>('GET', '/api/v1/tasks');
  }

  get(taskId: string): Promise<Task> {
    return this.send<Task>('GET', `/api/v1/tasks/${encodeURIComponent(taskId)}`);
  }

  /** 만든 작업의 식별자는 Location 헤더가 낸다. */
  async add(title: string, dueDate: string | null): Promise<string> {
    const response = await this.raw('POST', '/api/v1/tasks', { title, dueDate });
    const location = response.headers.get('location') ?? '';
    return location.split('/').pop() ?? '';
  }

  /** 네 값을 함께 보낸다. 서버의 편집은 부분 갱신이 아니라 그 넷을 그대로 받는다. */
  async edit(
    taskId: string,
    fields: {
      title: string;
      note: string;
      dueDate: string | null;
      remindAt: string | null;
    },
  ): Promise<void> {
    await this.raw('PATCH', `/api/v1/tasks/${encodeURIComponent(taskId)}`, fields);
  }

  async setCompleted(taskId: string, completed: boolean): Promise<void> {
    await this.raw('PATCH', `/api/v1/tasks/${encodeURIComponent(taskId)}/completion`, {
      completed,
    });
  }

  async setImportant(taskId: string, important: boolean): Promise<void> {
    await this.raw('PATCH', `/api/v1/tasks/${encodeURIComponent(taskId)}/importance`, {
      important,
    });
  }

  async setMyDay(taskId: string, inMyDay: boolean): Promise<void> {
    await this.raw('PATCH', `/api/v1/tasks/${encodeURIComponent(taskId)}/my-day`, { inMyDay });
  }

  async remove(taskId: string): Promise<void> {
    await this.raw('DELETE', `/api/v1/tasks/${encodeURIComponent(taskId)}`);
  }

  // --- 보조 ---------------------------------------------------------------------------------------

  private async send<T>(method: string, path: string): Promise<T> {
    const response = await this.raw(method, path);
    return (await response.json()) as T;
  }

  private async raw(method: string, path: string, body?: unknown): Promise<Response> {
    const response = await this.fetchFn(`${this.config.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      throw await toError(response);
    }
    return response;
  }
}

/**
 * 실패 응답을 옮긴다.
 *
 * <p>서버는 RFC 9457 로 답하며 `code` 가 분기의 계약이다(결정-0004). 자격이 서지 않은 것만 여기서
 * 말을 바꾸는데, 그 자리는 토큰을 다시 발급해야 한다는 것이 사용자가 알아야 할 전부이기 때문이다.
 */
async function toError(response: Response): Promise<TodogenError> {
  if (response.status === 401) {
    return new TodogenError(401, 'UNAUTHENTICATED', UNAUTHENTICATED);
  }

  let code: string | null = null;
  let detail = `요청이 실패했습니다 (HTTP ${response.status})`;
  try {
    const problem = (await response.json()) as { code?: string; detail?: string };
    code = problem.code ?? null;
    detail = problem.detail ?? detail;
  } catch {
    // 본문이 없거나 JSON 이 아니면 상태 코드만 남긴다
  }
  return new TodogenError(response.status, code, detail);
}
