import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationVeil } from './navigation-veil';

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
