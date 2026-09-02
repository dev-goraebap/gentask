import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, computed, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type Routes, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IssueService } from '@/entities/issue';
import { ProjectService } from '@/entities/project';
import { ENDPOINTS } from '@/shared/api';
import { CURRENT_PROJECT_ID } from '@/shared/config';
import { IssueListPage } from './issue-list-page';

@Component({ selector: 'app-landed-stub', template: `들어왔다` })
class LandedStub {}

/** 주소가 담는 것은 접두어가 아니라 프로젝트의 식별자다(GT-60). */
const PROJECT = 'V1StGXR8_Z5j';

const routes: Routes = [
  { path: `projects/${PROJECT}/issues`, component: IssueListPage },
  { path: `projects/${PROJECT}/issues/:id`, component: LandedStub },
];

/*
 * 프로젝트를 세우는 덮개와 같은 규약을 잰다. 같은 규약을 쓰는 자리가 둘이므로 둘 다 지킨다 —
 * 하나만 지키면 다른 하나가 조용히 어긋난다.
 */
describe('IssueListPage 의 세우는 덮개', () => {
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
        IssueService,
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(async () => {
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => node.remove());
    // 검사가 끝난 뒤에 리소스가 한 번 더 실을 수 있다. 남은 것을 비우고 센다.
    await drain();
    httpTesting.verify();
  });

  /**
   * 실려 있는 요청을 비운다. 프로젝트가 실려야 작업 아이템의 주소가 만들어지므로 두 번 이상 돈다.
   *
   * <p>비우지 않으면 `whenStable()` 이 끝나지 않는다. Angular 가 실려 있는 HTTP 를 할 일로 세기
   * 때문이며, 검사에서는 아무도 그것을 끝내 주지 않는다.
   */
  async function drain(): Promise<void> {
    for (let round = 0; round < 4; round += 1) {
      // 실어 온 것이 신호에 앉는 것은 약속이 한 마디 나아간 뒤다. 기다리지 않으면 다음 요청이
      // 아직 나가지 않았다.
      await new Promise((resolve) => setTimeout(resolve));
      TestBed.tick();
      httpTesting
        .match({ url: ENDPOINTS.projects, method: 'GET' })
        .forEach((each) =>
          each.flush([{ id: PROJECT, name: 'gentask', key: 'GT', issueCount: 0 }]),
        );
      httpTesting
        .match({ url: ENDPOINTS.issues(PROJECT), method: 'GET' })
        .forEach((each) => each.flush([]));
    }
  }

  it('주소가 덮개를 가리키면 열린다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/projects/${PROJECT}/issues?new=1`);
    await drain();
    harness.detectChanges();

    expect(pane()?.textContent).toContain('새 작업 아이템');
  });

  it('주소에서 빠지면 걷힌다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/projects/${PROJECT}/issues?new=1`);
    await drain();
    harness.detectChanges();
    expect(pane()).not.toBeNull();

    // 뒤로가기로 덮개를 닫은 경우다. 주소가 먼저 돌아가고 덮개가 그것을 따라간다.
    await harness.navigateByUrl(`/projects/${PROJECT}/issues`);

    expect(pane()).toBeNull();
  });

  it('그만두면 주소에서 덮개가 빠진다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/projects/${PROJECT}/issues?new=1`);
    await drain();
    harness.detectChanges();

    await click('그만두기', harness);

    expect(TestBed.inject(Router).url).toBe(`/projects/${PROJECT}/issues`);
    expect(pane()).toBeNull();
  });

  it('세우면 세운 것으로 들어간다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/projects/${PROJECT}/issues?new=1`);
    await drain();
    harness.detectChanges();

    await type('적어 둔 것', harness);
    press('세우기');

    // 세운 것의 이름은 서버가 낸다. 화면이 접두어와 번호를 붙이지 않는다.
    httpTesting
      .expectOne({ url: ENDPOINTS.issues(PROJECT), method: 'POST' })
      .flush(null, {
        status: 201,
        statusText: 'Created',
        headers: { Location: `/api/v1/projects/${PROJECT}/issues/46` },
      });
    await settle(harness);

    httpTesting.expectOne({ url: ENDPOINTS.issue(PROJECT, 46), method: 'GET' }).flush(detail());
    await settle(harness);
    await drain();
    await settle(harness);

    expect(TestBed.inject(Router).url).toBe(`/projects/${PROJECT}/issues/GT-46`);
    expect(pane()).toBeNull();
  });
});

function pane(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-container .cdk-overlay-pane');
}

function detail(): object {
  return {
    summary: {
      id: 'i-1',
      key: 'GT-46',
      number: 46,
      kind: 'TASK',
      state: 'BACKLOG',
      title: '적어 둔 것',
      parentKey: null,
      dueDate: null,
      closedAt: null,
      childCount: 0,
      closedChildCount: 0,
      criteriaCount: 0,
      unverifiedCount: 0,
    },
    body: '',
    criteria: [],
    authorName: '고래밥',
    createdAt: '2026-09-01T00:00:00Z',
  };
}

/** 누르기만 하고 가라앉기를 기다리지 않는다. 나간 요청을 먼저 비워야 하기 때문이다. */
function press(label: string): void {
  const button = [...(pane()?.querySelectorAll('button') ?? [])].find((candidate) =>
    candidate.textContent?.includes(label),
  );
  expect(button, `덮개 안에서 '${label}' 를 찾지 못했습니다`).toBeDefined();
  button!.click();
}

/**
 * 약속이 한 마디 나아가게 두고 다시 그린다.
 *
 * <p>`whenStable()` 을 부르지 않는다. 실려 있는 HTTP 가 있으면 그것이 끝나지 않는데, 여기서는 아직
 * 비우지 않은 요청을 사이에 두고 나아가야 하기 때문이다.
 */
async function settle(harness: RouterTestingHarness): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  harness.detectChanges();
}

async function type(value: string, harness: RouterTestingHarness): Promise<void> {
  const input = pane()?.querySelector<HTMLInputElement>('input');
  expect(input, '덮개 안에서 적는 자리를 찾지 못했습니다').not.toBeNull();

  input!.value = value;
  input!.dispatchEvent(new Event('input'));

  // 세우기는 적은 것이 있을 때만 눌린다. 변경 감지를 돌려야 그 판정이 갱신된다.
  harness.detectChanges();
  await harness.fixture.whenStable();
}

async function click(label: string, harness: RouterTestingHarness): Promise<void> {
  const button = [...(pane()?.querySelectorAll('button') ?? [])].find((candidate) =>
    candidate.textContent?.includes(label),
  );
  expect(button, `덮개 안에서 '${label}' 를 찾지 못했습니다`).toBeDefined();

  button!.click();
  harness.detectChanges();
  await harness.fixture.whenStable();
}
