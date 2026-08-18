import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TASK_STORE, type Task, type TaskDraft, type TaskStore } from '@/entities/task';
import { TaskDetailPanel } from './task-detail-panel';

/*
 * 조건부 표시와 폼을 검증합니다. 대상이 없을 때의 분기, 검증 실패 시의 거부,
 * 저장 후의 이동이 이 화면의 계약입니다. 17-testing.md 3.1절.
 *
 * 제출은 이벤트 디스패치가 아니라 버튼 클릭으로 확인합니다. 디스패치는 브라우저 기본
 * 검증을 건너뛰어 novalidate 누락 같은 결함을 놓칩니다. 17-testing.md 3.3절.
 */
describe('TaskDetailPanel', () => {
  let tasks: ReturnType<typeof signal<readonly Task[]>>;
  let update: ReturnType<typeof vi.fn>;

  const seed: Task = {
    id: 'seed-1',
    title: '장 보기',
    createdAt: '2026-08-17T09:00:00.000Z',
    completedAt: null,
    note: '우유와 빵',
    dueDate: null,
  };

  beforeEach(() => {
    tasks = signal<readonly Task[]>([seed]);
    update = vi.fn(async () => {});

    const store: TaskStore = {
      tasks,
      add: async () => {},
      setCompleted: async () => {},
      remove: async () => {},
      restore: async () => {},
      update: update as unknown as (id: string, patch: TaskDraft) => Promise<void>,
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: TASK_STORE, useValue: store }],
    });
  });

  function render(id: string): ComponentFixture<TaskDetailPanel> {
    const fixture = TestBed.createComponent(TaskDetailPanel);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture;
  }

  function query<T extends HTMLElement>(fixture: ComponentFixture<unknown>, selector: string): T {
    const found = (fixture.nativeElement as HTMLElement).querySelector<T>(selector);
    if (!found) throw new Error(`찾지 못했습니다: ${selector}`);
    return found;
  }

  it('없는 식별자에는 안내와 돌아갈 길을 보여 준다', () => {
    const fixture = render('없는-값');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('찾을 수 없는 할 일입니다');
    expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
  });

  it('대상의 현재 값으로 폼을 채운다', () => {
    const fixture = render('seed-1');

    expect(query<HTMLInputElement>(fixture, '#task-title').value).toBe('장 보기');
    expect(query<HTMLTextAreaElement>(fixture, '#task-note').value).toBe('우유와 빵');
  });

  it('제목을 비우면 저장하지 않고 사유를 보여 준다', async () => {
    const fixture = render('seed-1');

    const title = query<HTMLInputElement>(fixture, '#task-title');
    title.value = '   ';
    title.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    query<HTMLButtonElement>(fixture, 'button[type="submit"]').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(update).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('제목을 입력해 주세요');
  });

  it('저장하면 고친 값을 넘기고 패널을 닫는다', async () => {
    const fixture = render('seed-1');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const note = query<HTMLTextAreaElement>(fixture, '#task-note');
    note.value = '두부도 사기';
    note.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    query<HTMLButtonElement>(fixture, 'button[type="submit"]').click();
    await fixture.whenStable();

    expect(update).toHaveBeenCalledWith('seed-1', {
      title: '장 보기',
      note: '두부도 사기',
      dueDate: null,
    });
    // 경로는 그대로 두고 쿼리 파라미터만 지웁니다. 목록이 곁에 남아 있어 돌아갈 곳이 없습니다.
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { task: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('3: 마감일이 있으면 그 날짜를 골라 둔 상태로 연다', () => {
    tasks.set([{ ...seed, dueDate: '2026-08-25' }]);
    const fixture = render('seed-1');

    // 트리거 버튼이 고른 날짜를 표기합니다. 정하지 않았을 때의 문구와 갈립니다.
    const trigger = query<HTMLButtonElement>(fixture, 'hlm-date-picker-trigger button');
    expect(trigger.textContent?.trim()).toBe('8월 25일');
  });

  it('3: 마감일을 정하지 않았으면 지우기를 내보내지 않는다', () => {
    const fixture = render('seed-1');

    // 지울 것이 없는 상태에서 지우기 버튼이 보이면 누를 수 있는 것이 무엇인지 모호해집니다.
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(buttons.some((b) => (b as HTMLElement).textContent?.includes('지우기'))).toBe(false);
  });

  it('3: 마감일을 지우면 비운 값을 넘긴다', async () => {
    tasks.set([{ ...seed, dueDate: '2026-08-25' }]);
    const fixture = render('seed-1');
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const clear = Array.from(fixture.nativeElement.querySelectorAll('button')).find((b) =>
      (b as HTMLElement).textContent?.includes('지우기'),
    ) as HTMLButtonElement;
    clear.click();
    fixture.detectChanges();

    query<HTMLButtonElement>(fixture, 'button[type="submit"]').click();
    await fixture.whenStable();

    expect(update).toHaveBeenCalledWith('seed-1', {
      title: '장 보기',
      note: '우유와 빵',
      dueDate: null,
    });
  });
});
