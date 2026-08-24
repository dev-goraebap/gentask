import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Veil } from './veil';

describe('Veil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  afterEach(() => vi.useRealTimers());

  function create(): ComponentFixture<Veil> {
    const fixture = TestBed.createComponent(Veil);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();
    return fixture;
  }

  function setLoading(fixture: ComponentFixture<Veil>, loading: boolean): void {
    fixture.componentRef.setInput('loading', loading);
    fixture.detectChanges();
  }

  it('대기가 시작되면 지연 뒤에 뜬다', () => {
    const fixture = create();

    setLoading(fixture, true);
    expect(fixture.componentInstance.visible()).toBe(false);

    vi.advanceTimersByTime(200);
    expect(fixture.componentInstance.visible()).toBe(true);
  });

  it('지연 안에 끝나는 대기에는 뜨지 않는다', () => {
    const fixture = create();

    setLoading(fixture, true);
    vi.advanceTimersByTime(150);
    setLoading(fixture, false);

    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.visible()).toBe(false);
  });

  it('한 번 뜬 베일은 최소 시간을 채우고 걷힌다', () => {
    const fixture = create();

    setLoading(fixture, true);
    vi.advanceTimersByTime(200);
    expect(fixture.componentInstance.visible()).toBe(true);

    setLoading(fixture, false);
    vi.advanceTimersByTime(399);
    expect(fixture.componentInstance.visible()).toBe(true);

    vi.advanceTimersByTime(1);
    expect(fixture.componentInstance.visible()).toBe(false);
  });

  it('실패에는 최소 유지 시간을 적용하지 않고 즉시 걷는다', () => {
    const fixture = create();

    setLoading(fixture, true);
    vi.advanceTimersByTime(200);
    expect(fixture.componentInstance.visible()).toBe(true);

    fixture.componentRef.setInput('failed', true);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    expect(fixture.componentInstance.visible()).toBe(false);
  });
});
