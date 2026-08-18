import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TASK_STORE, type Task, type TaskStore } from '@/entities/task';
import { TaskListPage } from './task-list.page';

/*
 * 요구사항 4 의 계약을 고정합니다. 지우면 목록에서 빠지고, 되돌리면 원래 자리로
 * 돌아옵니다. 17-testing.md 3.1절.
 *
 * 요소는 역할과 접근 가능한 이름으로 찾습니다. 지우기 버튼이 여러 줄에 같은 모양으로
 * 놓이므로 이름이 어느 항목의 것인지 구별하지 못하면 사용자도 구별하지 못합니다.
 * 17-testing.md 3.4절.
 */
describe('TaskListPage', () => {
  let tasks: ReturnType<typeof signal<readonly Task[]>>;
  let remove: ReturnType<typeof vi.fn>;
  let store: TaskStore;

  const 장보기: Task = {
    id: 'seed-1',
    title: '장 보기',
    createdAt: '2026-08-17T09:00:00.000Z',
    completedAt: null,
    note: '',
    dueDate: null,
  };

  const 전기요금: Task = {
    id: 'seed-2',
    title: '전기요금 납부',
    createdAt: '2026-08-17T10:30:00.000Z',
    completedAt: null,
    note: '',
    dueDate: '2026-08-25',
  };

  const 건강검진: Task = {
    id: 'seed-3',
    title: '건강검진 예약',
    createdAt: '2026-08-15T11:00:00.000Z',
    completedAt: null,
    note: '',
    dueDate: '2026-08-14',
  };

  beforeEach(() => {
    tasks = signal<readonly Task[]>([장보기, 전기요금, 건강검진]);

    remove = vi.fn(async (id: string) => {
      tasks.update((current) => current.filter((task) => task.id !== id));
    });
    store = {
      tasks,
      add: async () => {},
      setCompleted: async () => {},
      update: async () => {},
      remove: remove as unknown as (id: string) => Promise<void>,
      restore: async (task: Task) => {
        tasks.update((current) => [...current, task]);
      },
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: TASK_STORE, useValue: store }],
    });
  });

  function render(sort?: 'created' | 'due'): ComponentFixture<TaskListPage> {
    const fixture = TestBed.createComponent(TaskListPage);
    if (sort) fixture.componentRef.setInput('sort', sort);
    fixture.detectChanges();
    return fixture;
  }

  function sortButton(fixture: ComponentFixture<TaskListPage>, label: string): HTMLButtonElement {
    const host = fixture.nativeElement as HTMLElement;
    const group = host.querySelector('[role="group"][aria-label="정렬 기준"]');
    const button = [...(group?.querySelectorAll('button') ?? [])].find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!button) throw new Error(`${label} 버튼을 찾지 못했습니다`);
    return button;
  }

  function titles(fixture: ComponentFixture<TaskListPage>): string[] {
    const host = fixture.nativeElement as HTMLElement;
    return [...host.querySelectorAll('ul li a')].map((a) => a.textContent?.trim() ?? '');
  }

  function deleteButton(fixture: ComponentFixture<TaskListPage>, title: string): HTMLButtonElement {
    const host = fixture.nativeElement as HTMLElement;
    const button = [...host.querySelectorAll('button')].find(
      (candidate) => candidate.getAttribute('aria-label') === `${title} 지우기`,
    );
    if (!button) throw new Error(`${title} 의 지우기 버튼을 찾지 못했습니다`);
    return button;
  }

  it('항목마다 그 항목을 가리키는 이름의 지우기 버튼을 둔다', () => {
    const fixture = render();

    expect(deleteButton(fixture, '장 보기')).toBeTruthy();
    expect(deleteButton(fixture, '전기요금 납부')).toBeTruthy();
  });

  it('지우면 목록에서 빠진다', async () => {
    const fixture = render();

    deleteButton(fixture, '장 보기').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(remove).toHaveBeenCalledWith('seed-1');
    expect(titles(fixture)).toEqual(['전기요금 납부', '건강검진 예약']);
  });

  it('고른 정렬 기준을 aria-pressed 로 알린다', () => {
    const fixture = render();

    // 색만으로 알리면 색각 이상과 흑백 출력에서 전달되지 않습니다. 13-accessibility.md 4절.
    expect(sortButton(fixture, '추가순').getAttribute('aria-pressed')).toBe('true');
    expect(sortButton(fixture, '마감일순').getAttribute('aria-pressed')).toBe('false');
  });

  it('기본 정렬은 최근에 적은 것이 위로 온다', () => {
    expect(titles(render())).toEqual(['전기요금 납부', '장 보기', '건강검진 예약']);
  });

  it('마감일순은 가까운 것이 위로 오고 정하지 않은 것이 뒤로 간다', () => {
    expect(titles(render('due'))).toEqual(['건강검진 예약', '전기요금 납부', '장 보기']);
  });

  it('제목은 패널을 여는 링크이며 경로를 바꾸지 않는다', () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;
    const link = host.querySelector<HTMLAnchorElement>('#task-seed-1');

    // 경로가 바뀌면 라우터가 목록을 언마운트해 곁에 둘 수 없습니다. 부록 A.
    expect(link?.getAttribute('href')).toBe('/tasks?task=seed-1');
  });

  it('열린 항목이 없으면 패널을 그리지 않는다', () => {
    const host = render().nativeElement as HTMLElement;

    expect(host.querySelector('app-task-detail-panel')).toBeNull();
  });

  it('열린 항목이 있으면 그 항목의 패널을 그린다', () => {
    const fixture = TestBed.createComponent(TaskListPage);
    fixture.componentRef.setInput('task', 'seed-1');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('app-task-detail-panel')).not.toBeNull();
    expect(host.querySelector<HTMLInputElement>('#task-title')?.value).toBe('장 보기');
  });

  it('되돌리면 원래 자리로 돌아온다', async () => {
    const fixture = render();
    const before = titles(fixture);

    deleteButton(fixture, '장 보기').click();
    await fixture.whenStable();

    // 화면이 안내에 실어 보내는 값입니다. 저장소가 아니라 화면이 들고 있습니다.
    await store.restore(장보기);
    fixture.detectChanges();

    // 자리는 createdAt 이 정하므로 되살린 순서와 무관하게 원래 위치로 돌아옵니다.
    expect(titles(fixture)).toEqual(before);
  });
});
