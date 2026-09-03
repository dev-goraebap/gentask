import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, computed, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, type Routes, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DocService } from '@/entities/doc';
import { ProjectService } from '@/entities/project';
import { ENDPOINTS } from '@/shared/api';
import { CURRENT_PROJECT_ID } from '@/shared/config';
import { DocListPage } from './doc-list-page';

/** 주소가 담는 것은 접두어가 아니라 프로젝트의 식별자다(GT-60). */
const PROJECT = 'V1StGXR8_Z5j';

const DOCS_URL = `/projects/${PROJECT}/docs`;

const ARCH = '3f6b1a2c-0000-4000-8000-000000000001';
const ADR = '3f6b1a2c-0000-4000-8000-000000000002';
const DOCUMENT = '3f6b1a2c-0000-4000-8000-000000000003';

@Component({ selector: 'app-doc-stub', template: `문서 하나` })
class DocStub {}

const routes: Routes = [
  { path: `projects/${PROJECT}/docs`, component: DocListPage },
  { path: `projects/${PROJECT}/docs/:id`, component: DocStub },
];

describe('DocListPage', () => {
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

  /** 실려 있는 요청을 비운다. 프로젝트가 실려야 문서와 폴더의 주소가 만들어지므로 여러 마디를 돈다. */
  async function drain(docs = DOCS, folders = FOLDERS): Promise<void> {
    for (let round = 0; round < 4; round += 1) {
      await new Promise((resolve) => setTimeout(resolve));
      TestBed.tick();

      httpTesting
        .match({ url: ENDPOINTS.projects, method: 'GET' })
        .forEach((each) =>
          each.flush([{ id: PROJECT, name: 'gentask', key: 'GT', issueCount: 0 }]),
        );
      httpTesting
        .match({ url: ENDPOINTS.docs(PROJECT), method: 'GET' })
        .forEach((each) => each.flush(docs));
      httpTesting
        .match({ url: ENDPOINTS.docFolders(PROJECT), method: 'GET' })
        .forEach((each) => each.flush(folders));
    }
  }

  async function open(url: string): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await drain();
    harness.detectChanges();
    return harness;
  }

  it('GT-64 #4: 빈 폴더인 경우 빈 상태 메시지와 생성 버튼을 표시한다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(DOCS_URL);
    await drain([], []);
    harness.detectChanges();

    const text = harness.routeNativeElement?.textContent ?? '';
    expect(text).toContain('이 자리에 아직 아무것도 없습니다');
    expect(text).toContain('새 폴더');
    expect(text).toContain('새 문서');
  });

  it('폴더를 열면 그 안의 것만 보이고 지나온 길이 선다', async () => {
    const harness = await open(`${DOCS_URL}?folder=${ARCH}`);

    const text = harness.routeNativeElement?.textContent ?? '';
    expect(text).toContain('결정 기록');
    expect(text).toContain('아키텍처 진입');
    // 다른 자리의 것은 보이지 않는다.
    expect(text).not.toContain('회의록');

    const crumbs = harness.routeNativeElement?.querySelector('nav[aria-label="지나온 폴더"]');
    expect(crumbs?.textContent).toContain('문서');
    expect(crumbs?.textContent).toContain('아키텍처');
  });

  it('GT-70 #3: 이름이 비면 이름이 필요하다고 알린다', async () => {
    const harness = await open(DOCS_URL);

    press('새 폴더', harness);
    harness.detectChanges();
    press('세우기', harness);
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain('이름이 필요합니다');
    httpTesting.expectNone({ url: ENDPOINTS.docFolders(PROJECT), method: 'POST' });
  });

  it('폴더는 지금 열어 둔 자리 아래에 선다', async () => {
    const harness = await open(`${DOCS_URL}?folder=${ARCH}`);

    press('새 폴더', harness);
    harness.detectChanges();
    type('기각', harness);
    press('세우기', harness);

    const created = httpTesting.expectOne({
      url: ENDPOINTS.docFolders(PROJECT),
      method: 'POST',
    });
    expect(created.request.body).toEqual({ name: '기각', parentId: ARCH });
    created.flush(null, { status: 201, statusText: 'Created' });
  });

  it('GT-63 #5: 문서도 지금 열어 둔 자리에 담긴다', async () => {
    const harness = await open(`${DOCS_URL}?folder=${ARCH}`);

    press('새 문서', harness);
    harness.detectChanges();
    type('새 문서', harness);
    press('세우기', harness);

    const created = httpTesting.expectOne({ url: ENDPOINTS.docs(PROJECT), method: 'POST' });
    expect(created.request.body).toEqual({ title: '새 문서', body: '', folderId: ARCH });
    created.flush(null, {
      status: 201,
      statusText: 'Created',
      headers: { Location: ENDPOINTS.doc(PROJECT, DOCUMENT) },
    });
  });

  it('이름을 바꾸면 이름만 넘긴다', async () => {
    const harness = await open(`${DOCS_URL}?folder=${ARCH}`);

    press('결정 기록 이름 바꾸기', harness);
    harness.detectChanges();
    type('아키텍처 결정', harness);
    press('담기', harness);

    const renamed = httpTesting.expectOne({
      url: ENDPOINTS.docFolder(PROJECT, ADR),
      method: 'PATCH',
    });
    expect(renamed.request.body).toEqual({ name: '아키텍처 결정' });
    renamed.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('폴더 이동 시 자기 자신과 하위 자손 폴더는 이동 대상에서 제외한다', async () => {
    const harness = await open(DOCS_URL);

    press('아키텍처 옮기기', harness);
    harness.detectChanges();

    const text = pane()?.textContent ?? '';
    expect(text).toContain('문서 / 회의록');
    expect(text).not.toContain('문서 / 아키텍처');
  });

  it('GT-68: 문서를 고른 자리로 옮긴다', async () => {
    const harness = await open(`${DOCS_URL}?folder=${ARCH}`);

    press('아키텍처 진입 옮기기', harness);
    harness.detectChanges();
    pressInPane('문서 / 회의록');

    const moved = httpTesting.expectOne({
      url: ENDPOINTS.docParent(PROJECT, DOCUMENT),
      method: 'PUT',
    });
    expect(moved.request.body).toEqual({ folderId: MEETING });
    moved.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('GT-68: 최상위로 옮기는 것은 담을 폴더를 비우는 것이다', async () => {
    const harness = await open(`${DOCS_URL}?folder=${ARCH}`);

    press('아키텍처 진입 옮기기', harness);
    harness.detectChanges();
    pressInPane('문서');

    const moved = httpTesting.expectOne({
      url: ENDPOINTS.docParent(PROJECT, DOCUMENT),
      method: 'PUT',
    });
    expect(moved.request.body).toEqual({ folderId: null });
    moved.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('GT-70 #7: 되묻는 자리가 담긴 문서와 하위 폴더가 몇인지 보인다', async () => {
    const harness = await open(DOCS_URL);

    press('아키텍처 지우기', harness);
    harness.detectChanges();

    const text = pane()?.textContent ?? '';
    expect(text).toContain('문서 2개');
    expect(text).toContain('하위 폴더 1개');
  });

  it('GT-70 #10: 되묻는 자리를 그만두면 아무것도 지우지 않는다', async () => {
    const harness = await open(DOCS_URL);

    press('아키텍처 지우기', harness);
    harness.detectChanges();
    pressInPane('그만두기');
    await settle(harness);

    httpTesting.expectNone((request) => request.method === 'DELETE');
  });

  it('GT-70 #7: 되묻는 자리를 지나면 그 폴더를 지운다', async () => {
    const harness = await open(DOCS_URL);

    press('아키텍처 지우기', harness);
    harness.detectChanges();
    pressInPane('지우기');

    httpTesting
      .expectOne({ url: ENDPOINTS.docFolder(PROJECT, ARCH), method: 'DELETE' })
      .flush(null, { status: 204, statusText: 'No Content' });

    await settle(harness);
  });

  it('싣지 못한 것을 비어 있음으로 그리지 않는다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(DOCS_URL);

    for (let round = 0; round < 4; round += 1) {
      await new Promise((resolve) => setTimeout(resolve));
      TestBed.tick();
      httpTesting
        .match({ url: ENDPOINTS.projects, method: 'GET' })
        .forEach((each) =>
          each.flush([{ id: PROJECT, name: 'gentask', key: 'GT', issueCount: 0 }]),
        );
      httpTesting
        .match({ url: ENDPOINTS.docs(PROJECT), method: 'GET' })
        .forEach((each) => each.flush(null, { status: 500, statusText: 'Server Error' }));
      httpTesting
        .match({ url: ENDPOINTS.docFolders(PROJECT), method: 'GET' })
        .forEach((each) => each.flush([]));
    }
    harness.detectChanges();

    const text = harness.routeNativeElement?.textContent ?? '';
    expect(text).toContain('불러오지 못했습니다');
    expect(text).not.toContain('이 자리에 아직 아무것도 없습니다');
  });
});

const MEETING = '3f6b1a2c-0000-4000-8000-000000000004';

/** 아키텍처 > 결정 기록 · 그리고 나란한 회의록. */
const FOLDERS: readonly object[] = [
  {
    id: ARCH,
    name: '아키텍처',
    parentId: null,
    documentCount: 2,
    folderCount: 1,
    createdAt: '2026-08-20T01:02:03Z',
    updatedAt: '2026-08-31T04:05:06Z',
  },
  {
    id: ADR,
    name: '결정 기록',
    parentId: ARCH,
    documentCount: 0,
    folderCount: 0,
    createdAt: '2026-08-20T01:02:03Z',
    updatedAt: '2026-08-31T04:05:06Z',
  },
  {
    id: MEETING,
    name: '회의록',
    parentId: null,
    documentCount: 0,
    folderCount: 0,
    createdAt: '2026-08-20T01:02:03Z',
    updatedAt: '2026-08-31T04:05:06Z',
  },
];

const DOCS: readonly object[] = [
  {
    id: DOCUMENT,
    title: '아키텍처 진입',
    folderId: ARCH,
    createdAt: '2026-08-20T01:02:03Z',
    updatedAt: '2026-08-31T04:05:06Z',
  },
];

function pane(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-container .cdk-overlay-pane');
}

/** 소리로 읽는 이름을 먼저 보고 없으면 적힌 글자를 본다. 아이콘만 있는 단추가 섞여 있기 때문이다. */
function press(label: string, harness: RouterTestingHarness): void {
  const buttons = [...(harness.routeNativeElement?.querySelectorAll('button') ?? [])];
  const button =
    buttons.find((candidate) => candidate.getAttribute('aria-label') === label) ??
    buttons.find((candidate) => candidate.textContent?.trim() === label);
  expect(button, `화면에서 '${label}' 를 찾지 못했습니다`).toBeDefined();
  button!.click();
}

/** 누르기만 하고 가라앉기를 기다리지 않는다. 나간 요청을 먼저 비워야 하기 때문이다. */
function pressInPane(label: string): void {
  const button = [...(pane()?.querySelectorAll('button') ?? [])].find(
    (candidate) => candidate.textContent?.trim() === label,
  );
  expect(button, `덮개 안에서 '${label}' 를 찾지 못했습니다`).toBeDefined();
  button!.click();
}

function type(value: string, harness: RouterTestingHarness): void {
  const input = harness.routeNativeElement?.querySelector<HTMLInputElement>('input');
  expect(input, '적는 자리를 찾지 못했습니다').not.toBeNull();

  input!.value = value;
  input!.dispatchEvent(new Event('input'));
  harness.detectChanges();
}

async function settle(harness: RouterTestingHarness): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  harness.detectChanges();
}
