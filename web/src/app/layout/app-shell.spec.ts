import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { UserService } from '@/entities/user';
import { AsideSlotService } from '@/shared/lib';
import { AppShell } from './app-shell';

const userServiceStub = {
  me: signal(undefined),
  status: signal('idle' as const),
  reload: () => {},
} as unknown as UserService;

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
      providers: [provideRouter([]), { provide: UserService, useValue: userServiceStub }],
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

    TestBed.inject(AsideSlotService).set(fixture.componentInstance.panel());
    fixture.detectChanges();

    const aside = (fixture.nativeElement as HTMLElement).querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside?.textContent).toContain('패널 내용');
  });

  it('슬롯을 거두면 aside 를 걷어낸다', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const slot = TestBed.inject(AsideSlotService);
    const panel = fixture.componentInstance.panel();
    slot.set(panel);
    fixture.detectChanges();

    slot.clear(panel);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('aside')).toBeNull();
  });

  it('헤더는 aside 밖이 아니라 본문과 같은 열에 있다', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    TestBed.inject(AsideSlotService).set(fixture.componentInstance.panel());
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
      providers: [provideRouter([]), { provide: UserService, useValue: userServiceStub }],
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
    expect(host.querySelector('nav')?.className).toContain('md:w-64');
  });

  it('누르면 접히고 항목은 이름을 속성으로 갖는다', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    toggle(host).click();
    fixture.detectChanges();

    expect(toggle(host).getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('nav')?.className).toContain('md:w-14');
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
