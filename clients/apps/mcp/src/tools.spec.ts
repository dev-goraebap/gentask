import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it } from 'vitest';
import { MISSING_TOKEN, readConfig } from './config.js';
import { GentaskClient } from './gentask-client.js';
import { registerTaskTools } from './tools.js';

// AGT-001 에이전트로 작업 다루기
//
// 도구가 API 를 바르게 부르는지를 본다. 클라이언트가 프로세스를 띄우고 표준입출력으로 말하는
// 대목은 이 계층이 덮지 못하며 그 자리는 작업자가 직접 확인한다 (결정-0008).

interface 오간것 {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

/** 정한 응답을 내고 무엇이 나갔는지 담아 두는 가짜 통로. */
function 가짜통로(응답: (요청: 오간것) => Response) {
  const 기록: 오간것[] = [];
  const fetchFn = (async (url: string | URL, init?: RequestInit) => {
    const 것 = {
      url: String(url),
      method: init?.method ?? 'GET',
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
    };
    기록.push(것);
    return 응답(것);
  }) as unknown as typeof fetch;
  return { 기록, fetchFn };
}

const 작업 = {
  id: 'task-1',
  title: '옛 제목',
  note: '남겨 둘 메모',
  dueDate: '2026-12-31',
  remindAt: null,
  important: false,
  myDayOn: false,
  completedAt: null,
  createdAt: '2026-08-30T00:00:00Z',
};

function 응답(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}

/** 등록된 도구를 이름으로 꺼낸다. 서버를 띄우지 않고 콜백을 직접 부르기 위해서다. */
function 도구들(fetchFn: typeof fetch) {
  const 모음 = new Map<string, (args: Record<string, unknown>) => Promise<unknown>>();
  const 가짜서버 = {
    registerTool: (
      name: string,
      _config: unknown,
      cb: (args: Record<string, unknown>) => Promise<unknown>,
    ) => {
      모음.set(name, cb);
      return {};
    },
  };
  const client = new GentaskClient({ baseUrl: 'https://api.example', token: 'T' }, fetchFn);
  registerTaskTools(가짜서버 as unknown as McpServer, client);
  return 모음;
}

describe('TG-010 에이전트로 작업 다루기', () => {
  it('TG-010 #1: 작업을 남기면 그 토큰을 실어 그 계정에 만든다', async () => {
    const { 기록, fetchFn } = 가짜통로(() =>
      응답(null, 201, { location: '/api/v1/tasks/new-1' }),
    );

    const 결과 = await 도구들(fetchFn).get('add_task')!({ title: '장 보기', dueDate: null });

    expect(기록[0]?.method).toBe('POST');
    expect(기록[0]?.url).toBe('https://api.example/api/v1/tasks');
    expect(기록[0]?.headers['Authorization']).toBe('Bearer T');
    expect(기록[0]?.body).toEqual({ title: '장 보기', dueDate: null });
    expect(JSON.stringify(결과)).toContain('new-1');
  });

  it('TG-010 #2: 목록을 요청하면 그 토큰으로 작업 API 를 부른다', async () => {
    const { 기록, fetchFn } = 가짜통로(() => 응답([작업]));

    const 결과 = await 도구들(fetchFn).get('list_tasks')!({});

    expect(기록[0]?.method).toBe('GET');
    expect(기록[0]?.url).toBe('https://api.example/api/v1/tasks');
    expect(기록[0]?.headers['Authorization']).toBe('Bearer T');
    expect(JSON.stringify(결과)).toContain('옛 제목');
  });

  it('TG-010 #3: 속성을 고치면 그 변경을 보내고 넘기지 않은 값은 지금 것을 둔다', async () => {
    const { 기록, fetchFn } = 가짜통로((요청) =>
      요청.method === 'GET' ? 응답(작업) : 응답(null, 204),
    );

    await 도구들(fetchFn).get('edit_task')!({ taskId: 'task-1', title: '새 제목' });

    const 고침 = 기록.find((것) => 것.method === 'PATCH');
    expect(고침?.url).toBe('https://api.example/api/v1/tasks/task-1');
    // 제목만 바뀌고 메모와 기한은 그대로다
    expect(고침?.body).toEqual({
      title: '새 제목',
      note: '남겨 둘 메모',
      dueDate: '2026-12-31',
      remindAt: null,
    });
  });

  it('TG-010 #3: null 을 넘기면 그 값을 비운다', async () => {
    const { 기록, fetchFn } = 가짜통로((요청) =>
      요청.method === 'GET' ? 응답(작업) : 응답(null, 204),
    );

    await 도구들(fetchFn).get('edit_task')!({ taskId: 'task-1', dueDate: null });

    const 고침 = 기록.find((것) => 것.method === 'PATCH');
    expect((고침?.body as { dueDate: unknown }).dueDate).toBeNull();
  });

  it('TG-010 #4: 작업을 거두면 그것을 지운다', async () => {
    const { 기록, fetchFn } = 가짜통로(() => 응답(null, 204));

    await 도구들(fetchFn).get('delete_task')!({ taskId: 'task-1' });

    expect(기록[0]?.method).toBe('DELETE');
    expect(기록[0]?.url).toBe('https://api.example/api/v1/tasks/task-1');
  });

  it('TG-010 #5: 토큰이 받아들여지지 않으면 다시 발급해야 함을 알린다', async () => {
    const { fetchFn } = 가짜통로(() => 응답({ code: 'UNAUTHENTICATED' }, 401));

    await expect(도구들(fetchFn).get('list_tasks')!({})).rejects.toThrow(/다시 발급/);
  });

  it('TG-010 #6: 토큰이 설정에 없으면 붙지 않고 두어야 함을 알린다', () => {
    expect(() => readConfig({})).toThrow(MISSING_TOKEN);
    expect(() => readConfig({ GENTASK_TOKEN: '   ' })).toThrow(MISSING_TOKEN);
    expect(readConfig({ GENTASK_TOKEN: 'T' }).token).toBe('T');
  });

  it('TG-010 #7: 가리키는 작업이 그 주인의 것이 아니면 서버가 낸 사유를 그대로 옮긴다', async () => {
    const { fetchFn } = 가짜통로(() =>
      응답({ code: 'TASK_NOT_FOUND', detail: '작업을 찾을 수 없습니다' }, 404),
    );

    await expect(도구들(fetchFn).get('get_task')!({ taskId: '남의것' })).rejects.toThrow(
      '작업을 찾을 수 없습니다',
    );
  });

  it('설정한 자리로 부른다', () => {
    expect(readConfig({ GENTASK_TOKEN: 'T' }).baseUrl).toBe('https://api.gentask.xyz');
    expect(readConfig({ GENTASK_TOKEN: 'T', GENTASK_BASE_URL: 'http://localhost:8080/' }).baseUrl).toBe(
      'http://localhost:8080',
    );
  });
});
