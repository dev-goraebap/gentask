import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type Routes, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProjectService } from '@/entities/project';
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
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding()), ProjectService],
    });
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => node.remove());
  });

  it('주소가 덮개를 가리키면 열린다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/projects?new=1');

    expect(paneText()).toContain('새 프로젝트');
  });

  it('주소에서 빠지면 걷힌다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/projects?new=1');
    expect(pane()).not.toBeNull();

    // 뒤로가기로 덮개를 닫은 경우다. 주소가 먼저 돌아가고 덮개가 그것을 따라간다.
    await harness.navigateByUrl('/projects');

    expect(pane()).toBeNull();
  });

  it('그만두면 주소에서 덮개가 빠진다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/projects?new=1');

    await click('그만두기', harness);

    expect(TestBed.inject(Router).url).toBe('/projects');
    expect(pane()).toBeNull();
  });

  it('세우면 세운 것으로 들어간다', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/projects?new=1');

    await type('연습장 둘', harness);
    await click('세우기', harness);

    expect(TestBed.inject(Router).url).toMatch(/^\/projects\/[^/]+\/issues$/);
    expect(pane()).toBeNull();
  });
});

function pane(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-container .cdk-overlay-pane');
}

function paneText(): string {
  return pane()?.textContent ?? '';
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
