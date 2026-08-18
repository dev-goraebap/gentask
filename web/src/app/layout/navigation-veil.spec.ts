import { TestBed } from '@angular/core/testing';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationVeil } from './navigation-veil';

/*
 * 베일의 시간 정책을 검증합니다.
 *
 * 경로가 바뀌면 베일이고 쿼리만 바뀌면 인디케이터라는 판정, 그리고 지연과 최소 유지가
 * 이 컴포넌트의 계약입니다. 규칙은 docs/architecture/references/10-loading.md 3.1절과 4절입니다.
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

  function create(): NavigationVeil {
    return TestBed.createComponent(NavigationVeil).componentInstance;
  }

  function start(url: string): void {
    events.next(new NavigationStart(1, url));
  }

  function end(url: string): void {
    currentUrl = url;
    events.next(new NavigationEnd(1, url, url));
  }

  it('경로가 바뀌면 지연 뒤에 뜬다', () => {
    const veil = create();

    start('/tasks/1');
    expect(veil.visible()).toBe(false);

    vi.advanceTimersByTime(200);
    expect(veil.visible()).toBe(true);
  });

  it('지연 안에 끝나는 전환에는 뜨지 않는다', () => {
    const veil = create();

    start('/tasks/1');
    vi.advanceTimersByTime(150);
    end('/tasks/1');

    vi.advanceTimersByTime(1000);
    expect(veil.visible()).toBe(false);
  });

  it('쿼리만 바뀌면 뜨지 않는다', () => {
    const veil = create();

    start('/tasks?done=1');
    vi.advanceTimersByTime(1000);

    expect(veil.visible()).toBe(false);
  });

  it('한 번 뜬 베일은 최소 시간을 채우고 걷힌다', () => {
    const veil = create();

    start('/tasks/1');
    vi.advanceTimersByTime(200);
    expect(veil.visible()).toBe(true);

    end('/tasks/1');
    vi.advanceTimersByTime(399);
    expect(veil.visible()).toBe(true);

    vi.advanceTimersByTime(1);
    expect(veil.visible()).toBe(false);
  });

  it('실패에는 최소 유지 시간을 적용하지 않고 즉시 걷는다', () => {
    const veil = create();

    start('/tasks/1');
    vi.advanceTimersByTime(200);
    expect(veil.visible()).toBe(true);

    events.next(new NavigationError(1, '/tasks/1', new Error('실패')));
    expect(veil.visible()).toBe(false);
  });

  it('취소된 전환도 최소 유지를 지키고 걷힌다', () => {
    const veil = create();

    start('/tasks/1');
    vi.advanceTimersByTime(200);

    events.next(new NavigationCancel(1, '/tasks/1', ''));
    vi.advanceTimersByTime(400);

    expect(veil.visible()).toBe(false);
  });
});
