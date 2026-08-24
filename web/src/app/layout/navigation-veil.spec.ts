import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationVeil } from './navigation-veil';

/*
 * 전환 판정을 검증합니다. 경로가 바뀌면 베일이고 쿼리만 바뀌면 인디케이터라는 판정이
 * 이 컴포넌트의 계약입니다. 규칙은 docs/architecture/references/10-loading.md 3.1절이며,
 * 지연과 최소 유지의 시간 정책은 베일 컴포넌트의 스펙이 갖습니다.
 *
 * 표시 여부를 클래스 선택자가 아니라 공개 신호로 확인합니다. 가림막은 의도적으로
 * 접근성 트리에서 숨겨져 역할도 이름도 갖지 않으므로 역할로 찾을 대상이 아니며,
 * 셸이 aria-busy 를 붙일 때 읽는 것도 이 신호입니다.
 */
describe('NavigationVeil', () => {
  let events: Subject<unknown>;
  let currentUrl: string;

  beforeEach(() => {
    vi.useFakeTimers();
    events = new Subject<unknown>();
    currentUrl = '/tasks';

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            events,
            get url() {
              return currentUrl;
            },
          },
        },
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  function create(): ComponentFixture<NavigationVeil> {
    const fixture = TestBed.createComponent(NavigationVeil);
    fixture.detectChanges();
    return fixture;
  }

  /** 라우터 이벤트는 신호를 바꿀 뿐이고, 베일에 닿는 것은 변경 감지가 입력을 옮긴 뒤입니다. */
  function emit(fixture: ComponentFixture<NavigationVeil>, event: unknown): void {
    events.next(event);
    fixture.detectChanges();
  }

  function start(fixture: ComponentFixture<NavigationVeil>, url: string): void {
    emit(fixture, new NavigationStart(1, url));
  }

  function end(fixture: ComponentFixture<NavigationVeil>, url: string): void {
    currentUrl = url;
    emit(fixture, new NavigationEnd(1, url, url));
  }

  it('경로가 바뀌면 지연 뒤에 뜬다', () => {
    const fixture = create();

    start(fixture, '/tasks/1');
    expect(fixture.componentInstance.visible()).toBe(false);

    vi.advanceTimersByTime(200);
    expect(fixture.componentInstance.visible()).toBe(true);
  });

  it('쿼리만 바뀌면 뜨지 않는다', () => {
    const fixture = create();

    start(fixture, '/tasks?done=1');
    vi.advanceTimersByTime(1000);

    expect(fixture.componentInstance.visible()).toBe(false);
  });

  it('전환이 끝나면 걷힌다', () => {
    const fixture = create();

    start(fixture, '/tasks/1');
    vi.advanceTimersByTime(200);
    expect(fixture.componentInstance.visible()).toBe(true);

    end(fixture, '/tasks/1');
    vi.advanceTimersByTime(400);
    expect(fixture.componentInstance.visible()).toBe(false);
  });

  it('실패에는 최소 유지 시간을 적용하지 않고 즉시 걷는다', () => {
    const fixture = create();

    start(fixture, '/tasks/1');
    vi.advanceTimersByTime(200);
    expect(fixture.componentInstance.visible()).toBe(true);

    emit(fixture, new NavigationError(1, '/tasks/1', new Error('실패')));
    expect(fixture.componentInstance.visible()).toBe(false);
  });

  it('취소된 전환도 최소 유지를 지키고 걷힌다', () => {
    const fixture = create();

    start(fixture, '/tasks/1');
    vi.advanceTimersByTime(200);

    emit(fixture, new NavigationCancel(1, '/tasks/1', ''));
    vi.advanceTimersByTime(400);

    expect(fixture.componentInstance.visible()).toBe(false);
  });
});
