import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type Routes, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProjectService } from '@/entities/project';
import { ENDPOINTS } from '@/shared/api';
import { ProjectListPage } from './project-list-page';

@Component({ selector: 'app-landed-stub', template: `들어왔다` })
class LandedStub {}

const routes: Routes = [
  { path: 'projects', component: ProjectListPage },
  { path: 'projects/:projectId/issues', component: LandedStub },
];

/*
 * 덮개의 여닫는 규약을 재는 검사다. 눈으로 보면 통과하는데 틀려 있는 종류라 검사가 필요하다 —
 * 주소가 열림의 진실이어야 새로고침과 뒤로가기와 주소 건네기가 성립한다(FE-STY-180~183).
 *
 * <p>덮개를 오버레이 판 안에서 찾는다. 문서 전체에서 찾으면 내용이 화면 안에 남아 판이 비는 어긋남을
 * 놓친다(FE-STY-185).
 */
describe('ProjectListPage 의 세우는 덮개', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes, withComponentInputBinding()),
        ProjectService,
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
   * 실려 있는 요청을 비운다.
   *
   * <p>비우지 않으면 `whenStable()` 이 끝나지 않는다. Angular 가 실려 있는 HTTP 를 할 일로 세기
   * 때문이며, 검사에서는 아무도 그것을 끝내 주지 않는다.
   */
  async function drain(): Promise<void> {
    for (let round = 0; round < 4; round += 1) {
      await new Promise((resolve) => setTimeout(resolve));
      TestBed.tick();
      httpTesting
        .match({ url: ENDPOINTS.projects, method: 'GET' })
        .forEach((each) => each.flush([{ id: 'p-1', name: 'gentask', key: 'TG', issueCount: 0 }]));
    }
  }

  it('주소가 덮개를 가리키면 열린다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/projects?new=1');
    await drain();

    expect(paneText()).toContain('새 프로젝트');
  });

  it('주소에서 빠지면 걷힌다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/projects?new=1');
    await drain();
    expect(pane()).not.toBeNull();

    // 뒤로가기로 덮개를 닫은 경우다. 주소가 먼저 돌아가고 덮개가 그것을 따라간다.
    await harness.navigateByUrl('/projects');

    expect(pane()).toBeNull();
  });

  it('그만두면 주소에서 덮개가 빠진다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/projects?new=1');
    await drain();

    await click('그만두기', harness);

    expect(TestBed.inject(Router).url).toBe('/projects');
    expect(pane()).toBeNull();
  });

  it('세우면 세운 것으로 들어간다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/projects?new=1');
    await drain();

    await type('연습장 둘', harness);
    press('세우기');

    // 접두어는 서버가 이름에서 뽑아 Location 으로 낸다. 화면은 그 값으로 옮긴다.
    httpTesting
      .expectOne({ url: ENDPOINTS.projects, method: 'POST' })
      .flush(null, { status: 201, statusText: 'Created', headers: { Location: '/api/v1/projects/SB' } });
    await settle(harness);
    await drain();
    await settle(harness);

    expect(TestBed.inject(Router).url).toBe('/projects/SB/issues');
    expect(pane()).toBeNull();
  });
});

function pane(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-container .cdk-overlay-pane');
}

function paneText(): string {
  return pane()?.textContent ?? '';
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
