import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { run } from './cli.js';
import { readStoredProject, storeProject } from './config.js';
import { GentaskClient, type Issue, type IssueSummary } from './gentask-client.js';

/**
 * CLI 백로그 작업 항목 관리 명령어 단위 테스트다.
 */

function summary(over: Partial<IssueSummary> = {}): IssueSummary {
  return {
    id: '11111111-2222-3333-4444-555555555555',
    key: 'GT-1',
    number: 1,
    kind: 'STORY',
    state: 'UNSTARTED',
    title: '무엇을 한다',
    parentKey: null,
    dueDate: null,
    closedAt: null,
    childCount: 0,
    closedChildCount: 0,
    criteriaCount: 0,
    unverifiedCount: 0,
    ...over,
  } as IssueSummary;
}

function issue(over: Partial<Issue> = {}, summaryOver: Partial<IssueSummary> = {}): Issue {
  return {
    summary: summary(summaryOver),
    body: '본문',
    criteria: [],
    authorName: '고래밥',
    createdAt: '2026-09-02T00:00:00Z',
    ...over,
  } as Issue;
}

function spy(responses: Array<{ status?: number; body?: unknown; location?: string }>) {
  const calls: Array<{ method: string; url: string; body: unknown }> = [];
  let i = 0;
  const fetchFn = (async (url: string | URL, init?: RequestInit) => {
    const spec = responses[Math.min(i++, responses.length - 1)] ?? {};
    calls.push({
      method: init?.method ?? 'GET',
      url: String(url),
      body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
    });
    return new Response(spec.body === undefined ? null : JSON.stringify(spec.body), {
      status: spec.status ?? 200,
      headers: spec.location ? { location: spec.location } : {},
    });
  }) as unknown as typeof fetch;
  return { calls, fetchFn };
}

function client(fetchFn: typeof fetch): GentaskClient {
  return new GentaskClient({ baseUrl: 'https://api.example', token: 'T', projectId: 'TG' }, fetchFn);
}

/*
 * 테스트 실행 시 실제 환경의 설정 파일이 오염되지 않도록 임시 디렉터리로 격리한다.
 */
const ENV = {
  GENTASK_TOKEN: 'T',
  GENTASK_PROJECT: 'TG',
  XDG_CONFIG_HOME: mkdtempSync(join(tmpdir(), 'gentask-cfg-')),
} as NodeJS.ProcessEnv;

describe('gentask issue', () => {
  it('현재 프로젝트의 미종료 작업 목록을 조회한다', async () => {
    const { calls, fetchFn } = spy([
      { body: [summary(), summary({ key: 'GT-2', number: 2, state: 'COMPLETED' })] },
    ]);

    const outcome = await run(['issue', 'list'], () => client(fetchFn), ENV);

    expect(calls[0]?.url).toBe('https://api.example/api/v1/projects/TG/issues');
    expect(outcome.out).toContain('GT-1');
    expect(outcome.out).not.toContain('GT-2');
  });

  it('--all 옵션 지정 시 종료된 작업을 포함하여 조회한다', async () => {
    const { fetchFn } = spy([
      { body: [summary(), summary({ key: 'GT-2', number: 2, state: 'COMPLETED' })] },
    ]);

    const outcome = await run(['issue', 'list', '--all'], () => client(fetchFn), ENV);

    expect(outcome.out).toContain('GT-2');
  });

  it('작업 생성 시 상위 작업을 연결할 수 있다', async () => {
    const { calls, fetchFn } = spy([
      { status: 201, location: '/api/v1/projects/TG/issues/7' },
      { body: issue({}, { key: 'GT-7', number: 7 }) },
    ]);

    const outcome = await run(
      ['issue', 'add', '아래', '것', '--kind', 'story', '--parent', 'GT-1'],
      () => client(fetchFn),
      ENV,
    );

    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.body).toEqual({ title: '아래 것', kind: 'STORY', parentKey: 'GT-1' });
    expect(outcome.out).toBe('세웠습니다: GT-7');
  });

  /*
   * 전체 필드 갱신 규약에 따라 미수정 필드는 기존 값을 보존하여 전송해야 한다.
   */
  it('제목만 수정할 경우 기존 본문과 상위 작업 연결을 유지하여 전송한다', async () => {
    const { calls, fetchFn } = spy([
      { body: issue({ body: '지켜야 할 본문' }, { parentKey: 'GT-41' }) },
      { status: 204 },
    ]);

    await run(['issue', 'edit', 'GT-1', '--title', '새 제목'], () => client(fetchFn), ENV);

    expect(calls[1]?.method).toBe('PATCH');
    expect(calls[1]?.body).toEqual({
      title: '새 제목',
      kind: 'STORY',
      body: '지켜야 할 본문',
      parentKey: 'GT-41',
    });
  });

  it('--parent 값을 비우면 최상위 작업으로 전환한다', async () => {
    const { calls, fetchFn } = spy([{ body: issue({}, { parentKey: 'GT-41' }) }, { status: 204 }]);

    await run(['issue', 'edit', 'GT-1', '--parent', ''], () => client(fetchFn), ENV);

    expect((calls[1]?.body as { parentKey: unknown }).parentKey).toBeNull();
  });

  it('지정한 상태값으로 작업 상태를 변경한다', async () => {
    const { calls, fetchFn } = spy([{ status: 204 }]);

    await run(['issue', 'state', 'GT-1', 'started'], () => client(fetchFn), ENV);

    expect(calls[0]?.url).toBe('https://api.example/api/v1/projects/TG/issues/1/state');
    expect(calls[0]?.body).toEqual({ state: 'STARTED' });
  });

  it('유효하지 않은 상태값 입력 시 지원 가능한 상태 목록을 안내한다', async () => {
    const { fetchFn } = spy([{ status: 204 }]);

    await expect(run(['issue', 'state', 'GT-1', '진행'], () => client(fetchFn), ENV)).rejects.toThrow(
      /상태가 아닙니다/,
    );
  });

  it('프로젝트 미지정 시 프로젝트 설정 방법을 안내한다', async () => {
    const { fetchFn } = spy([{ body: [] }]);

    await expect(
      run(['issue', 'list'], () => client(fetchFn), {
        GENTASK_TOKEN: 'T',
        XDG_CONFIG_HOME: mkdtempSync(join(tmpdir(), 'gentask-cfg-')),
      } as NodeJS.ProcessEnv),
    ).rejects.toThrow(/project use/);
  });
});

describe('디렉터리별 프로젝트 컨텍스트 격리', () => {
  let home: string;
  let env: NodeJS.ProcessEnv;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'gentask-scope-'));
    env = { GENTASK_TOKEN: 'T', XDG_CONFIG_HOME: home } as NodeJS.ProcessEnv;
  });

  afterEach(() => rmSync(home, { recursive: true, force: true }));

  /*
   * 작업 디렉터리별로 독립된 프로젝트 컨텍스트를 저장하여 프로젝트 간 간섭을 차단한다.
   */
  it('디렉터리 경로별로 대상 프로젝트 설정을 독립 저장한다', () => {
    storeProject('AAAAAAAAAAAA', env, '/work/one');
    storeProject('BBBBBBBBBBBB', env, '/work/two');

    expect(readStoredProject(env, '/work/one')).toBe('AAAAAAAAAAAA');
    expect(readStoredProject(env, '/work/two')).toBe('BBBBBBBBBBBB');
    expect(readStoredProject(env, '/work/three')).toBeNull();
  });

  /** 하위 디렉터리에서도 상위 디렉터리의 프로젝트 설정을 상속 참조한다. */
  it('하위 디렉터리에서 실행 시 가장 가까운 상위 디렉터리의 설정을 상속한다', () => {
    storeProject('AAAAAAAAAAAA', env, '/work/one');
    storeProject('CCCCCCCCCCCC', env, '/work/one/clients');

    expect(readStoredProject(env, '/work/one/server/src')).toBe('AAAAAAAAAAAA');
    expect(readStoredProject(env, '/work/one/clients/apps/web')).toBe('CCCCCCCCCCCC');
  });

  /** 윈도우 환경의 경로 대소문자 및 구분자를 정규화하여 처리한다. */
  it('경로 표기 방식이 달라도 정규화하여 동일 디렉터리로 인식한다', () => {
    storeProject('AAAAAAAAAAAA', env, String.raw`C:\Work\One`);

    expect(readStoredProject(env, 'c:/work/one/server')).toBe('AAAAAAAAAAAA');
  });

  it('프로젝트가 미설정된 경우 프로젝트 지정 명령어를 안내한다', async () => {
    const { fetchFn } = spy([{ body: [] }]);

    await expect(run(['issue', 'list'], () => client(fetchFn), env)).rejects.toThrow(
      /gentask project use/,
    );
  });
});

describe('gentask issue rm', () => {
  /*
   * 비대화형 CLI 환경에서는 실수로 인한 삭제를 방지하기 위해 --yes 플래그 없이 실행 시 삭제 대상만 미리 표시한다.
   */
  it('--yes 옵션이 없으면 삭제 대상만 미리 표시하고 실제 삭제는 수행하지 않는다', async () => {
    const { calls, fetchFn } = spy([
      { body: issue({}, { key: 'GT-30', number: 30, title: '걷을 것' }) },
      { body: [] },
    ]);

    const outcome = await run(['issue', 'rm', 'GT-30'], () => client(fetchFn), ENV);

    expect(outcome.code).toBe(1);
    expect(outcome.out).toContain('걷을 것');
    expect(outcome.out).toContain('--yes');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
  });

  it('--yes 옵션 지정 시 작업을 삭제하고 하위 작업의 최상위 승격을 안내한다', async () => {
    const { calls, fetchFn } = spy([
      { body: issue({}, { key: 'GT-30', number: 30, title: '걷을 것' }) },
      { body: [summary({ key: 'GT-31', number: 31, parentKey: 'GT-30' })] },
      { status: 204 },
    ]);

    const outcome = await run(['issue', 'rm', 'GT-30', '--yes'], () => client(fetchFn), ENV);

    expect(outcome.code).toBe(0);
    expect(outcome.out).toContain('지웠습니다: GT-30');
    expect(outcome.out).toContain('최상위');
    expect(calls.at(-1)).toMatchObject({
      method: 'DELETE',
      url: 'https://api.example/api/v1/projects/TG/issues/30',
    });
  });
});

describe('gentask issue export', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'gentask-export-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  /*
   * 백로그 내보내기 시 인수 조건이 누락되지 않도록 상세 API를 호출하여 본문을 수집한다.
   */
  it('작업 본문과 인수 조건을 포함하여 JSON으로 내보낸다', async () => {
    const criteria = [{ number: 1, sentence: '무엇을 한다', verified: false, retired: false }];
    const { fetchFn } = spy([
      { body: [summary()] },
      { body: issue({ body: '본문\n- [ ] #1 무엇을 한다', criteria }) },
    ]);

    const out = join(dir, 'backlog.json');
    const outcome = await run(['issue', 'export', '--out', out], () => client(fetchFn), ENV);

    expect(outcome.code).toBe(0);
    const written = JSON.parse(readFileSync(out, 'utf8')) as {
      project: string;
      issues: Array<{ key: string; body: string; criteria: unknown[] }>;
    };
    expect(written.project).toBe('TG');
    expect(written.issues).toHaveLength(1);
    expect(written.issues[0]?.body).toContain('#1');
    expect(written.issues[0]?.criteria).toEqual(criteria);
  });
});
