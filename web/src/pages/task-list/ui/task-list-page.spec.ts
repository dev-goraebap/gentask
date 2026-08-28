import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toDateKey, type Task } from '@/entities/task';
import { TaskService } from '../api/task-service';
import { AsideSlotService } from '@/shared/lib';
import { provideTaskListDatePicker } from '../providers';
import { TaskListPage } from './task-list-page';
import { toast } from '@/shared/ui/sonner';

describe('TaskListPage', () => {
  let tasks: ReturnType<typeof signal<readonly Task[]>>;
  let status: ReturnType<typeof signal<'idle' | 'loading' | 'reloading' | 'resolved' | 'error'>>;
  let reload: ReturnType<typeof vi.fn>;
  let add: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.spyOn>;
  let setImportant: ReturnType<typeof vi.fn>;
  let setCompleted: ReturnType<typeof vi.fn>;

  const 장보기: Task = {
    id: 'seed-1',
    title: '장 보기',
    createdAt: '2026-08-17T09:00:00.000Z',
    completedAt: null,
    note: '',
    dueDate: null,
    remindAt: null,
    important: false,
    myDayOn: null,
  };

  const 전기요금: Task = {
    id: 'seed-2',
    title: '전기요금 납부',
    createdAt: '2026-08-17T10:30:00.000Z',
    completedAt: null,
    note: '',
    dueDate: '2026-08-25',
    remindAt: null,
    important: false,
    myDayOn: null,
  };

  const 건강검진: Task = {
    id: 'seed-3',
    title: '건강검진 예약',
    createdAt: '2026-08-15T11:00:00.000Z',
    completedAt: null,
    note: '',
    dueDate: '2026-08-14',
    remindAt: null,
    important: false,
    myDayOn: null,
  };

  beforeEach(() => {
    tasks = signal<readonly Task[]>([장보기, 전기요금, 건강검진]);
    status = signal<'idle' | 'loading' | 'reloading' | 'resolved' | 'error'>('resolved');
    reload = vi.fn();

    add = vi.fn(async () => {});
    setImportant = vi.fn(async () => {});
    setCompleted = vi.fn(async () => {});
    toastError = vi.spyOn(toast, 'error').mockImplementation(() => '' as never);

    const taskService = {
      list: tasks,
      status,
      reload,
      add,
      setCompleted,
      setImportant,
      setMyDay: async () => {},
      update: async () => {},
      remove: async () => {},
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

  function render(sort?: 'created' | 'due', view?: string): ComponentFixture<TaskListPage> {
    const fixture = TestBed.createComponent(TaskListPage);
    if (sort) fixture.componentRef.setInput('sort', sort);
    if (view) fixture.componentRef.setInput('view', view);
    fixture.detectChanges();
    return fixture;
  }

  function sortButton(fixture: ComponentFixture<TaskListPage>, label: string): HTMLButtonElement {
    const host = fixture.nativeElement as HTMLElement;
    const trigger = [...host.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === '정렬',
    );
    if (!trigger) throw new Error('정렬 버튼을 찾지 못했습니다');
    trigger.click();
    fixture.detectChanges();
    const group = document.querySelector('[role="group"][aria-label="정렬 기준"]');
    const button = [...(group?.querySelectorAll('button') ?? [])].find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!button) throw new Error(`${label} 버튼을 찾지 못했습니다`);
    return button;
  }

  function newTaskInput(fixture: ComponentFixture<TaskListPage>): HTMLInputElement {
    const found = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#new-task-title',
    );
    if (!found) throw new Error('입력란을 찾지 못했습니다');
    return found;
  }

  function pressEnter(field: HTMLInputElement, isComposing = false): void {
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing, bubbles: true }));
  }

  function pickQuick(fixture: ComponentFixture<TaskListPage>, id: string, label: string): void {
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      `#${id}`,
    );
    if (!trigger) throw new Error(`${id} 를 찾지 못했습니다`);
    trigger.click();
    fixture.detectChanges();

    const container = [...document.querySelectorAll('.cdk-overlay-container')].at(-1);
    const button = [...(container?.querySelectorAll('button') ?? [])].find((candidate) =>
      candidate.textContent?.trim().startsWith(label),
    );
    if (!button) throw new Error(`${label} 을 찾지 못했습니다`);
    (button as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  function titles(fixture: ComponentFixture<TaskListPage>): string[] {
    const host = fixture.nativeElement as HTMLElement;
    return [...host.querySelectorAll('ul li a')].map((a) => a.textContent?.trim() ?? '');
  }

  describe('TSK-001 S1: 제목을 적으면 목록에 그 작업이 있다', () => {
    it('등록 버튼을 두지 않고 엔터로 추가한다', async () => {
      const fixture = render();
      const input = newTaskInput(fixture);

      expect(
        (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]'),
      ).toBeNull();

      input.value = '우산 챙기기';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      pressEnter(input);
      await fixture.whenStable();
      TestBed.tick();

      expect(add).toHaveBeenCalledWith('우산 챙기기', {});
      expect(newTaskInput(fixture).value).toBe('');
    });

    it('조합 중의 엔터는 추가하지 않는다', async () => {
      const fixture = render();
      const input = newTaskInput(fixture);

      input.value = '우산';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      pressEnter(input, true);
      await fixture.whenStable();

      expect(add).not.toHaveBeenCalled();
    });
  });

  describe('TSK-001 S1: 제목이 비면 목록에 들어가지 않는다', () => {
    it('공백만 적으면 추가하지 않고 아무것도 알리지 않는다', async () => {
      const fixture = render();
      const input = newTaskInput(fixture);

      input.value = '   ';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      pressEnter(input);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(add).not.toHaveBeenCalled();
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('입력해 주세요');
    });

    it('적는 자리에는 검증 표시를 두지 않는다', () => {
      const fixture = render();

      expect(newTaskInput(fixture).getAttribute('data-matches-spartan-invalid')).not.toBe('true');
      expect((fixture.nativeElement as HTMLElement).querySelector('hlm-field-error')).toBeNull();
    });
  });

  it('목록 행에는 지우기 버튼을 두지 않는다', () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    const labels = [...host.querySelectorAll('button')].map((button) =>
      button.getAttribute('aria-label'),
    );
    expect(labels.some((label) => label?.includes('지우기'))).toBe(false);
  });

  it('TSK-002 S2: 중요하다고 표시한 완료되지 않은 작업만 보인다', () => {
    tasks.set([{ ...장보기, important: true }, 전기요금, 건강검진]);

    expect(titles(render(undefined, 'important'))).toEqual(['장 보기']);
  });

  it('TSK-002 S2: 기한이 있는 완료되지 않은 작업만 보인다', () => {
    tasks.set([장보기, 전기요금, { ...건강검진, completedAt: '2026-08-18T00:00:00.000Z' }]);

    expect(titles(render(undefined, 'planned'))).toEqual(['전기요금 납부']);
  });

  it('TSK-002 S1: 모르는 스마트 목록을 요청하면 완료되지 않은 작업 목록이 보인다', () => {
    expect(titles(render(undefined, '없는-관점')).length).toBe(3);
  });

  it('조회가 끝나기 전에는 빈 안내를 내지 않는다', () => {
    tasks.set([]);
    status.set('loading');

    expect((render().nativeElement as HTMLElement).textContent).not.toContain('작업이 없습니다');
  });

  it('조회에 실패하면 빈 목록이 아니라 실패와 재시도 수단이 보인다', () => {
    tasks.set([]);
    status.set('error');
    const host = render().nativeElement as HTMLElement;

    expect(host.textContent).toContain('목록을 불러오지 못했습니다');
    expect(host.textContent).not.toContain('작업이 없습니다');

    const retry = [...host.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '다시 시도',
    );
    retry?.click();
    expect(reload).toHaveBeenCalled();
  });

  it('제목이 관점의 이름을 따른다', () => {
    const host = render(undefined, 'my-day').nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('나의 하루');
  });

  describe('TSK-001 S2: 적으면서 기한과 미리 알림을 붙인다', () => {
    it('기한을 고르고 적으면 그 기한이 붙은 채로 넘어간다', async () => {
      const fixture = render();

      pickQuick(fixture, 'new-task-due', '오늘');

      const input = newTaskInput(fixture);
      input.value = '우산 챙기기';
      input.dispatchEvent(new Event('input'));
      pressEnter(input);
      await fixture.whenStable();

      expect(add).toHaveBeenCalledWith('우산 챙기기', { dueDate: toDateKey(new Date()) });
    });

    it('미리 알림을 고르고 적으면 시각까지 붙은 채로 넘어간다', async () => {
      const fixture = render();

      pickQuick(fixture, 'new-task-remind', '내일');

      const input = newTaskInput(fixture);
      input.value = '약 먹기';
      input.dispatchEvent(new Event('input'));
      pressEnter(input);
      await fixture.whenStable();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(add).toHaveBeenCalledWith('약 먹기', {
        remindAt: `${toDateKey(tomorrow)}T09:00`,
      });
    });

    it('적고 나면 붙였던 값이 남지 않는다', async () => {
      const fixture = render();

      pickQuick(fixture, 'new-task-due', '오늘');

      const input = newTaskInput(fixture);
      input.value = '첫 번째';
      input.dispatchEvent(new Event('input'));
      pressEnter(input);
      await fixture.whenStable();

      input.value = '두 번째';
      input.dispatchEvent(new Event('input'));
      pressEnter(input);
      await fixture.whenStable();

      expect(add).toHaveBeenLastCalledWith('두 번째', {});
    });

    it('관점이 주는 기한보다 고른 기한이 이긴다', async () => {
      const fixture = render(undefined, 'planned');

      pickQuick(fixture, 'new-task-due', '내일');

      const input = newTaskInput(fixture);
      input.value = '내일 할 것';
      input.dispatchEvent(new Event('input'));
      pressEnter(input);
      await fixture.whenStable();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(add).toHaveBeenCalledWith('내일 할 것', { dueDate: toDateKey(tomorrow) });
    });
  });

  it('TSK-001 S1: 스마트 목록을 보며 적으면 그 스마트 목록의 성질이 붙은 채로 목록에 남는다', async () => {
    const fixture = render(undefined, 'important');
    const input = newTaskInput(fixture);

    input.value = '지금 급한 것';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    pressEnter(input);
    await fixture.whenStable();

    expect(add).toHaveBeenCalledWith('지금 급한 것', { important: true });
  });

  it('TSK-003 S2: 중요 표시가 정한 대로 남는다', async () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;
    const star = [...host.querySelectorAll('button')].find(
      (button) => button.getAttribute('aria-label') === '장 보기 중요 표시',
    );

    expect(star?.getAttribute('aria-pressed')).toBe('false');

    star?.click();
    await fixture.whenStable();

    expect(setImportant).toHaveBeenCalledWith('seed-1', true);
  });

  it('TSK-004 S1: 완료하면 완료되지 않은 작업 목록에서 사라지고 완료된 작업로 남는다', async () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;
    const box = host.querySelector<HTMLElement>('li [role="checkbox"]');

    box?.click();
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(setCompleted).toHaveBeenCalledWith('seed-2', true);
  });

  it('TSK-004 S1: 되돌리면 완료되지 않은 작업으로 다시 보인다', async () => {
    tasks.set([{ ...장보기, completedAt: '2026-08-18T00:00:00.000Z' }, 전기요금, 건강검진]);
    const fixture = TestBed.createComponent(TaskListPage);
    fixture.componentRef.setInput('done', true);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    const active = [...host.querySelectorAll('ul:not(#completed-tasks) li a')].map((a) =>
      a.textContent?.trim(),
    );
    expect(active).not.toContain('장 보기');
    host.querySelector<HTMLElement>('#completed-tasks [role="checkbox"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(setCompleted).toHaveBeenCalledWith('seed-1', false);
  });

  it('TSK-001 S3: 넣기에 실패하면 목록에 없고, 기존 작업은 남는다', async () => {
    add.mockRejectedValueOnce(new Error('저장소 없음'));
    const fixture = render();
    const input = newTaskInput(fixture);

    input.value = '우산 챙기기';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    pressEnter(input);
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(titles(fixture)).toEqual(['전기요금 납부', '장 보기', '건강검진 예약']);
    expect(toastError).toHaveBeenCalled();
    expect(newTaskInput(fixture).value).toBe('우산 챙기기');
  });

  it('TSK-004 S2: 실패하면 완료 전과 같다', async () => {
    setCompleted.mockImplementationOnce(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('저장소 없음')))),
    );
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;
    const box = host.querySelector<HTMLElement>('li [role="checkbox"]')!;

    box.click();
    fixture.detectChanges();
    expect(box.getAttribute('aria-checked')).toBe('true');

    await new Promise((resolve) => setTimeout(resolve, 300));
    fixture.detectChanges();

    expect(toastError).toHaveBeenCalled();
    expect(box.getAttribute('aria-checked')).toBe('false');
    expect(titles(fixture)).toContain('전기요금 납부');
  });

  it('기본 정렬에는 칩이 없고, 고르면 칩이 그 기준을 보여 준다', () => {
    expect((render().nativeElement as HTMLElement).textContent).not.toContain('로 정렬');

    const fixture = render('due');
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('기한으로 정렬');

    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    host.querySelector<HTMLButtonElement>('button[aria-label="정렬 해제"]')?.click();
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { sort: null, dir: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('고른 정렬 기준을 aria-pressed 로 알린다', () => {
    const fixture = render();

    expect(sortButton(fixture, '만든 날짜').getAttribute('aria-pressed')).toBe('true');
    expect(sortButton(fixture, '기한').getAttribute('aria-pressed')).toBe('false');
  });

  it('TSK-002 S3: 같은 기준을 다시 고르면 방향이 뒤집힌다', () => {
    const fixture = render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    sortButton(fixture, '만든 날짜').click();
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { sort: 'created', dir: 'asc' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    sortButton(fixture, '기한').click();
    expect(navigate).toHaveBeenLastCalledWith([], {
      queryParams: { sort: 'due', dir: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('기본 정렬은 최근에 적은 것이 위로 온다', () => {
    expect(titles(render())).toEqual(['전기요금 납부', '장 보기', '건강검진 예약']);
  });

  it('TSK-002 S3: 기한을 고르면 기한이 가까운 것부터 보이고 없는 것은 뒤다', () => {
    expect(titles(render('due'))).toEqual(['건강검진 예약', '전기요금 납부', '장 보기']);
  });

  it('제목은 패널을 여는 링크이며 경로를 바꾸지 않는다', () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;
    const link = host.querySelector<HTMLAnchorElement>('#task-seed-1');

    expect(link?.getAttribute('href')).toBe('/tasks/all?task=seed-1');
  });

  it('열린 항목이 없으면 aside 슬롯을 채우지 않는다', () => {
    render();

    expect(TestBed.inject(AsideSlotService).content()).toBeNull();
  });

  it('열린 항목이 있으면 aside 슬롯을 채운다', () => {
    const fixture = TestBed.createComponent(TaskListPage);
    fixture.componentRef.setInput('task', 'seed-1');
    fixture.detectChanges();

    expect(TestBed.inject(AsideSlotService).content()).not.toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-task-detail-panel'),
    ).toBeNull();
  });

  it('열린 항목이 사라지면 슬롯을 거둔다', () => {
    const fixture = TestBed.createComponent(TaskListPage);
    fixture.componentRef.setInput('task', 'seed-1');
    fixture.detectChanges();
    fixture.componentRef.setInput('task', undefined);
    fixture.detectChanges();

    expect(TestBed.inject(AsideSlotService).content()).toBeNull();
  });
});
