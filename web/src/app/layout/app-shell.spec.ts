import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CurrentUser } from '@/entities/user';
import { AsideSlot } from '@/shared/lib';
import { AppShell } from './app-shell';

/** 셸은 라우트 스코프의 CurrentUser 를 읽습니다. 여기서는 사본이 아직 없는 상태로 둡니다. */
const currentUserStub = {
  me: signal(undefined),
  status: signal('idle' as const),
  reload: () => {},
} as unknown as CurrentUser;

/*
 * 셸이 aside 슬롯을 어떻게 다루는지 고정합니다. 슬롯이 비면 그리지 않고, 차면 헤더와
 * 본문을 담은 열 옆에 나란히 둡니다. 06-layout.md 3.3절.
 *
 * 등장·퇴장 효과 자체는 여기서 검증하지 않습니다. jsdom 에는 CSS 애니메이션이 없어
 * 시간에 따른 값 변화를 재현할 수 없으며, 그 확인은 실제 브라우저의 몫입니다.
 * 17-testing.md 2.2절이 정한 "우리가 만들지 않은 것"의 경계와 같은 이유입니다.
 */
@Component({
  selector: 'app-host',
  imports: [AppShell],
  template: `
    <app-shell />
    <ng-template #panel><p>패널 내용</p></ng-template>
  `,
})
class Host {
  readonly panel = viewChild.required<TemplateRef<unknown>>('panel');
}

describe('AppShell 의 aside 슬롯', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CurrentUser, useValue: currentUserStub }],
    });
  });

  it('슬롯이 비면 aside 를 그리지 않는다', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('aside')).toBeNull();
  });

  it('슬롯이 차면 aside 에 그 내용을 싣는다', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    TestBed.inject(AsideSlot).set(fixture.componentInstance.panel());
    fixture.detectChanges();

    const aside = (fixture.nativeElement as HTMLElement).querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside?.textContent).toContain('패널 내용');
  });

  it('슬롯을 거두면 aside 를 걷어낸다', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const slot = TestBed.inject(AsideSlot);
    const panel = fixture.componentInstance.panel();
    slot.set(panel);
    fixture.detectChanges();

    slot.clear(panel);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('aside')).toBeNull();
  });

  it('헤더는 aside 밖이 아니라 본문과 같은 열에 있다', () => {
    // 헤더가 aside 의 형제로 남으면 상단 바만 전폭으로 남아 밀리지 않습니다.
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    TestBed.inject(AsideSlot).set(fixture.componentInstance.panel());
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const header = host.querySelector('header');
    const aside = host.querySelector('aside');
    expect(header?.parentElement).not.toBe(aside?.parentElement);
    expect(header?.parentElement?.contains(host.querySelector('main'))).toBe(true);
  });
});

describe('AppShell 의 사이드바 접기', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CurrentUser, useValue: currentUserStub }],
    });
  });

  function toggle(host: HTMLElement): HTMLButtonElement {
    const found = host.querySelector<HTMLButtonElement>('button[aria-controls="sidebar"]');
    if (!found) throw new Error('접기 버튼을 찾지 못했습니다');
    return found;
  }

  it('기본은 펼친 상태이며 버튼이 그것을 알린다', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(toggle(host).getAttribute('aria-expanded')).toBe('true');
    expect(toggle(host).getAttribute('aria-label')).toBe('사이드바 접기');
    expect(host.querySelector('nav')?.className).toContain('md:w-56');
  });

  it('누르면 접히고 항목은 이름을 속성으로 갖는다', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    toggle(host).click();
    fixture.detectChanges();

    expect(toggle(host).getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('nav')?.className).toContain('md:w-14');
    // 이름이 보이지 않는 동안에도 링크는 이름을 가져야 합니다.
    const link = host.querySelector('nav a[aria-label]');
    expect(link?.getAttribute('aria-label')).toBeTruthy();
  });

  it('접은 선택은 다음 세션에서 복원된다', () => {
    localStorage.setItem('sidebar', 'collapsed');

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(toggle(host).getAttribute('aria-expanded')).toBe('false');
  });
});
