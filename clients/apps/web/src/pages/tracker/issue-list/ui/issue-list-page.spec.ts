import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type Routes, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IssueService } from '@/entities/issue';
import { ProjectService } from '@/entities/project';
import { IssueListPage } from './issue-list-page';

@Component({ selector: 'app-landed-stub', template: `들어왔다` })
class LandedStub {}

/** 목의 기본 프로젝트다. 주소가 그것을 가리켜야 프로젝트에 매인 주소가 만들어진다. */
const PROJECT = 'gentask';

const routes: Routes = [
  { path: `projects/${PROJECT}/issues`, component: IssueListPage },
  { path: `projects/${PROJECT}/issues/:id`, component: LandedStub },
];

/*
 * 프로젝트를 세우는 덮개와 같은 규약을 잰다. 같은 규약을 쓰는 자리가 둘이므로 둘 다 지킨다 —
 * 하나만 지키면 다른 하나가 조용히 어긋난다.
 */
describe('IssueListPage 의 세우는 덮개', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        ProjectService,
        IssueService,
      ],
    });
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => node.remove());
  });

  it('주소가 덮개를 가리키면 열린다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/projects/${PROJECT}/issues?new=1`);

    expect(pane()?.textContent).toContain('새 작업 아이템');
  });

  it('주소에서 빠지면 걷힌다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/projects/${PROJECT}/issues?new=1`);
    expect(pane()).not.toBeNull();

    // 뒤로가기로 덮개를 닫은 경우다. 주소가 먼저 돌아가고 덮개가 그것을 따라간다.
    await harness.navigateByUrl(`/projects/${PROJECT}/issues`);

    expect(pane()).toBeNull();
  });

  it('그만두면 주소에서 덮개가 빠진다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/projects/${PROJECT}/issues?new=1`);

    await click('그만두기', harness);

    expect(TestBed.inject(Router).url).toBe(`/projects/${PROJECT}/issues`);
    expect(pane()).toBeNull();
  });

  it('세우면 세운 것으로 들어간다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/projects/${PROJECT}/issues?new=1`);

    await type('적어 둔 것', harness);
    await click('세우기', harness);

    expect(TestBed.inject(Router).url).toMatch(
      new RegExp(`^/projects/${PROJECT}/issues/[^/]+$`),
    );
    expect(pane()).toBeNull();
  });
});

function pane(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-container .cdk-overlay-pane');
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
