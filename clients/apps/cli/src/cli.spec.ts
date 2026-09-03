import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { run } from './cli.js';
import { MISSING_TOKEN, configPath, readConfig, storeToken } from './config.js';
import { displayWidth, formatList } from './format.js';
import { GentaskClient, type Task } from './gentask-client.js';

/**
 * 각 명령이 API 를 올바르게 호출하는지 검증한다.
 *
 * 다른 프로세스가 이 명령을 실행하고 출력을 읽는 경로는 여기서 검증하지 않는다. 결정-0008 이
 * 해당 범위를 작업자의 확인으로 규정한다.
 */

function task(over: Partial<Task> = {}): Task {
  return {
    id: '11111111-2222-3333-4444-555555555555',
    title: '장 보기',
    note: '',
    dueDate: null,
    remindAt: null,
    important: false,
    myDayOn: null,
    completedAt: null,
    createdAt: '2026-08-31T00:00:00Z',
    ...over,
  } as Task;
}

/** 부른 자리를 적어 두는 가짜 fetch. */
function spy(responses: Array<{ status?: number; body?: unknown; location?: string }>) {
  const calls: Array<{ method: string; url: string; body: unknown; auth: string | null }> = [];
  let i = 0;
  const fetchFn = (async (url: string | URL, init?: RequestInit) => {
    const spec = responses[Math.min(i++, responses.length - 1)] ?? {};
    calls.push({
      method: init?.method ?? 'GET',
      url: String(url),
      body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
      auth: new Headers(init?.headers).get('authorization'),
    });
    return new Response(spec.body === undefined ? null : JSON.stringify(spec.body), {
      status: spec.status ?? 200,
      headers: spec.location ? { location: spec.location } : {},
    });
  }) as unknown as typeof fetch;
  return { calls, fetchFn };
}

function client(fetchFn: typeof fetch): GentaskClient {
  return new GentaskClient({ baseUrl: 'https://api.example', token: 'T' }, fetchFn);
}

describe('CLI 작업 관리 명령', () => {
  it('저장된 토큰을 사용하여 대상 계정에 작업을 생성한다', async () => {
    const { calls, fetchFn } = spy([{ status: 201, location: '/api/v1/tasks/new-id' }]);

    const outcome = await run(['add', '장', '보기', '--due', '2026-09-01'], () => client(fetchFn));

    expect(outcome.code).toBe(0);
    expect(outcome.out).toBe('new-id');
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.auth).toBe('Bearer T');
    expect(calls[0]?.body).toEqual({ title: '장 보기', dueDate: '2026-09-01' });
  });

  it('작업 목록 요청 시 해당 계정의 작업만 반환한다', async () => {
    const { calls, fetchFn } = spy([{ body: [task(), task({ id: 'x', completedAt: '2026-08-30T00:00:00Z' })] }]);

    const outcome = await run(['list', '--json'], () => client(fetchFn));

    expect(calls[0]?.url).toBe('https://api.example/api/v1/tasks');
    expect(calls[0]?.auth).toBe('Bearer T');
    // 기본은 미완료만이다. 완료한 것은 --all 이 부른다.
    expect(JSON.parse(outcome.out)).toHaveLength(1);
  });

  it('작업 속성 수정 시 변경 사항을 반영한다', async () => {
    const { calls, fetchFn } = spy([{ body: task({ note: '남긴 메모' }) }, {}]);

    await run(['edit', '11111111-2222-3333-4444-555555555555', '--title', '새 제목'], () =>
      client(fetchFn),
    );

    // 서버의 편집은 넷을 그대로 받는다. 넘기지 않은 메모가 지워지면 안 된다.
    expect(calls[1]?.method).toBe('PATCH');
    expect(calls[1]?.body).toEqual({
      title: '새 제목',
      note: '남긴 메모',
      dueDate: null,
      remindAt: null,
    });
  });

  it('작업 삭제 시 대상 작업을 삭제한다', async () => {
    const { calls, fetchFn } = spy([{ body: [task()] }, {}]);

    await run(['rm', '11111111'], () => client(fetchFn));

    expect(calls[1]?.method).toBe('DELETE');
    expect(calls[1]?.url).toContain('/api/v1/tasks/11111111-2222-3333-4444-555555555555');
  });

  it('토큰이 유효하지 않으면 재발급 안내 메시지를 출력한다', async () => {
    const { fetchFn } = spy([{ status: 401 }]);

    await expect(run(['list'], () => client(fetchFn))).rejects.toThrow(/다시 발급/);
  });

  it('타 계정의 작업 접근 시 404 오류를 반환한다', async () => {
    const { fetchFn } = spy([{ status: 404, body: { code: 'NOT_FOUND', detail: '작업을 찾을 수 없습니다' } }]);

    await expect(
      run(['show', '11111111-2222-3333-4444-555555555555'], () => client(fetchFn)),
    ).rejects.toThrow(/찾을 수 없습니다/);
  });

  it.each([
    [['done', '11111111'], '/completion', { completed: true }],
    [['done', '11111111', '--undo'], '/completion', { completed: false }],
    [['star', '11111111', '--off'], '/importance', { important: false }],
    [['today', '11111111'], '/my-day', { inMyDay: true }],
  ])('완료와 중요와 나의 하루를 켜고 끈다: %s', async (argv, path, body) => {
    const { calls, fetchFn } = spy([{ body: [task()] }, { status: 204 }]);

    await run(argv as string[], () => client(fetchFn));

    expect(calls[1]?.method).toBe('PATCH');
    expect(calls[1]?.url).toContain(path as string);
    expect(calls[1]?.body).toEqual(body);
  });

  it('단축 식별자가 여러 작업과 일치하면 모호성 오류를 안내한다', async () => {
    const { fetchFn } = spy([{ body: [task({ id: 'abc11111-0000-0000-0000-000000000000' }), task({ id: 'abc22222-0000-0000-0000-000000000000' })] }]);

    await expect(run(['rm', 'abc'], () => client(fetchFn))).rejects.toThrow(/2 개입니다/);
  });

  it('알 수 없는 명령 입력 시 도움말 안내 메시지를 출력한다', async () => {
    await expect(run(['없는명령'], () => client(spy([]).fetchFn))).rejects.toThrow(/--help/);
  });
});

describe('인증 토큰 저장소', () => {
  let home: string;
  let env: NodeJS.ProcessEnv;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'gentask-'));
    env = { XDG_CONFIG_HOME: home };
  });

  afterEach(() => {
    rmSync(home, { recursive: true, force: true });
  });

  it('토큰이 설정되지 않은 경우 토큰 등록 안내를 출력한다', () => {
    expect(() => readConfig(env)).toThrow(MISSING_TOKEN);
    expect(MISSING_TOKEN).toContain('gentask auth login');
  });

  it('토큰을 저장하면 소유자만 읽을 수 있는 파일에 둔다', async () => {
    const outcome = await run(['auth', 'login'], undefined, env, async () => '  T-1  \n');

    expect(outcome.code).toBe(0);
    const path = configPath(env);
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({
      token: 'T-1',
      baseUrl: 'https://api.gentask.xyz',
    });
    // Windows 환경은 POSIX 파일 권한을 지원하지 않으므로 검증에서 제외한다.
    if (process.platform !== 'win32') {
      expect(statSync(path).mode & 0o777).toBe(0o600);
    }
  });

  it('환경 변수와 파일에 토큰이 모두 존재하면 환경 변수 값을 우선 적용한다', () => {
    storeToken('저장된것', 'https://api.example', env);

    expect(readConfig({ ...env, GENTASK_TOKEN: '환경의것' }).token).toBe('환경의것');
    expect(readConfig(env).token).toBe('저장된것');
  });

  it('auth status 실행 시 토큰 출처(환경 변수 또는 설정 파일)를 표시한다', async () => {
    expect((await run(['auth', 'status'], undefined, env)).code).toBe(1);

    storeToken('T', 'https://api.example', env);
    expect((await run(['auth', 'status'], undefined, env)).out).toContain(configPath(env));

    const withEnv = await run(['auth', 'status'], undefined, { ...env, GENTASK_TOKEN: 'T' });
    expect(withEnv.out).toContain('GENTASK_TOKEN');
  });

  it('auth logout 실행 시 저장된 토큰 파일을 삭제한다', async () => {
    storeToken('T', 'https://api.example', env);

    expect((await run(['auth', 'logout'], undefined, env)).out).toContain('지웠습니다');
    expect((await run(['auth', 'logout'], undefined, env)).out).toContain('지울 토큰이 없습니다');
  });
});

describe('CLI 출력 서식', () => {
  it('한글 등 전각 문자가 포함되어도 표의 열 정렬을 유지한다', () => {
    // padEnd 는 글자 수로 세므로 한글이 섞이면 표가 어긋난다.
    expect(displayWidth('장 보기')).toBe(7);
    expect(displayWidth('abc')).toBe(3);

    const drawn = formatList([
      task({ id: 'aaaaaaaa-0000-0000-0000-000000000000', title: '장 보기' }),
      task({ id: 'bbbbbbbb-0000-0000-0000-000000000000', title: 'buy milk', dueDate: '2026-09-01' }),
    ]).split('\n');

    const columns = drawn.map((line) => line.indexOf('2026-09-01'));
    expect(displayWidth(drawn[0] ?? '')).toBeLessThanOrEqual(displayWidth(drawn[1] ?? ''));
    expect(columns[1]).toBeGreaterThan(0);
  });
});
