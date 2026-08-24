import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ENDPOINTS } from '@/shared/api';
import { TaskCommands } from './task-commands';

/*
 * 명령이 계약대로 요청을 만드는지를 고정합니다. 특히 생성이 식별자를 Location 에서
 * 꺼내는 것과, 씨앗의 성질이 각자의 하위 자원으로 나가는 것이 이 서비스의 계약입니다.
 * 07-api-design.md 2절.
 */
describe('TaskCommands', () => {
  let commands: TaskCommands;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TaskCommands],
    });
    commands = TestBed.inject(TaskCommands);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** 요청 사이의 이어짐은 마이크로태스크라 한 틱을 넘겨야 다음 요청이 나갑니다. */
  function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve));
  }

  it('제목만으로 만들고 목록은 다시 받지 않는다', async () => {
    const done = commands.add('우산 챙기기');

    const create = http.expectOne(ENDPOINTS.tasks);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ title: '우산 챙기기', dueDate: null });
    create.flush(null, { headers: { Location: `${ENDPOINTS.tasks}/made-1` } });

    await done;
    // 명령은 결과를 싣지 않습니다. 재조회는 부른 쪽의 몫이므로 여기서 GET 이 나가면 안 됩니다.
    http.verify();
  });

  it('씨앗의 성질은 생성 요청이 아니라 각자의 하위 자원으로 나간다', async () => {
    const done = commands.add('지금 급한 것', { important: true, inMyDay: true });

    const create = http.expectOne(ENDPOINTS.tasks);
    // 함께 담으면 같은 값을 두 경로로 바꾸게 됩니다.
    expect(create.request.body).toEqual({ title: '지금 급한 것', dueDate: null });
    create.flush(null, { headers: { Location: `${ENDPOINTS.tasks}/made-2` } });
    await settle();

    const importance = http.expectOne(ENDPOINTS.taskImportance('made-2'));
    expect(importance.request.method).toBe('PATCH');
    expect(importance.request.body).toEqual({ important: true });
    importance.flush(null);
    await settle();

    const myDay = http.expectOne(ENDPOINTS.taskMyDay('made-2'));
    expect(myDay.request.body).toEqual({ inMyDay: true });
    myDay.flush(null);

    await done;
  });

  it('Location 이 없으면 만든 작업을 가리킬 수 없으므로 실패다', async () => {
    const done = commands.add('어딘가의 것');

    http.expectOne(ENDPOINTS.tasks).flush(null);

    await expect(done).rejects.toThrow('Location');
  });

  it('지우기는 그 항목 하나만 부른다', async () => {
    const done = commands.remove('seed-1');

    const request = http.expectOne(ENDPOINTS.task('seed-1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await done;
  });
});
