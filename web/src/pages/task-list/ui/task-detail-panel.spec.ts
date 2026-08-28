import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Task } from '@/entities/task';
import { TaskService } from '../api/task-service';
import { provideTaskListDatePicker } from '../providers';
import { TaskDetailPanel } from './task-detail-panel';
import { toast } from '@/shared/ui/sonner';

describe('TaskDetailPanel', () => {
  let update: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.spyOn>;
  let remove: ReturnType<typeof vi.fn>;
  let setMyDay: ReturnType<typeof vi.fn>;

  const seed: Task = {
    id: 'seed-1',
    title: '장 보기',
    createdAt: '2026-08-17T09:00:00.000Z',
    completedAt: null,
    note: '우유와 빵',
    dueDate: null,
    remindAt: null,
    important: false,
    myDayOn: null,
  };

  beforeEach(() => {
    update = vi.fn(async () => {});
    toastError = vi.spyOn(toast, 'error').mockImplementation(() => '' as never);
    remove = vi.fn(async () => {});
    setMyDay = vi.fn(async () => {});

    const taskService = {
      add: async () => {},
      setCompleted: async () => {},
      setImportant: async () => {},
      setMyDay,
      remove,
      update,
    } as unknown as TaskService;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TaskService, useValue: taskService },
        ...provideTaskListDatePicker(),
      ],
    });
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => node.remove());
  });

  function render(task: Task | undefined): ComponentFixture<TaskDetailPanel> {
    const fixture = TestBed.createComponent(TaskDetailPanel);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
    return fixture;
  }

  function query<T extends HTMLElement>(fixture: ComponentFixture<unknown>, selector: string): T {
    const found = (fixture.nativeElement as HTMLElement).querySelector<T>(selector);
    if (!found) throw new Error(`찾지 못했습니다: ${selector}`);
    return found;
  }

  function type(field: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  function timeOption(group: string, label: string): HTMLButtonElement {
    const container = [...document.querySelectorAll('.cdk-overlay-container')].at(-1);
    const column = [...(container?.querySelectorAll('[role="group"]') ?? [])].find(
      (candidate) => candidate.getAttribute('aria-label') === group,
    );
    const button = [...(column?.querySelectorAll('button') ?? [])].find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!button) throw new Error(`${group} 열에서 ${label} 을 찾지 못했습니다`);
    return button as HTMLButtonElement;
  }

  function dialogButton(label: string): HTMLButtonElement {
    const container = [...document.querySelectorAll('.cdk-overlay-container')].at(-1);
    const button = [...(container?.querySelectorAll('button') ?? [])].find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!button) throw new Error(`대화에서 ${label} 버튼을 찾지 못했습니다`);
    return button;
  }

  function myDayButton(fixture: ComponentFixture<TaskDetailPanel>): HTMLButtonElement {
    const found = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (button) => button.textContent?.includes('나의 하루'),
    );
    if (!found) throw new Error('나의 하루 버튼을 찾지 못했습니다');
    return found;
  }

  function today(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  function openConfirm(fixture: ComponentFixture<TaskDetailPanel>): void {
    query<HTMLButtonElement>(fixture, 'button[aria-label="작업 삭제"]').click();
    fixture.detectChanges();
  }

  it('TSK-003 S4: 없는 작업은 편집할 수 없다', () => {
    const fixture = render(undefined);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('찾을 수 없는 작업입니다');
    expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
  });

  it('대상의 현재 값으로 폼을 채운다', () => {
    const fixture = render(seed);

    expect(query<HTMLInputElement>(fixture, '#task-title').value).toBe('장 보기');
    expect(query<HTMLTextAreaElement>(fixture, '#task-note').value).toBe('우유와 빵');
  });

  it('저장 버튼을 두지 않는다', () => {
    const fixture = render(seed);

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]'),
    ).toBeNull();
  });

  it('TSK-003 S2: 편집한 메모가 그 작업에 보인다', async () => {
    const fixture = render(seed);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const note = query<HTMLTextAreaElement>(fixture, '#task-note');
    type(note, '두부도 사기');
    note.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(update).toHaveBeenCalledWith('seed-1', {
      title: '장 보기',
      note: '두부도 사기',
      dueDate: null,
      remindAt: null,
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('TSK-003 S1: 편집한 제목이 그 작업에 보인다', async () => {
    const fixture = render(seed);

    const title = query<HTMLInputElement>(fixture, '#task-title');
    type(title, '장 보기와 은행');
    title.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();

    expect(update).toHaveBeenCalledWith('seed-1', {
      title: '장 보기와 은행',
      note: '우유와 빵',
      dueDate: null,
      remindAt: null,
    });
  });

  it('값이 그대로면 반영하지 않는다', async () => {
    const fixture = render(seed);

    query<HTMLTextAreaElement>(fixture, '#task-note').dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(update).not.toHaveBeenCalled();
  });

  it('TSK-003 S1: 그만두면 편집하던 제목은 반영되지 않는다', async () => {
    const fixture = render(seed);

    const title = query<HTMLInputElement>(fixture, '#task-title');
    type(title, '장 보기와 은행');
    title.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    title.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(update).not.toHaveBeenCalled();
    expect(query<HTMLInputElement>(fixture, '#task-title').value).toBe('장 보기');
  });

  it('TSK-003 S4: 실패하면 이전 값이 남는다', async () => {
    update.mockRejectedValueOnce(new Error('저장소 없음'));
    const fixture = render(seed);

    const title = query<HTMLInputElement>(fixture, '#task-title');
    type(title, '장 보기와 은행');
    title.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(toastError).toHaveBeenCalled();
    expect(query<HTMLInputElement>(fixture, '#task-title').value).toBe('장 보기');
  });

  it('TSK-003 S1: 제목이 비면 값이 바뀌지 않는다', async () => {
    const fixture = render(seed);

    const title = query<HTMLInputElement>(fixture, '#task-title');
    type(title, '   ');
    title.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(update).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('제목을 입력해 주세요');
  });

  describe('TSK-005 S1: 확인하면 그 작업이 목록에 없다', () => {
    it('지우기를 눌러도 확인 전에는 지우지 않는다', () => {
      const fixture = render(seed);

      openConfirm(fixture);

      expect(remove).not.toHaveBeenCalled();
      const container = [...document.querySelectorAll('.cdk-overlay-container')].at(-1);
      expect(container?.textContent).toContain('장 보기');
      expect(container?.textContent).toContain('되돌릴 수 없습니다');
    });

    it('취소하면 지우지 않는다', async () => {
      const fixture = render(seed);

      openConfirm(fixture);
      dialogButton('취소').click();
      await fixture.whenStable();

      expect(remove).not.toHaveBeenCalled();
    });

    it('확인하면 지우고 패널을 닫는다', async () => {
      const fixture = render(seed);
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      openConfirm(fixture);
      dialogButton('삭제').click();
      await fixture.whenStable();

      expect(remove).toHaveBeenCalledWith('seed-1');
      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: { task: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  });

  describe('TSK-003 S2: 나의 하루에 추가된 상태가 정한 대로 남는다', () => {
    it('나의 하루에 담는다', async () => {
      const fixture = render(seed);
      const button = myDayButton(fixture);

      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.textContent?.trim()).toBe('나의 하루에 추가');

      button.click();
      await fixture.whenStable();

      expect(setMyDay).toHaveBeenCalledWith('seed-1', true);
    });

    it('나의 하루에 추가긴 항목은 빼는 자리가 된다', () => {
      const fixture = render({ ...seed, myDayOn: today() });

      expect(myDayButton(fixture).getAttribute('aria-pressed')).toBe('true');
      expect(myDayButton(fixture).textContent?.trim()).toBe('나의 하루에 추가됨');
    });

    it('어제 담긴 것은 오늘의 나의 하루가 아니다', () => {
      const fixture = render({ ...seed, myDayOn: '2020-01-01' });

      expect(myDayButton(fixture).getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('TSK-003 S2: 기한이 정한 대로 그 작업에 남는다', () => {
    it('기한이 있으면 그 날짜를 골라 둔 상태로 연다', () => {
      const fixture = render({ ...seed, dueDate: '2026-12-25' });

      const trigger = query<HTMLButtonElement>(fixture, '#task-due');
      expect(trigger.textContent?.trim()).toBe('12월 25일까지');
    });

    it('기한을 정하지 않았으면 지우기를 내보내지 않는다', () => {
      const fixture = render(seed);

      const buttons = Array.from(fixture.nativeElement.querySelectorAll('button'));
      expect(buttons.some((b) => (b as HTMLElement).textContent?.includes('지우기'))).toBe(false);
    });

    it('기한을 지우면 비운 값을 곧바로 반영한다', async () => {
      const fixture = render({ ...seed, dueDate: '2026-12-25' });

      const clear = Array.from(fixture.nativeElement.querySelectorAll('button')).find((b) =>
        (b as HTMLElement).textContent?.includes('기한 지우기'),
      ) as HTMLButtonElement;
      clear.click();
      await fixture.whenStable();

      expect(update).toHaveBeenCalledWith('seed-1', {
        title: '장 보기',
        note: '우유와 빵',
        dueDate: null,
        remindAt: null,
      });
    });
  });

  describe('TSK-003 S8: 미리 알림이 정한 대로 그 작업에 남는다', () => {
    it('미리 알림이 있으면 날짜와 시각을 트리거에 적는다', () => {
      const fixture = render({ ...seed, remindAt: '2026-12-25T15:30' });

      const trigger = query<HTMLButtonElement>(fixture, '#task-remind');
      expect(trigger.textContent?.trim()).toBe('알림 12월 25일 오후 3:30');
    });

    it('정하지 않았으면 트리거가 이름만 보인다', () => {
      const fixture = render(seed);

      expect(query<HTMLButtonElement>(fixture, '#task-remind').textContent?.trim()).toBe(
        '미리 알림',
      );
    });

    it('시를 고르면 나머지 축과 날짜를 지킨 채 반영한다', async () => {
      const fixture = render({ ...seed, remindAt: '2026-12-25T15:30' });

      query<HTMLButtonElement>(fixture, '#task-remind').click();
      await fixture.whenStable();

      timeOption('시', '7').click();
      await fixture.whenStable();

      expect(update).toHaveBeenCalledWith('seed-1', {
        title: '장 보기',
        note: '우유와 빵',
        dueDate: null,
        remindAt: '2026-12-25T19:30',
      });
    });

    it('오전으로 바꾸면 시와 분은 그대로다', async () => {
      const fixture = render({ ...seed, remindAt: '2026-12-25T15:30' });

      query<HTMLButtonElement>(fixture, '#task-remind').click();
      await fixture.whenStable();

      timeOption('오전 오후', '오전').click();
      await fixture.whenStable();

      expect(update).toHaveBeenCalledWith('seed-1', {
        title: '장 보기',
        note: '우유와 빵',
        dueDate: null,
        remindAt: '2026-12-25T03:30',
      });
    });

    it('분을 1분 단위로 고를 수 있다', async () => {
      const fixture = render({ ...seed, remindAt: '2026-12-25T15:30' });

      query<HTMLButtonElement>(fixture, '#task-remind').click();
      await fixture.whenStable();

      timeOption('분', '07').click();
      await fixture.whenStable();

      expect(update).toHaveBeenCalledWith('seed-1', {
        title: '장 보기',
        note: '우유와 빵',
        dueDate: null,
        remindAt: '2026-12-25T15:07',
      });
    });

    it('미리 알림을 지워도 기한은 남는다', async () => {
      const fixture = render({ ...seed, dueDate: '2026-12-25', remindAt: '2026-12-25T15:30' });

      const clear = Array.from(fixture.nativeElement.querySelectorAll('button')).find((b) =>
        (b as HTMLElement).textContent?.includes('미리 알림 지우기'),
      ) as HTMLButtonElement;
      clear.click();
      await fixture.whenStable();

      expect(update).toHaveBeenCalledWith('seed-1', {
        title: '장 보기',
        note: '우유와 빵',
        dueDate: '2026-12-25',
        remindAt: null,
      });
    });
  });
});
