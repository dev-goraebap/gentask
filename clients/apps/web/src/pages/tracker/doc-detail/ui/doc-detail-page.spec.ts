import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, computed, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type Routes, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DocService } from '@/entities/doc';
import { ProjectService } from '@/entities/project';
import { ENDPOINTS } from '@/shared/api';
import { CURRENT_PROJECT_ID } from '@/shared/config';
import { DocDetailPage } from './doc-detail-page';

/** 주소가 담는 것은 접두어가 아니라 프로젝트의 식별자다(GT-60). */
const PROJECT = 'V1StGXR8_Z5j';

const DOCUMENT = '3f6b1a2c-0000-4000-8000-000000000001';

const DOC_URL = `/projects/${PROJECT}/docs/${DOCUMENT}`;

/** 지금 참인 개정의 번호. 되돌릴 때 담을 것이 없는 자리를 이 값으로 가른다(DOC-005 A2). */
const CURRENT = 3;

@Component({ selector: 'app-docs-stub', template: `문서로 나왔다` })
class DocsStub {}

const routes: Routes = [
  { path: `projects/${PROJECT}/docs`, component: DocsStub },
  { path: `projects/${PROJECT}/docs/:id`, component: DocDetailPage },
];

describe('DocDetailPage 의 지나온 것', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes, withComponentInputBinding()),
        ProjectService,
        {
          provide: CURRENT_PROJECT_ID,
          useFactory: () => {
            const projectService = inject(ProjectService);
            return computed(() => projectService.current()?.id);
          },
        },
        DocService,
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(async () => {
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => node.remove());
    await drain();
    httpTesting.verify();
  });

  /**
   * 실려 있는 요청을 비운다. 프로젝트가 실려야 문서의 주소가 만들어지므로 여러 마디를 돈다.
   *
   * 이력과 개정 하나는 주소에 따라 서기도 하고 서지 않기도 하므로 `match` 로 비운다. 없으면
   * 아무 일도 하지 않는다.
   */
  async function drain(): Promise<void> {
    for (let round = 0; round < 5; round += 1) {
      await new Promise((resolve) => setTimeout(resolve));
      TestBed.tick();

      httpTesting
        .match({ url: ENDPOINTS.projects, method: 'GET' })
        .forEach((each) =>
          each.flush([{ id: PROJECT, name: 'gentask', key: 'GT', issueCount: 0 }]),
        );
      httpTesting
        .match({ url: ENDPOINTS.docs(PROJECT), method: 'GET' })
        .forEach((each) => each.flush([]));
      httpTesting
        .match({ url: ENDPOINTS.docFolders(PROJECT), method: 'GET' })
        .forEach((each) => each.flush([]));
      httpTesting
        .match({ url: ENDPOINTS.doc(PROJECT, DOCUMENT), method: 'GET' })
        .forEach((each) => each.flush(doc()));
      httpTesting
        .match((request) => request.url === ENDPOINTS.docRevisions(PROJECT, DOCUMENT))
        .forEach((each) => each.flush(history()));
      httpTesting
        .match((request) => request.url.startsWith(`${ENDPOINTS.docRevisions(PROJECT, DOCUMENT)}/`))
        .forEach((each) => each.flush(revisionAt(each.request.url)));
    }
  }

  async function open(url: string): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await drain();
    harness.detectChanges();
    return harness;
  }

  it('이력을 열면 몇 번째인지 · 언제 · 누가 · 사유를 최근 것부터 낸다', async () => {
    const harness = await open(`${DOC_URL}?revisions=1`);

    const text = harness.routeNativeElement?.textContent ?? '';
    expect(text).toContain('판 3');
    expect(text).toContain('판 1');
    expect(text).toContain('고래밥');
    expect(text).toContain('오타를 고쳤다');
    // 적지 않아도 되는 자리라 비어 있는 것이 잘못이 아니다. 빈 줄로 두지 않는다.
    expect(text).toContain('사유를 적지 않았습니다');
    expect(text).toContain('3개 중 1–3');
  });

  it('개정 하나를 고르면 그때의 제목과 본문을 그린다', async () => {
    const harness = await open(`${DOC_URL}?revisions=1&rev=2`);

    expect(harness.routeNativeElement?.textContent).toContain('판 2 · 판 2 의 제목');
  });

  it('둘을 고르면 지운 줄과 더한 줄을 부호로 가른다', async () => {
    const harness = await open(`${DOC_URL}?revisions=1&rev=3&against=1`);

    const text = harness.routeNativeElement?.textContent ?? '';
    // 지난 것이 앞에 선다. 고른 차례가 아니라 시간이 순서를 정한다.
    expect(text).toContain('판 1에서 판 3으로');
    expect(text).toContain('1줄을 지우고 1줄을 더했습니다');
    // 색만으로 가르지 않으므로 소리로 읽는 이름이 함께 선다.
    expect(text).toContain('지운 줄');
    expect(text).toContain('더한 줄');
  });

  it('개정을 지우는 길을 두지 않는다', async () => {
    const harness = await open(`${DOC_URL}?revisions=1&rev=2`);

    expect(harness.routeNativeElement?.textContent).not.toContain('지우기');
  });

  it('되묻는 자리를 그만두면 아무것도 담지 않는다', async () => {
    const harness = await open(`${DOC_URL}?revisions=1&rev=2`);

    pressInPage('되돌리기', harness);
    harness.detectChanges();
    pressInPane('그만두기');
    await settle(harness);

    httpTesting.expectNone((request) => request.method === 'POST');
    expect(TestBed.inject(Router).url).toBe(`${DOC_URL}?revisions=1&rev=2`);
  });

  it('되돌리면 새 개정을 남기고 문서로 돌아간다', async () => {
    const harness = await open(`${DOC_URL}?revisions=1&rev=2`);

    pressInPage('되돌리기', harness);
    harness.detectChanges();
    type('잘못 고쳤다');
    pressInPane('되돌리기');

    const reverted = httpTesting.expectOne({
      url: ENDPOINTS.docRevisionRevert(PROJECT, DOCUMENT, 2),
      method: 'POST',
    });
    expect(reverted.request.body).toEqual({ comment: '잘못 고쳤다' });
    reverted.flush(null, { status: 204, statusText: 'No Content' });

    await settle(harness);
    await drain();

    expect(TestBed.inject(Router).url).toBe(DOC_URL);
  });

  it('지금 참인 개정으로 되돌리는 것을 실패로 그리지 않는다', async () => {
    const harness = await open(`${DOC_URL}?revisions=1&rev=${CURRENT}`);

    pressInPage('되돌리기', harness);
    harness.detectChanges();
    expect(pane()?.textContent).toContain('담을 것이 없습니다');

    pressInPane('되돌리기');
    // 서버는 아무것도 담지 않고 성공으로 답한다(DOC-005 A2).
    httpTesting
      .expectOne({ url: ENDPOINTS.docRevisionRevert(PROJECT, DOCUMENT, CURRENT), method: 'POST' })
      .flush(null, { status: 204, statusText: 'No Content' });

    await settle(harness);
    await drain();

    expect(TestBed.inject(Router).url).toBe(DOC_URL);
  });
});

function doc(): object {
  return {
    summary: {
      id: DOCUMENT,
      title: '아키텍처 진입',
      folderId: null,
      createdAt: '2026-08-20T01:02:03Z',
      updatedAt: '2026-08-31T04:05:06Z',
    },
    body: '한 줄.',
    revisionNo: CURRENT,
    authorName: '고래밥',
  };
}

function history(): object {
  return {
    items: [
      { revisionNo: 3, createdAt: '2026-08-31T04:05:06Z', authorName: '고래밥', comment: null },
      {
        revisionNo: 2,
        createdAt: '2026-08-25T04:05:06Z',
        authorName: '고래밥',
        comment: '오타를 고쳤다',
      },
      { revisionNo: 1, createdAt: '2026-08-20T01:02:03Z', authorName: '고래밥', comment: '세웠다' },
    ],
    total: 3,
    page: 0,
    size: 20,
  };
}

/** 주소의 끝자리가 몇 번째 개정인지를 말한다. 검사가 개정마다 다른 본문을 내기 위한 자리다. */
function revisionAt(url: string): object {
  const revisionNo = Number(url.slice(url.lastIndexOf('/') + 1));
  return {
    summary: {
      revisionNo,
      createdAt: '2026-08-20T01:02:03Z',
      authorName: '고래밥',
      comment: null,
    },
    title: `판 ${revisionNo} 의 제목`,
    body: `머리\n줄 ${revisionNo}\n꼬리`,
  };
}

function pane(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-container .cdk-overlay-pane');
}

function pressInPage(label: string, harness: RouterTestingHarness): void {
  const button = [...(harness.routeNativeElement?.querySelectorAll('button') ?? [])].find(
    (candidate) => candidate.textContent?.includes(label),
  );
  expect(button, `화면에서 '${label}' 를 찾지 못했습니다`).toBeDefined();
  button!.click();
}

/** 누르기만 하고 가라앉기를 기다리지 않는다. 나간 요청을 먼저 비워야 하기 때문이다. */
function pressInPane(label: string): void {
  const button = [...(pane()?.querySelectorAll('button') ?? [])].find((candidate) =>
    candidate.textContent?.includes(label),
  );
  expect(button, `덮개 안에서 '${label}' 를 찾지 못했습니다`).toBeDefined();
  button!.click();
}

function type(value: string): void {
  const input = pane()?.querySelector<HTMLInputElement>('input');
  expect(input, '덮개 안에서 적는 자리를 찾지 못했습니다').not.toBeNull();

  input!.value = value;
  input!.dispatchEvent(new Event('input'));
}

async function settle(harness: RouterTestingHarness): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  harness.detectChanges();
}
