import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { run } from './cli.js';
import { GentaskClient, type Issue, type IssueSummary } from './gentask-client.js';

/**
 * 백로그를 명령줄에서 다루는 자리를 본다.
 *
 * <p>저장소의 `backlog/` 를 걷고 트래커를 원본으로 삼은 뒤로, 이 명령들이 유일한 글자 통로다.
 */

function summary(over: Partial<IssueSummary> = {}): IssueSummary {
  return {
    id: '11111111-2222-3333-4444-555555555555',
    key: 'TG-001',
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
  return new GentaskClient({ baseUrl: 'https://api.example', token: 'T', projectKey: 'TG' }, fetchFn);
}

/*
 * 자격과 프로젝트를 환경으로 준다. 설정 자리도 임시로 돌려 둔다 — 돌리지 않으면 검사가 이 기계를
 * 쓰는 사람의 진짜 설정을 읽고, 쓰는 자리를 지나면 그것을 덮는다.
 */
const ENV = {
  GENTASK_TOKEN: 'T',
  GENTASK_PROJECT: 'TG',
  XDG_CONFIG_HOME: mkdtempSync(join(tmpdir(), 'gentask-cfg-')),
} as NodeJS.ProcessEnv;

describe('gentask issue', () => {
  it('목록은 지금 프로젝트 아래를 부르고 닫힌 것을 감춘다', async () => {
    const { calls, fetchFn } = spy([
      { body: [summary(), summary({ key: 'TG-002', number: 2, state: 'COMPLETED' })] },
    ]);

    const outcome = await run(['issue', 'list'], () => client(fetchFn), ENV);

    expect(calls[0]?.url).toBe('https://api.example/api/v1/projects/TG/issues');
    expect(outcome.out).toContain('TG-001');
    expect(outcome.out).not.toContain('TG-002');
  });

  it('--all 을 주면 닫힌 것까지 낸다', async () => {
    const { fetchFn } = spy([
      { body: [summary(), summary({ key: 'TG-002', number: 2, state: 'COMPLETED' })] },
    ]);

    const outcome = await run(['issue', 'list', '--all'], () => client(fetchFn), ENV);

    expect(outcome.out).toContain('TG-002');
  });

  it('세울 때 부모를 이을 수 있다', async () => {
    const { calls, fetchFn } = spy([
      { status: 201, location: '/api/v1/projects/TG/issues/7' },
      { body: issue({}, { key: 'TG-007', number: 7 }) },
    ]);

    const outcome = await run(
      ['issue', 'add', '아래', '것', '--kind', 'story', '--parent', 'TG-001'],
      () => client(fetchFn),
      ENV,
    );

    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.body).toEqual({ title: '아래 것', kind: 'STORY', parentKey: 'TG-001' });
    expect(outcome.out).toBe('세웠습니다: TG-007');
  });

  /*
   * 서버의 편집은 부분 갱신이 아니라 넷을 그대로 받는다. 넘기지 않은 것을 되돌려 주지 않으면
   * 제목만 고쳐도 본문과 계층이 지워진다.
   */
  it('제목만 고쳐도 본문과 부모는 그대로 간다', async () => {
    const { calls, fetchFn } = spy([
      { body: issue({ body: '지켜야 할 본문' }, { parentKey: 'TG-041' }) },
      { status: 204 },
    ]);

    await run(['issue', 'edit', 'TG-001', '--title', '새 제목'], () => client(fetchFn), ENV);

    expect(calls[1]?.method).toBe('PATCH');
    expect(calls[1]?.body).toEqual({
      title: '새 제목',
      kind: 'STORY',
      body: '지켜야 할 본문',
      parentKey: 'TG-041',
    });
  });

  it('--parent 를 비우면 최상위로 올린다', async () => {
    const { calls, fetchFn } = spy([{ body: issue({}, { parentKey: 'TG-041' }) }, { status: 204 }]);

    await run(['issue', 'edit', 'TG-001', '--parent', ''], () => client(fetchFn), ENV);

    expect((calls[1]?.body as { parentKey: unknown }).parentKey).toBeNull();
  });

  it('상태는 그대로 옮긴다', async () => {
    const { calls, fetchFn } = spy([{ status: 204 }]);

    await run(['issue', 'state', 'TG-001', 'started'], () => client(fetchFn), ENV);

    expect(calls[0]?.url).toBe('https://api.example/api/v1/projects/TG/issues/1/state');
    expect(calls[0]?.body).toEqual({ state: 'STARTED' });
  });

  it('상태가 아닌 것은 무엇이 되는지 알린다', async () => {
    const { fetchFn } = spy([{ status: 204 }]);

    await expect(run(['issue', 'state', 'TG-001', '진행'], () => client(fetchFn), ENV)).rejects.toThrow(
      /상태가 아닙니다/,
    );
  });

  it('프로젝트를 정하지 않으면 무엇을 해야 하는지 알린다', async () => {
    const { fetchFn } = spy([{ body: [] }]);

    await expect(
      run(['issue', 'list'], () => client(fetchFn), {
        GENTASK_TOKEN: 'T',
        XDG_CONFIG_HOME: mkdtempSync(join(tmpdir(), 'gentask-cfg-')),
      } as NodeJS.ProcessEnv),
    ).rejects.toThrow(/project use/);
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
   * 추적 검사가 이것을 읽는다. 본문과 인수 조건이 함께 담기지 않으면 그 검사가 아무것도 세지 못한다.
   */
  it('본문과 인수 조건을 함께 담아 내린다', async () => {
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
