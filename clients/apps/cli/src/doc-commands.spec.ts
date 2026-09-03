import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { run } from './cli.js';
import {
  GentaskClient,
  type Doc,
  type DocFolder,
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
const FOLDER = 'ffffffff-1111-2222-3333-444444444444';

function summary(over: Partial<DocSummary> = {}): DocSummary {
  return {
    id: ID,
    title: '아키텍처 개요',
    folderId: null,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-03T10:30:00Z',
    ...over,
  } as DocSummary;
}

function folder(over: Partial<DocFolder> = {}): DocFolder {
  return {
    id: FOLDER,
    name: '아키텍처',
    parentId: null,
    documentCount: 0,
    folderCount: 0,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-03T10:30:00Z',
    ...over,
  } as DocFolder;
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

describe('gentask doc folder', () => {
  /* 서버는 평평한 목록에 parentId 를 실어 준다. 계층을 세우는 것은 여기다(DOC-008). */
  it('목록을 계층이 보이게 낸다', async () => {
    const { calls, fetchFn } = spy([
      {
        body: [
          folder({ id: 'cccccccc-0000-0000-0000-000000000000', name: '아래', parentId: FOLDER }),
          folder({ documentCount: 3, folderCount: 1 }),
        ],
      },
    ]);

    const outcome = await run(['doc', 'folder', 'list'], () => client(fetchFn), ENV);

    expect(calls[0]?.url).toBe('https://api.example/api/v1/projects/TG/document-folders');
    const [첫줄, 둘째줄] = outcome.out.split('\n');
    expect(첫줄).toContain('아키텍처');
    expect(첫줄).toContain('문서 3 · 폴더 1');
    expect(둘째줄).toMatch(/^cccccccc {4}아래/);
  });

  it('폴더가 없으면 그 사실을 말한다', async () => {
    const { fetchFn } = spy([{ body: [] }]);

    const outcome = await run(['doc', 'folder', 'list'], () => client(fetchFn), ENV);

    expect(outcome.out).toBe('폴더가 없습니다.');
  });

  it('--json 은 서버가 준 평평한 목록을 그대로 낸다', async () => {
    const { fetchFn } = spy([{ body: [folder()] }]);

    const outcome = await run(['doc', 'folder', 'list', '--json'], () => client(fetchFn), ENV);

    expect(JSON.parse(outcome.out)[0]).toMatchObject({ id: FOLDER, parentId: null });
  });

  it('세우면 이름을 보내고 세운 것의 식별자를 낸다', async () => {
    const { calls, fetchFn } = spy([
      { status: 201, location: `/api/v1/projects/TG/document-folders/${FOLDER}` },
    ]);

    const outcome = await run(
      ['doc', 'folder', 'add', '아키텍처', '문서'],
      () => client(fetchFn),
      ENV,
    );

    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.body).toEqual({ name: '아키텍처 문서' });
    expect(outcome.out).toBe(`세웠습니다: ${FOLDER}`);
  });

  /* 이어 쓰는 쪽이 식별자만 집어 갈 수 있어야 한다. 옮기기가 이 명령을 줄줄이 부른다. */
  it('--json 은 세운 것의 식별자만 낸다', async () => {
    const { fetchFn } = spy([
      { status: 201, location: `/api/v1/projects/TG/document-folders/${FOLDER}` },
    ]);

    const outcome = await run(
      ['doc', 'folder', 'add', '아키텍처', '--json'],
      () => client(fetchFn),
      ENV,
    );

    expect(JSON.parse(outcome.out)).toEqual({ id: FOLDER });
  });

  it('--parent 를 넘기면 그 아래에 세운다', async () => {
    const { calls, fetchFn } = spy([
      { body: [folder()] },
      { status: 201, location: '/api/v1/projects/TG/document-folders/x' },
    ]);

    await run(['doc', 'folder', 'add', '아래', '--parent', 'ffffffff'], () => client(fetchFn), ENV);

    expect(calls[1]?.body).toEqual({ name: '아래', parentId: FOLDER });
  });

  /* 이름이 겹쳐도 막지 않는다(DOC-008 A2). 가리키는 것은 이름이 아니라 식별자다. */
  it('같은 이름이 이미 있어도 그대로 세운다', async () => {
    const { calls, fetchFn } = spy([
      { body: [folder()] },
      { status: 201, location: '/api/v1/projects/TG/document-folders/x' },
    ]);

    await run(
      ['doc', 'folder', 'add', '아키텍처', '--parent', 'ffffffff'],
      () => client(fetchFn),
      ENV,
    );

    expect(calls[1]?.body).toEqual({ name: '아키텍처', parentId: FOLDER });
  });

  it('식별자는 폴더에서도 앞 몇 자만 적어도 된다', async () => {
    const { calls, fetchFn } = spy([{ body: [folder()] }, { status: 204 }]);

    await run(['doc', 'folder', 'rename', 'ffff', '새', '이름'], () => client(fetchFn), ENV);

    expect(calls[1]?.method).toBe('PATCH');
    expect(calls[1]?.url).toBe(`https://api.example/api/v1/projects/TG/document-folders/${FOLDER}`);
    expect(calls[1]?.body).toEqual({ name: '새 이름' });
  });

  it('앞이 맞는 폴더가 둘 이상이면 고르지 않고 후보를 보인다', async () => {
    const { calls, fetchFn } = spy([
      {
        body: [
          folder({ id: 'ffffffff-1111-0000-0000-000000000000' }),
          folder({ id: 'ffffffff-2222-0000-0000-000000000000', name: '다른 것' }),
        ],
      },
    ]);

    await expect(run(['doc', 'folder', 'rm', 'ffff'], () => client(fetchFn), ENV)).rejects.toThrow(
      /2 개입니다/,
    );
    expect(calls).toHaveLength(1);
  });

  it('옮기면 담긴 것이 함께 간다는 것을 말한다', async () => {
    const { calls, fetchFn } = spy([
      { body: [folder(), folder({ id: 'cccccccc-0000-0000-0000-000000000000', name: '위' })] },
      { status: 204 },
    ]);

    const outcome = await run(
      ['doc', 'folder', 'mv', 'ffffffff', '--parent', 'cccccccc'],
      () => client(fetchFn),
      ENV,
    );

    expect(calls[1]?.method).toBe('PUT');
    expect(calls[1]?.url).toBe(
      `https://api.example/api/v1/projects/TG/document-folders/${FOLDER}/parent`,
    );
    expect(calls[1]?.body).toEqual({ parentId: 'cccccccc-0000-0000-0000-000000000000' });
    expect(outcome.out).toContain('함께 갔습니다');
  });

  it('--parent 를 비우면 최상위로 옮긴다', async () => {
    const { calls, fetchFn } = spy([{ body: [folder()] }, { status: 204 }]);

    const outcome = await run(['doc', 'folder', 'mv', 'ffffffff'], () => client(fetchFn), ENV);

    expect(calls[1]?.body).toEqual({ parentId: null });
    expect(outcome.out).toContain('최상위로');
  });

  /* 자기 자손 아래로 가는 것은 서버가 가린다(DOC-008 A6). 사유를 여기서 다시 짓지 않는다. */
  it('자기 자손 아래로 옮기면 서버가 낸 사유를 그대로 옮긴다', async () => {
    const { fetchFn } = spy([
      { body: [folder()] },
      {
        status: 409,
        body: {
          code: 'FOLDER_MOVE_INTO_DESCENDANT',
          detail: '자기 자신이나 자기 아래로는 옮길 수 없습니다.',
        },
      },
    ]);

    await expect(
      run(['doc', 'folder', 'mv', 'ffffffff', '--parent', 'ffffffff'], () => client(fetchFn), ENV),
    ).rejects.toThrow(/자기 아래로는 옮길 수 없습니다/);
  });

  /*
   * 되묻는 자리를 반드시 지난다(DOC-008 A7). 보이는 것이 지워지는 수가 아니라 올라오는 수라는 것이
   * 말에 담겨야 한다 — 삭제로 읽히면 사람이 지우지 않을 것을 지운다.
   */
  it('--yes 없이는 담긴 것이 몇인지 보이고 지우지 않는다', async () => {
    const { calls, fetchFn } = spy([{ body: [folder({ documentCount: 3, folderCount: 2 })] }]);

    const outcome = await run(['doc', 'folder', 'rm', 'ffffffff'], () => client(fetchFn), ENV);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe('GET');
    expect(outcome.code).toBe(1);
    expect(outcome.out).toContain('문서 3 · 폴더 2');
    expect(outcome.out).toContain('한 단계 위로 올라갑니다');
    expect(outcome.out).toContain('--yes');
  });

  it('--yes 를 넘기면 지우고 무엇이 올라갔는지 말한다', async () => {
    const { calls, fetchFn } = spy([
      { body: [folder({ documentCount: 3, folderCount: 2 })] },
      { status: 204 },
    ]);

    const outcome = await run(
      ['doc', 'folder', 'rm', 'ffffffff', '--yes'],
      () => client(fetchFn),
      ENV,
    );

    expect(calls[1]?.method).toBe('DELETE');
    expect(calls[1]?.url).toBe(`https://api.example/api/v1/projects/TG/document-folders/${FOLDER}`);
    expect(outcome.code).toBe(0);
    expect(outcome.out).toContain('한 단계 위로 올라갔습니다');
  });

  it('비어 있으면 올라갈 것을 말하지 않는다', async () => {
    const { fetchFn } = spy([{ body: [folder()] }]);

    const outcome = await run(['doc', 'folder', 'rm', 'ffffffff'], () => client(fetchFn), ENV);

    expect(outcome.out).toContain('문서 0 · 폴더 0');
    expect(outcome.out).not.toContain('올라갑니다');
  });

  it('하위 명령이 아니면 그 사실을 알린다', async () => {
    const { fetchFn } = spy([{ body: [] }]);

    await expect(run(['doc', 'folder', 'move'], () => client(fetchFn), ENV)).rejects.toThrow(
      /doc folder 의 하위 명령이 아닙니다/,
    );
  });
});

describe('gentask doc 와 폴더', () => {
  it('세울 때 담을 자리를 함께 보낸다', async () => {
    const { calls, fetchFn } = spy([
      { body: [folder()] },
      { status: 201, location: `/api/v1/projects/TG/documents/${ID}` },
    ]);

    await run(['doc', 'add', '개요', '--folder', 'ffffffff'], () => client(fetchFn), ENV);

    expect(calls[1]?.body).toEqual({ title: '개요', folderId: FOLDER });
  });

  /* 옮기는 것은 개정이 아니다(DOC-006). 본문도 제목도 보내지 않는다. */
  it('옮기기는 담긴 자리만 보낸다', async () => {
    const { calls, fetchFn } = spy([{ body: [folder()] }, { status: 204 }]);

    const outcome = await run(
      ['doc', 'mv', ID, '--folder', 'ffffffff'],
      () => client(fetchFn),
      ENV,
    );

    expect(calls[1]?.method).toBe('PUT');
    expect(calls[1]?.url).toBe(`https://api.example/api/v1/projects/TG/documents/${ID}/folder`);
    expect(calls[1]?.body).toEqual({ folderId: FOLDER });
    expect(outcome.out).toContain('아키텍처');
  });

  it('--folder 를 비우면 최상위로 옮긴다', async () => {
    const { calls, fetchFn } = spy([{ status: 204 }]);

    const outcome = await run(['doc', 'mv', ID], () => client(fetchFn), ENV);

    expect(calls[0]?.body).toEqual({ folderId: null });
    expect(outcome.out).toContain('최상위로');
  });

  it('목록을 그 자리의 것만으로 좁힌다', async () => {
    const { fetchFn } = spy([
      {
        body: [
          summary({ folderId: FOLDER }),
          summary({ id: 'bbbb0000-0000-0000-0000-000000000000', title: '밖의 것' }),
        ],
      },
      { body: [folder()] },
    ]);

    const outcome = await run(['doc', 'list', '--folder', 'ffffffff'], () => client(fetchFn), ENV);

    expect(outcome.out).toContain('아키텍처 개요');
    expect(outcome.out).not.toContain('밖의 것');
  });
});

describe('gentask doc 본문을 파일과 표준입력에서 받기', () => {
  /* 마크다운 한 편을 --body 로 넘기면 셸의 인자 길이 한계에 걸린다. 옮기기가 이 길로 간다. */
  it('--body-file 이 파일의 내용을 본문으로 보낸다', async () => {
    const 경로 = join(mkdtempSync(join(tmpdir(), 'gentask-body-')), 'body.md');
    writeFileSync(경로, '# 제목\n\n본문이 길다', 'utf8');
    const { calls, fetchFn } = spy([
      { status: 201, location: `/api/v1/projects/TG/documents/${ID}` },
    ]);

    await run(['doc', 'add', '개요', '--body-file', 경로], () => client(fetchFn), ENV);

    expect(calls[0]?.body).toEqual({ title: '개요', body: '# 제목\n\n본문이 길다' });
  });

  it('--body-file - 은 표준입력에서 받는다', async () => {
    const { calls, fetchFn } = spy([
      { status: 201, location: `/api/v1/projects/TG/documents/${ID}` },
    ]);

    await run(
      ['doc', 'add', '개요', '--body-file', '-'],
      () => client(fetchFn),
      ENV,
      async () => '파이프로 들어온 본문',
    );

    expect(calls[0]?.body).toEqual({ title: '개요', body: '파이프로 들어온 본문' });
  });

  it('고칠 때도 파일에서 본문을 받는다', async () => {
    const 경로 = join(mkdtempSync(join(tmpdir(), 'gentask-body-')), 'body.md');
    writeFileSync(경로, '고쳐 담을 본문', 'utf8');
    const { calls, fetchFn } = spy([{ body: doc() }, { status: 204 }]);

    await run(['doc', 'edit', ID, '--body-file', 경로], () => client(fetchFn), ENV);

    expect(calls[1]?.body).toEqual({ title: '아키텍처 개요', body: '고쳐 담을 본문' });
  });

  /* 어느 쪽이 이겼는지 부르는 쪽이 알 수 없다. 파이프로 이어 붙인 본문이 조용히 버려지면 안 된다. */
  it('--body 와 --body-file 을 함께 넘기면 부르지 않는다', async () => {
    const { calls, fetchFn } = spy([{ body: [] }]);

    await expect(
      run(['doc', 'add', '개요', '--body', 'x', '--body-file', '-'], () => client(fetchFn), ENV),
    ).rejects.toThrow(/함께 넘길 수 없습니다/);
    expect(calls).toHaveLength(0);
  });

  it('읽을 파일이 없으면 그 사실을 알리고 부르지 않는다', async () => {
    const { calls, fetchFn } = spy([{ body: [] }]);

    await expect(
      run(['doc', 'add', '개요', '--body-file', '없는-파일.md'], () => client(fetchFn), ENV),
    ).rejects.toThrow(/본문으로 읽을 파일이 없습니다/);
    expect(calls).toHaveLength(0);
  });

  it('사유만 넘기는 것은 --body-file 이 생겨도 받지 않는다', async () => {
    const { calls, fetchFn } = spy([{ body: doc() }]);

    await expect(
      run(['doc', 'edit', ID, '--comment', '왜'], () => client(fetchFn), ENV),
    ).rejects.toThrow(/--body-file/);
    expect(calls).toHaveLength(0);
  });
});
