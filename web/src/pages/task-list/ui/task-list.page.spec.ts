import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TASK_STORE, type Task, type TaskStore } from '@/entities/task';
import { AsideSlot } from '@/shared/lib';
import { TaskListPage } from './task-list.page';
import { toast } from '@/shared/ui/sonner';

/*
 * 목록의 계약을 고정합니다. 정렬 순서와 aside 슬롯의 채움·거둠이 이 화면의 몫입니다.
 * 17-testing.md 3.1절.
 *
 * 지우기는 이 화면의 계약이 아닙니다. 상세 패널이 확인 대화와 함께 소유하므로 여기서는
 * 목록에 그 버튼이 없다는 것만 고정합니다.
 */
describe('TaskListPage', () => {
  let tasks: ReturnType<typeof signal<readonly Task[]>>;
  let add: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.spyOn>;
  let setImportant: ReturnType<typeof vi.fn>;
  let setCompleted: ReturnType<typeof vi.fn>;
  let store: TaskStore;

  const 장보기: Task = {
    id: 'seed-1',
    title: '장 보기',
    createdAt: '2026-08-17T09:00:00.000Z',
    completedAt: null,
    note: '',
    dueDate: null,
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
    important: false,
    myDayOn: null,
  };

  beforeEach(() => {
    tasks = signal<readonly Task[]>([장보기, 전기요금, 건강검진]);

    add = vi.fn(async () => {});
    setImportant = vi.fn(async () => {});
    setCompleted = vi.fn(async () => {});
    toastError = vi.spyOn(toast, 'error').mockImplementation(() => '' as never);
    store = {
      tasks,
      add: add as unknown as (title: string) => Promise<void>,
      setCompleted: setCompleted as unknown as (id: string, completed: boolean) => Promise<void>,
      setImportant: setImportant as unknown as (id: string, important: boolean) => Promise<void>,
      setMyDay: async () => {},
      update: async () => {},
      remove: async () => {},
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: TASK_STORE, useValue: store }],
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

  /** 정렬 메뉴를 열고 그 안의 기준 버튼을 돌려줍니다. 메뉴는 오버레이에 뜹니다. */
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

  function titles(fixture: ComponentFixture<TaskListPage>): string[] {
    const host = fixture.nativeElement as HTMLElement;
    return [...host.querySelectorAll('ul li a')].map((a) => a.textContent?.trim() ?? '');
  }

  describe('TK-001 S1: 제목을 적으면 목록에 그 작업이 있다', () => {
    it('등록 버튼을 두지 않고 엔터로 추가한다', async () => {
      const fixture = render();
      const input = newTaskInput(fixture);

      // 연달아 적는 동안 손이 입력란과 버튼을 왕복하지 않게 합니다.
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]'),
      ).toBeNull();

      input.value = '우산 챙기기';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      pressEnter(input);
      await fixture.whenStable();
      TestBed.tick();

      // 전체 관점에는 부여할 성질이 없으므로 씨앗이 비어 있습니다.
      expect(add).toHaveBeenCalledWith('우산 챙기기', {});
      // 추가에 성공하면 입력란을 비워 다음 항목을 이어 적을 수 있게 합니다.
      expect(newTaskInput(fixture).value).toBe('');
    });

    it('조합 중의 엔터는 추가하지 않는다', async () => {
      const fixture = render();
      const input = newTaskInput(fixture);

      input.value = '우산';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // 한글은 마지막 글자를 조합한 채 엔터로 확정합니다. 그것을 추가로 받으면 안 됩니다.
      pressEnter(input, true);
      await fixture.whenStable();

      expect(add).not.toHaveBeenCalled();
    });
  });

  describe('TK-001 S1: 제목이 비면 목록에 들어가지 않는다', () => {
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

      /*
       * 이 자리는 대부분 비어 있고, 비어 있는 것은 잘못이 아니라 아직 적지 않은 상태입니다.
       * 붉은 테두리가 상시 걸리면 평상시의 모습이 오류가 됩니다.
       */
      expect(newTaskInput(fixture).getAttribute('data-matches-spartan-invalid')).not.toBe('true');
      expect((fixture.nativeElement as HTMLElement).querySelector('hlm-field-error')).toBeNull();
    });
  });

  it('목록 행에는 지우기 버튼을 두지 않는다', () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;

    // 파괴적 조작이 줄마다 상시 노출되면 오조작의 기회가 줄 수만큼 늘어납니다.
    const labels = [...host.querySelectorAll('button')].map((button) =>
      button.getAttribute('aria-label'),
    );
    expect(labels.some((label) => label?.includes('지우기'))).toBe(false);
  });

  it('TK-002 S2: 중요하다고 표시한 완료되지 않은 작업만 보인다', () => {
    tasks.set([{ ...장보기, important: true }, 전기요금, 건강검진]);

    // 한 항목이 여러 관점에 동시에 나타납니다. 관점은 고르기만 하고 소유하지 않습니다.
    expect(titles(render(undefined, 'important'))).toEqual(['장 보기']);
  });

  it('TK-002 S2: 기한이 있는 완료되지 않은 작업만 보인다', () => {
    tasks.set([장보기, 전기요금, { ...건강검진, completedAt: '2026-08-18T00:00:00.000Z' }]);

    expect(titles(render(undefined, 'planned'))).toEqual(['전기요금 납부']);
  });

  it('TK-002 S1: 모르는 스마트 목록을 요청하면 완료되지 않은 작업 목록이 보인다', () => {
    // 주소를 직접 고쳤을 때 화면이 비는 대신 전체 목록이 뜨는 편이 낫습니다.
    expect(titles(render(undefined, '없는-관점')).length).toBe(3);
  });

  it('제목이 관점의 이름을 따른다', () => {
    const host = render(undefined, 'my-day').nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('나의 하루');
  });

  it('TK-001 S1: 스마트 목록을 보며 적으면 그 스마트 목록의 성질이 붙은 채로 목록에 남는다', async () => {
    const fixture = render(undefined, 'important');
    const input = newTaskInput(fixture);

    input.value = '지금 급한 것';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    pressEnter(input);
    await fixture.whenStable();

    // 적은 항목이 그 관점에 나타나지 않으면 적은 사람은 사라진 것으로 봅니다.
    expect(add).toHaveBeenCalledWith('지금 급한 것', { important: true });
  });

  it('TK-003 S2: 중요 표시가 정한 대로 남는다', async () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;
    const star = [...host.querySelectorAll('button')].find(
      (button) => button.getAttribute('aria-label') === '장 보기 중요 표시',
    );

    // 켜짐을 색만으로 알리지 않습니다.
    expect(star?.getAttribute('aria-pressed')).toBe('false');

    star?.click();
    await fixture.whenStable();

    expect(setImportant).toHaveBeenCalledWith('seed-1', true);
  });

  it('TK-004 S1: 완료하면 완료되지 않은 작업 목록에서 사라지고 완료된 작업로 남는다', async () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;
    const box = host.querySelector<HTMLElement>('li [role="checkbox"]');

    box?.click();
    // 체크된 모습을 보여 주는 시간이 지난 뒤에 저장소에 닿습니다.
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(setCompleted).toHaveBeenCalledWith('seed-2', true);
  });

  it('TK-004 S1: 되돌리면 완료되지 않은 작업으로 다시 보인다', async () => {
    tasks.set([{ ...장보기, completedAt: '2026-08-18T00:00:00.000Z' }, 전기요금, 건강검진]);
    const fixture = TestBed.createComponent(TaskListPage);
    fixture.componentRef.setInput('done', true);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    // 완료된 작업은 완료되지 않은 작업 목록에 없고, 펼친 완료된 작업 목록의 체크는 완료의 반대입니다.
    const active = [...host.querySelectorAll('ul:not(#completed-tasks) li a')].map((a) =>
      a.textContent?.trim(),
    );
    expect(active).not.toContain('장 보기');
    host.querySelector<HTMLElement>('#completed-tasks [role="checkbox"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(setCompleted).toHaveBeenCalledWith('seed-1', false);
  });

  it('TK-001 S3: 넣기에 실패하면 목록에 없고, 기존 작업은 남는다', async () => {
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
    // 알리고, 적은 것은 다시 적지 않아도 되게 그대로 둡니다.
    expect(toastError).toHaveBeenCalled();
    expect(newTaskInput(fixture).value).toBe('우산 챙기기');
  });

  it('TK-004 S2: 실패하면 완료 전과 같다', async () => {
    // 저장소는 응답까지 한 번은 그려질 시간이 있습니다. 같은 턴의 거부는 현실에 없습니다.
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

    // × 는 정렬을 기본으로 되돌립니다.
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

    // 색만으로 알리면 색각 이상과 흑백 출력에서 전달되지 않습니다. 13-accessibility.md 4절.
    expect(sortButton(fixture, '만든 날짜').getAttribute('aria-pressed')).toBe('true');
    expect(sortButton(fixture, '기한').getAttribute('aria-pressed')).toBe('false');
  });

  it('TK-002 S3: 같은 기준을 다시 고르면 방향이 뒤집힌다', () => {
    const fixture = render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    // 기본(만든 날짜 · 최근 것 앞)을 다시 누르면 오름차순이 되고, 그것은 주소에 적힌다.
    sortButton(fixture, '만든 날짜').click();
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { sort: 'created', dir: 'asc' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    // 다른 기준을 고르면 그 기준의 기본 방향이라 dir 은 주소에서 빠진다.
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

  it('TK-002 S3: 기한을 고르면 기한이 가까운 것부터 보이고 없는 것은 뒤다', () => {
    expect(titles(render('due'))).toEqual(['건강검진 예약', '전기요금 납부', '장 보기']);
  });

  it('제목은 패널을 여는 링크이며 경로를 바꾸지 않는다', () => {
    const fixture = render();
    const host = fixture.nativeElement as HTMLElement;
    const link = host.querySelector<HTMLAnchorElement>('#task-seed-1');

    // 경로가 바뀌면 라우터가 목록을 언마운트해 곁에 둘 수 없습니다. shared/config/routes.ts 의 TASK_PANEL 주석.
    expect(link?.getAttribute('href')).toBe('/tasks/all?task=seed-1');
  });

  /*
   * 상세는 이 화면의 DOM 이 아니라 셸의 aside 슬롯에 실립니다. 화면이 자기 레이아웃을
   * 정하지 않기 때문이며, 검증 대상은 슬롯을 채웠는지입니다. 06-layout.md 3.1절.
   */
  it('열린 항목이 없으면 aside 슬롯을 채우지 않는다', () => {
    render();

    expect(TestBed.inject(AsideSlot).content()).toBeNull();
  });

  it('열린 항목이 있으면 aside 슬롯을 채운다', () => {
    const fixture = TestBed.createComponent(TaskListPage);
    fixture.componentRef.setInput('task', 'seed-1');
    fixture.detectChanges();

    expect(TestBed.inject(AsideSlot).content()).not.toBeNull();
    // 화면 자신의 DOM 에는 남지 않습니다.
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

    expect(TestBed.inject(AsideSlot).content()).toBeNull();
  });
});
