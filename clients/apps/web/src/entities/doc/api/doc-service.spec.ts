import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ENDPOINTS } from '@/shared/api';
import { CURRENT_PROJECT_ID } from '@/shared/config';
import { DocService } from './doc-service';

/** 주소가 담는 것은 접두어가 아니라 프로젝트의 식별자다(GT-60). */
const PROJECT = 'V1StGXR8_Z5j';

const DOCUMENT = '3f6b1a2c-0000-4000-8000-000000000001';

describe('DocService', () => {
  let docService: DocService;
  let httpTesting: HttpTestingController;
  const projectId = signal<string | undefined>(PROJECT);

  beforeEach(() => {
    projectId.set(PROJECT);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CURRENT_PROJECT_ID, useValue: projectId as Signal<string | undefined> },
        DocService,
      ],
    });
    docService = TestBed.inject(DocService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve));
  }

  /** 목록은 리소스가 싣는다. 효과가 돌아야 요청이 나간다. */
  function flushList(rows: readonly object[] = []): void {
    TestBed.tick();
    httpTesting.expectOne({ url: ENDPOINTS.docs(PROJECT), method: 'GET' }).flush(rows);
  }

  function summary(overrides: Record<string, unknown> = {}): object {
    return {
      id: DOCUMENT,
      title: '아키텍처 진입',
      createdAt: '2026-08-20T01:02:03Z',
      updatedAt: '2026-08-31T04:05:06Z',
      ...overrides,
    };
  }

  function revision(overrides: Record<string, unknown> = {}): object {
    return {
      revisionNo: 3,
      createdAt: '2026-08-31T04:05:06Z',
      authorName: '고래밥',
      comment: null,
      ...overrides,
    };
  }

  it('목록을 프로젝트 아래에서 묻고 고친 날만 남긴다', async () => {
    flushList([summary()]);
    await settle();
    TestBed.tick();

    expect(docService.list()).toEqual([
      {
        id: DOCUMENT,
        title: '아키텍처 진입',
        updatedOn: '2026-08-31',
        // 폴더 · 첨부 · 작업 아이템 잇기는 아직 서버에 자리가 없다.
        folderId: null,
        linkedIssueCount: 0,
        attachmentCount: 0,
      },
    ]);
  });

  it('프로젝트가 아직 실리지 않았으면 아무것도 묻지 않는다', () => {
    projectId.set(undefined);

    TestBed.tick();
    httpTesting.expectNone(() => true);
    expect(docService.list()).toEqual([]);
  });

  it('세울 때 제목과 본문을 함께 넘기고 Location 의 식별자를 낸다', async () => {
    flushList();

    const done = docService.add('새 문서', '# 첫 줄');

    const create = httpTesting.expectOne({ url: ENDPOINTS.docs(PROJECT), method: 'POST' });
    expect(create.request.body).toEqual({ title: '새 문서', body: '# 첫 줄' });
    create.flush(null, {
      status: 201,
      statusText: 'Created',
      headers: { Location: ENDPOINTS.doc(PROJECT, DOCUMENT) },
    });

    await expect(done).resolves.toBe(DOCUMENT);
    // 세운 것이 목록에 서야 하므로 뒤이어 다시 싣는다.
    flushList();
  });

  it('본문을 넘기지 않으면 빈 본문으로 세운다', async () => {
    flushList();

    const done = docService.add('제목만');

    const create = httpTesting.expectOne({ url: ENDPOINTS.docs(PROJECT), method: 'POST' });
    expect(create.request.body).toEqual({ title: '제목만', body: '' });
    create.flush(null, {
      status: 201,
      statusText: 'Created',
      headers: { Location: ENDPOINTS.doc(PROJECT, DOCUMENT) },
    });

    await done;
    flushList();
  });

  it('고칠 때 제목 · 본문 · 개정 사유를 함께 넘긴다', async () => {
    flushList();

    const done = docService.edit(DOCUMENT, '고친 제목', '고친 본문', '오타를 고쳤다');

    const edit = httpTesting.expectOne({ url: ENDPOINTS.doc(PROJECT, DOCUMENT), method: 'PATCH' });
    expect(edit.request.body).toEqual({
      title: '고친 제목',
      body: '고친 본문',
      comment: '오타를 고쳤다',
    });
    edit.flush(null);

    await done;
    flushList();
  });

  it('개정 사유를 적지 않으면 비운 채로 넘긴다', async () => {
    flushList();

    const done = docService.edit(DOCUMENT, '고친 제목', '고친 본문');

    const edit = httpTesting.expectOne({ url: ENDPOINTS.doc(PROJECT, DOCUMENT), method: 'PATCH' });
    expect(edit.request.body).toEqual({ title: '고친 제목', body: '고친 본문', comment: null });
    edit.flush(null);

    await done;
    flushList();
  });

  it('고치기가 실패하면 목록을 다시 싣지 않는다', async () => {
    flushList();

    const done = docService.edit(DOCUMENT, '고친 제목', '고친 본문');

    httpTesting
      .expectOne({ url: ENDPOINTS.doc(PROJECT, DOCUMENT), method: 'PATCH' })
      .flush(null, { status: 404, statusText: 'Not Found' });

    await expect(done).rejects.toBeDefined();
    TestBed.tick();
    httpTesting.expectNone({ url: ENDPOINTS.docs(PROJECT), method: 'GET' });
  });

  it('상세는 마크다운 원문과 개정 번호를 그대로 낸다', async () => {
    flushList();

    const detail = TestBed.runInInjectionContext(() =>
      docService.detailOf(signal<string | undefined>(DOCUMENT)),
    );

    TestBed.tick();
    httpTesting.expectOne({ url: ENDPOINTS.doc(PROJECT, DOCUMENT), method: 'GET' }).flush({
      summary: summary(),
      body: '# 제목\n\n한 줄.',
      revisionNo: 7,
      authorName: '고래밥',
    });
    await settle();
    TestBed.tick();

    expect(detail.value()).toEqual({
      id: DOCUMENT,
      title: '아키텍처 진입',
      updatedOn: '2026-08-31',
      folderId: null,
      linkedIssueCount: 0,
      attachmentCount: 0,
      body: '# 제목\n\n한 줄.',
      revisionNo: 7,
      authorName: '고래밥',
      attachments: [],
      linkedIssues: [],
    });
  });

  it('이력은 문서 아래에서 쪽을 지어 묻는다', async () => {
    flushList();

    const revisions = TestBed.runInInjectionContext(() =>
      docService.revisionsOf(signal<string | undefined>(DOCUMENT), signal(0)),
    );

    TestBed.tick();
    const asked = httpTesting.expectOne(
      (request) => request.url === ENDPOINTS.docRevisions(PROJECT, DOCUMENT),
    );
    expect(asked.request.params.get('page')).toBe('0');
    expect(asked.request.params.get('size')).toBe('20');
    asked.flush({ items: [revision()], total: 1, page: 0, size: 20 });
    await settle();
    TestBed.tick();

    expect(revisions.value()?.items).toEqual([revision()]);
  });

  it('쪽을 넘기면 그 쪽을 다시 묻는다', async () => {
    flushList();

    const page = signal(0);
    TestBed.runInInjectionContext(() =>
      docService.revisionsOf(signal<string | undefined>(DOCUMENT), page),
    );

    TestBed.tick();
    httpTesting
      .expectOne((request) => request.url === ENDPOINTS.docRevisions(PROJECT, DOCUMENT))
      .flush({ items: [], total: 40, page: 0, size: 20 });
    await settle();

    page.set(1);
    TestBed.tick();
    const next = httpTesting.expectOne(
      (request) => request.url === ENDPOINTS.docRevisions(PROJECT, DOCUMENT),
    );
    expect(next.request.params.get('page')).toBe('1');
    next.flush({ items: [], total: 40, page: 1, size: 20 });
    await settle();
  });

  it('아직 이력을 열지 않았으면 묻지 않는다', () => {
    flushList();

    TestBed.runInInjectionContext(() =>
      docService.revisionsOf(signal<string | undefined>(undefined), signal(0)),
    );

    TestBed.tick();
    httpTesting.expectNone((request) => request.url.includes('/revisions'));
  });

  it('개정 하나는 그때의 제목과 본문을 그대로 낸다', async () => {
    flushList();

    const chosen = TestBed.runInInjectionContext(() =>
      docService.revisionOf(signal<string | undefined>(DOCUMENT), signal<number | undefined>(3)),
    );

    TestBed.tick();
    httpTesting
      .expectOne({ url: ENDPOINTS.docRevision(PROJECT, DOCUMENT, 3), method: 'GET' })
      .flush({ summary: revision(), title: '그때의 제목', body: '그때의 본문' });
    await settle();
    TestBed.tick();

    expect(chosen.value()).toEqual({
      summary: revision(),
      title: '그때의 제목',
      body: '그때의 본문',
    });
  });

  it('고른 개정이 없으면 개정 하나를 묻지 않는다', () => {
    flushList();

    TestBed.runInInjectionContext(() =>
      docService.revisionOf(
        signal<string | undefined>(DOCUMENT),
        signal<number | undefined>(undefined),
      ),
    );

    TestBed.tick();
    httpTesting.expectNone((request) => request.url.includes('/revisions'));
  });

  it('되돌릴 때 이유를 함께 넘긴다', async () => {
    flushList();

    const done = docService.revert(DOCUMENT, 3, '잘못 고쳤다');

    const reverted = httpTesting.expectOne({
      url: ENDPOINTS.docRevisionRevert(PROJECT, DOCUMENT, 3),
      method: 'POST',
    });
    expect(reverted.request.body).toEqual({ comment: '잘못 고쳤다' });
    reverted.flush(null);

    await done;
    flushList();
  });

  it('되돌린 이유를 적지 않으면 비운 채로 넘긴다', async () => {
    flushList();

    const done = docService.revert(DOCUMENT, 3);

    const reverted = httpTesting.expectOne({
      url: ENDPOINTS.docRevisionRevert(PROJECT, DOCUMENT, 3),
      method: 'POST',
    });
    expect(reverted.request.body).toEqual({ comment: null });
    reverted.flush(null);

    await done;
    flushList();
  });

  it('되돌리기가 실패하면 목록을 다시 싣지 않는다', async () => {
    flushList();

    const done = docService.revert(DOCUMENT, 3);

    httpTesting
      .expectOne({ url: ENDPOINTS.docRevisionRevert(PROJECT, DOCUMENT, 3), method: 'POST' })
      .flush(null, { status: 404, statusText: 'Not Found' });

    await expect(done).rejects.toBeDefined();
    TestBed.tick();
    httpTesting.expectNone({ url: ENDPOINTS.docs(PROJECT), method: 'GET' });
  });

  it('폴더는 목이므로 세운 것이 이 자리에만 남는다', () => {
    flushList();

    docService.addFolder('아키텍처', null);

    expect(docService.folders().map((folder) => folder.name)).toEqual(['아키텍처']);
  });
});
