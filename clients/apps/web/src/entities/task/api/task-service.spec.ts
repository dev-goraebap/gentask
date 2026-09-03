import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ENDPOINTS } from '@/shared/api';
import { TaskService } from './task-service';

describe('TaskService', () => {
  let taskService: TaskService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TaskService],
    });
    taskService = TestBed.inject(TaskService);
    httpTesting = TestBed.inject(HttpTestingController);

    flushList();
  });

  afterEach(() => httpTesting.verify());

  function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve));
  }

  /** 조회는 인스턴스 생성과 reload() 로 일어나며, 효과가 돌아야 요청이 나갑니다. */
  function flushList(): void {
    TestBed.tick();
    const list = httpTesting.expectOne({ url: ENDPOINTS.tasks, method: 'GET' });
    list.flush([]);
  }

  function expectNoList(): void {
    TestBed.tick();
    httpTesting.expectNone({ url: ENDPOINTS.tasks, method: 'GET' });
  }

  it('제목만으로 만들고 만든 뒤 목록을 다시 받는다', async () => {
    const done = taskService.add('우산 챙기기');

    const create = httpTesting.expectOne({ url: ENDPOINTS.tasks, method: 'POST' });
    expect(create.request.body).toEqual({ title: '우산 챙기기', dueDate: null });
    create.flush(null, { headers: { Location: `${ENDPOINTS.tasks}/made-1` } });

    await done;
    flushList();
  });

  it('씨앗의 성질은 생성 요청이 아니라 각자의 하위 자원으로 나간다', async () => {
    const done = taskService.add('지금 급한 것', { important: true, inMyDay: true });

    const create = httpTesting.expectOne({ url: ENDPOINTS.tasks, method: 'POST' });
    expect(create.request.body).toEqual({ title: '지금 급한 것', dueDate: null });
    create.flush(null, { headers: { Location: `${ENDPOINTS.tasks}/made-2` } });
    await settle();

    const importance = httpTesting.expectOne(ENDPOINTS.taskImportance('made-2'));
    expect(importance.request.method).toBe('PATCH');
    expect(importance.request.body).toEqual({ important: true });
    importance.flush(null);
    await settle();

    const myDay = httpTesting.expectOne(ENDPOINTS.taskMyDay('made-2'));
    expect(myDay.request.body).toEqual({ inMyDay: true });
    myDay.flush(null);

    await done;
    flushList();
  });

  it('Location 이 없으면 만든 작업을 가리킬 수 없으므로 실패하고 목록도 다시 받지 않는다', async () => {
    const done = taskService.add('어딘가의 것');

    httpTesting.expectOne({ url: ENDPOINTS.tasks, method: 'POST' }).flush(null);

    await expect(done).rejects.toThrow('Location');
    expectNoList();
  });

  it('완료 요청 후 작업 목록을 재조회한다', async () => {
    const done = taskService.setCompleted('seed-1', true);

    const request = httpTesting.expectOne(ENDPOINTS.taskCompletion('seed-1'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ completed: true });
    request.flush(null);

    await done;
    flushList();
  });

  it('명령이 실패하면 목록을 다시 받지 않는다', async () => {
    const done = taskService.setCompleted('seed-1', true);

    httpTesting
      .expectOne(ENDPOINTS.taskCompletion('seed-1'))
      .flush(null, { status: 500, statusText: '저장소 없음' });

    await expect(done).rejects.toBeDefined();
    expectNoList();
  });

  it('삭제 요청 후 작업 목록을 재조회한다', async () => {
    const done = taskService.remove('seed-1');

    const request = httpTesting.expectOne(ENDPOINTS.task('seed-1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await done;
    flushList();
  });
});
