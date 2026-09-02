import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { run } from './cli.js';
import {
  GentaskClient,
  type Doc,
  type DocRevision,
  type DocRevisionPage,
  type DocRevisionSummary,
  type DocSummary,
} from './gentask-client.js';

/**
 * 문서를 명령줄에서 다루는 자리를 본다.
 *
 * <p>화면이 본문을 글자로만 그리는 것과 달리 이쪽은 마크다운 원문을 낸다(DOC-002 A5). 그것이
 * 이 명령이 서 있는 이유이므로 원문이 그대로 나오는지를 여기서 본다.
 */

const ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function summary(over: Partial<DocSummary> = {}): DocSummary {
  return {
    id: ID,
    title: '아키텍처 개요',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-03T10:30:00Z',
    ...over,
  } as DocSummary;
}

function doc(over: Partial<Doc> = {}, summaryOver: Partial<DocSummary> = {}): Doc {
  return {
    summary: summary(summaryOver),
    body: '본문',
    revisionNo: 1,
    authorName: '고래밥',
    ...over,
  } as Doc;
}

function revisionSummary(over: Partial<DocRevisionSummary> = {}): DocRevisionSummary {
  return {
    revisionNo: 3,
    createdAt: '2026-09-03T10:30:00Z',
    authorName: '고래밥',
    comment: '빠진 절을 채운다',
    ...over,
  } as DocRevisionSummary;
}

function revision(over: Partial<DocRevision> = {}, summaryOver: Partial<DocRevisionSummary> = {}) {
  return {
    summary: revisionSummary(summaryOver),
    title: '아키텍처 개요',
    body: '그때의 본문',
    ...over,
  } as DocRevision;
}

function revisionPage(over: Partial<DocRevisionPage> = {}): DocRevisionPage {
  return {
    items: [revisionSummary(), revisionSummary({ revisionNo: 2, comment: null })],
    total: 2,
    page: 0,
    size: 20,
    ...over,
  } as DocRevisionPage;
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

/* 설정 자리를 임시로 돌려 둔다. 돌리지 않으면 검사가 이 기계를 쓰는 사람의 진짜 설정을 읽는다. */
const ENV = {
  GENTASK_TOKEN: 'T',
  GENTASK_PROJECT: 'TG',
  XDG_CONFIG_HOME: mkdtempSync(join(tmpdir(), 'gentask-cfg-')),
} as NodeJS.ProcessEnv;

describe('gentask doc', () => {
  it('목록은 지금 프로젝트 아래를 부른다', async () => {
    const { calls, fetchFn } = spy([{ body: [summary()] }]);

    const outcome = await run(['doc', 'list'], () => client(fetchFn), ENV);

    expect(calls[0]?.url).toBe('https://api.example/api/v1/projects/TG/documents');
    expect(outcome.out).toContain('아키텍처 개요');
    expect(outcome.out).toContain('2026-09-03 10:30');
  });

  it('문서가 없으면 그 사실을 말한다', async () => {
    const { fetchFn } = spy([{ body: [] }]);

    const outcome = await run(['doc', 'list'], () => client(fetchFn), ENV);

    expect(outcome.out).toBe('문서가 없습니다.');
  });

  /*
   * 에이전트가 받는 것은 그린 결과가 아니라 원문이다(DOC-002 A5). 표제와 표와 코드 담이 적힌 그대로
   * 나와야 하며, 감싸거나 들여쓰면 받는 쪽이 다시 원문을 만들어야 한다.
   */
  it('본문을 마크다운 원문 그대로 낸다', async () => {
    const 원문 = '# 제목\n\n- 하나\n- 둘\n\n```ts\nconst a = 1;\n```';
    const { calls, fetchFn } = spy([{ body: doc({ body: 원문 }) }]);

    const outcome = await run(['doc', 'show', ID], () => client(fetchFn), ENV);

    expect(calls[0]?.url).toBe(`https://api.example/api/v1/projects/TG/documents/${ID}`);
    expect(outcome.out).toContain(원문);
  });

  it('식별자는 앞 몇 자만 적어도 된다', async () => {
    const { calls, fetchFn } = spy([{ body: [summary()] }, { body: doc() }]);

    await run(['doc', 'show', 'aaaaaaaa'], () => client(fetchFn), ENV);

    expect(calls[0]?.url).toBe('https://api.example/api/v1/projects/TG/documents');
    expect(calls[1]?.url).toBe(`https://api.example/api/v1/projects/TG/documents/${ID}`);
  });

  it('앞이 맞는 것이 둘 이상이면 고르지 않고 후보를 보인다', async () => {
    const { calls, fetchFn } = spy([
      {
        body: [
          summary({ id: 'aaaaaaaa-1111-cccc-dddd-eeeeeeeeeeee' }),
          summary({ id: 'aaaaaaaa-2222-cccc-dddd-eeeeeeeeeeee', title: '다른 것' }),
        ],
      },
    ]);

    await expect(run(['doc', 'show', 'aaaa'], () => client(fetchFn), ENV)).rejects.toThrow(
      /2 개입니다/,
    );
    expect(calls).toHaveLength(1);
  });

  it('세우면 제목과 본문을 보내고 식별자를 낸다', async () => {
    const { calls, fetchFn } = spy([
      { status: 201, location: `/api/v1/projects/TG/documents/${ID}` },
    ]);

    const outcome = await run(
      ['doc', 'add', '아키텍처', '개요', '--body', '# 제목'],
      () => client(fetchFn),
      ENV,
    );

    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.body).toEqual({ title: '아키텍처 개요', body: '# 제목' });
    expect(outcome.out).toBe(`세웠습니다: ${ID}`);
  });

  /*
   * 서버의 편집은 부분 갱신이 아니라 제목과 본문을 그대로 받는다. 넘기지 않은 것을 되돌려 주지
   * 않으면 제목만 고쳐도 본문이 통째로 지워진 개정이 쌓인다.
   */
  it('제목만 고쳐도 본문은 그대로 간다', async () => {
    const { calls, fetchFn } = spy([{ body: doc({ body: '지켜야 할 본문' }) }, { status: 204 }]);

    const outcome = await run(
      ['doc', 'edit', ID, '--title', '새 제목'],
      () => client(fetchFn),
      ENV,
    );

    expect(calls[1]?.method).toBe('PATCH');
    expect(calls[1]?.body).toEqual({ title: '새 제목', body: '지켜야 할 본문' });
    expect(outcome.out).toBe(`고쳤습니다: ${ID}`);
  });

  it('왜 고쳤는지를 함께 보낸다', async () => {
    const { calls, fetchFn } = spy([{ body: doc() }, { status: 204 }]);

    await run(
      ['doc', 'edit', ID, '--body', '고친 본문', '--comment', '오타를 고친다'],
      () => client(fetchFn),
      ENV,
    );

    expect(calls[1]?.body).toEqual({
      title: '아키텍처 개요',
      body: '고친 본문',
      comment: '오타를 고친다',
    });
  });

  /* 사유만 넘기면 서버가 같은 것으로 보고 아무것도 담지 않는다(DOC-003 A2). 그 전에 멈춘다. */
  it('사유만 넘기면 바꿀 것이 없음을 알리고 부르지 않는다', async () => {
    const { calls, fetchFn } = spy([{ body: doc() }]);

    await expect(
      run(['doc', 'edit', ID, '--comment', '왜'], () => client(fetchFn), ENV),
    ).rejects.toThrow(/바꿀 것이 없습니다/);
    expect(calls).toHaveLength(0);
  });

  it('프로젝트를 정하지 않으면 스스로 실행할 명령을 알린다', async () => {
    const { fetchFn } = spy([{ body: [] }]);

    await expect(
      run(['doc', 'list'], () => client(fetchFn), {
        GENTASK_TOKEN: 'T',
        XDG_CONFIG_HOME: mkdtempSync(join(tmpdir(), 'gentask-cfg-')),
      } as NodeJS.ProcessEnv),
    ).rejects.toThrow(/gentask project use/);
  });

  it('하위 명령이 아니면 그 사실을 알린다', async () => {
    const { fetchFn } = spy([{ body: [] }]);

    await expect(run(['doc', 'rm', ID], () => client(fetchFn), ENV)).rejects.toThrow(
      /doc 의 하위 명령이 아닙니다/,
    );
  });
});

describe('gentask doc history', () => {
  it('개정을 최근 것부터 한 줄씩 낸다', async () => {
    const { calls, fetchFn } = spy([{ body: revisionPage() }]);

    const outcome = await run(['doc', 'history', ID], () => client(fetchFn), ENV);

    expect(calls[0]?.url).toBe(
      `https://api.example/api/v1/projects/TG/documents/${ID}/revisions`,
    );
    expect(outcome.out.split('\n')[0]).toContain('3');
    expect(outcome.out).toContain('빠진 절을 채운다');
    expect(outcome.out).toContain('2026-09-03 10:30');
  });

  /* 쪽을 감추지 않는다. 남은 것이 있으면 다음을 어떻게 부르는지가 함께 나온다(DOC-004 A3). */
  it('한 쪽에 담기지 않으면 다음 쪽을 부르는 법을 알린다', async () => {
    const { fetchFn } = spy([{ body: revisionPage({ total: 30, page: 0, size: 2 }) }]);

    const outcome = await run(['doc', 'history', ID], () => client(fetchFn), ENV);

    expect(outcome.out).toContain('전체 30 건 중 1–2 째입니다');
    expect(outcome.out).toContain('--page 1');
  });

  it('다 보이면 남은 쪽을 말하지 않는다', async () => {
    const { fetchFn } = spy([{ body: revisionPage() }]);

    const outcome = await run(['doc', 'history', ID], () => client(fetchFn), ENV);

    expect(outcome.out).not.toContain('--page');
  });

  it('쪽과 개수를 그대로 실어 보낸다', async () => {
    const { calls, fetchFn } = spy([{ body: revisionPage({ page: 2, size: 5, total: 30 }) }]);

    await run(['doc', 'history', ID, '--page', '2', '--size', '5'], () => client(fetchFn), ENV);

    expect(calls[0]?.url).toBe(
      `https://api.example/api/v1/projects/TG/documents/${ID}/revisions?page=2&size=5`,
    );
  });

  it('쪽이 정수가 아니면 부르지 않는다', async () => {
    const { calls, fetchFn } = spy([{ body: revisionPage() }]);

    await expect(
      run(['doc', 'history', ID, '--page', '뒤'], () => client(fetchFn), ENV),
    ).rejects.toThrow(/쪽 가 아닙니다/);
    expect(calls).toHaveLength(0);
  });

  it('--json 은 서버가 준 쪽 정보를 그대로 낸다', async () => {
    const { fetchFn } = spy([{ body: revisionPage({ total: 30, page: 1, size: 2 }) }]);

    const outcome = await run(['doc', 'history', ID, '--json'], () => client(fetchFn), ENV);

    expect(JSON.parse(outcome.out)).toMatchObject({ total: 30, page: 1, size: 2 });
  });

  it('식별자는 여기서도 앞 몇 자만 적어도 된다', async () => {
    const { calls, fetchFn } = spy([{ body: [summary()] }, { body: revisionPage() }]);

    await run(['doc', 'history', 'aaaaaaaa'], () => client(fetchFn), ENV);

    expect(calls[1]?.url).toBe(
      `https://api.example/api/v1/projects/TG/documents/${ID}/revisions`,
    );
  });
});

describe('gentask doc show --rev', () => {
  /* 지금 참인 본문과 마찬가지로 그때의 본문도 원문 그대로다(DOC-002 A5). */
  it('그때의 본문을 마크다운 원문 그대로 낸다', async () => {
    const 원문 = '# 제목\n\n- 하나\n\n```ts\nconst a = 1;\n```';
    const { calls, fetchFn } = spy([{ body: revision({ body: 원문 }) }]);

    const outcome = await run(['doc', 'show', ID, '--rev', '3'], () => client(fetchFn), ENV);

    expect(calls[0]?.url).toBe(
      `https://api.example/api/v1/projects/TG/documents/${ID}/revisions/3`,
    );
    expect(outcome.out).toContain(원문);
    expect(outcome.out).toContain('개정     3');
  });

  it('--rev 가 없으면 지금 참인 개정을 부른다', async () => {
    const { calls, fetchFn } = spy([{ body: doc() }]);

    await run(['doc', 'show', ID], () => client(fetchFn), ENV);

    expect(calls[0]?.url).toBe(`https://api.example/api/v1/projects/TG/documents/${ID}`);
  });

  it('개정 번호가 정수가 아니면 부르지 않는다', async () => {
    const { calls, fetchFn } = spy([{ body: revision() }]);

    await expect(
      run(['doc', 'show', ID, '--rev', '0'], () => client(fetchFn), ENV),
    ).rejects.toThrow(/개정 번호가 아닙니다/);
    expect(calls).toHaveLength(0);
  });
});

describe('gentask doc revert', () => {
  /*
   * 되묻는 자리를 지운 것과 같은 모양으로 지난다(DOC-005 A6). 보이는 것은 되돌릴 수 없다는 경고가
   * 아니라 어느 시점으로 가는지다 — 사이의 개정이 남으므로 잃는 것이 없다.
   */
  it('--yes 없이는 어느 시점으로 가는지만 보이고 담지 않는다', async () => {
    const { calls, fetchFn } = spy([{ body: revision() }]);

    const outcome = await run(['doc', 'revert', ID, '3'], () => client(fetchFn), ENV);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe('GET');
    expect(outcome.code).toBe(1);
    expect(outcome.out).toContain('개정 3  2026-09-03 10:30  고래밥');
    expect(outcome.out).toContain('--yes');
  });

  it('--yes 를 넘기면 담고 지금 개정이 몇 번인지 말한다', async () => {
    const { calls, fetchFn } = spy([{ status: 204 }, { body: doc({ revisionNo: 4 }) }]);

    const outcome = await run(['doc', 'revert', ID, '2', '--yes'], () => client(fetchFn), ENV);

    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.url).toBe(
      `https://api.example/api/v1/projects/TG/documents/${ID}/revisions/2/revert`,
    );
    expect(outcome.out).toContain('개정 2 로 되돌렸습니다');
    expect(outcome.out).toContain('지금은 개정 4');
    expect(outcome.code).toBe(0);
  });

  /* 서버가 사유를 스스로 적는다(DOC-005 A3). 명령줄이 그 문구를 흉내 내 보내지 않는다. */
  it('사유를 적지 않으면 아무 문구도 보내지 않는다', async () => {
    const { calls, fetchFn } = spy([{ status: 204 }, { body: doc({ revisionNo: 4 }) }]);

    await run(['doc', 'revert', ID, '2', '--yes'], () => client(fetchFn), ENV);

    expect(calls[0]?.body).toEqual({});
  });

  it('사유를 적으면 그대로 보낸다', async () => {
    const { calls, fetchFn } = spy([{ status: 204 }, { body: doc({ revisionNo: 4 }) }]);

    await run(
      ['doc', 'revert', ID, '2', '--yes', '--comment', '고친 결과가 더 나쁘다'],
      () => client(fetchFn),
      ENV,
    );

    expect(calls[0]?.body).toEqual({ comment: '고친 결과가 더 나쁘다' });
  });

  /* 서버는 아무것도 담지 않고 성공으로 답한다(DOC-005 A2). 실패로 알리지 않는다. */
  it('지금 참인 개정으로 되돌리면 담지 않았음을 말하되 성공이다', async () => {
    const { fetchFn } = spy([{ status: 204 }, { body: doc({ revisionNo: 3 }) }]);

    const outcome = await run(['doc', 'revert', ID, '3', '--yes'], () => client(fetchFn), ENV);

    expect(outcome.code).toBe(0);
    expect(outcome.out).toContain('새로 담지 않았습니다');
  });

  it('개정 번호를 적지 않으면 그 사실을 알리고 부르지 않는다', async () => {
    const { calls, fetchFn } = spy([{ body: revision() }]);

    await expect(run(['doc', 'revert', ID], () => client(fetchFn), ENV)).rejects.toThrow(
      /개정 번호가 필요합니다/,
    );
    expect(calls).toHaveLength(0);
  });

  /* 없는 개정은 서버가 가린다. 명령줄이 미리 세어 두지 않는다. */
  it('없는 개정이면 서버가 낸 사유를 그대로 옮긴다', async () => {
    const { fetchFn } = spy([
      { status: 404, body: { code: 'REVISION_NOT_FOUND', detail: '그 개정이 없습니다.' } },
    ]);

    await expect(run(['doc', 'revert', ID, '99'], () => client(fetchFn), ENV)).rejects.toThrow(
      /그 개정이 없습니다/,
    );
  });
});
