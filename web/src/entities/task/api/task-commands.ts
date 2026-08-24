import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS, type PresignedUpload, type TaskFileView } from '@/shared/api';

/**
 * 새 항목이 태어날 때 함께 받는 성질입니다. 적는 자리가 놓인 관점이 정합니다.
 *
 * 전체 관점에서는 비어 있습니다. 그 자리에는 부여할 성질이 없습니다.
 */
export type TaskSeed = {
  readonly important?: boolean;
  readonly inMyDay?: boolean;
  readonly dueDate?: string | null;

  /** 적는 자리에서 붙인 미리 알림입니다. TK-001 A3. 형식은 Task 와 같습니다. */
  readonly remindAt?: string | null;
};

/**
 * 사용자가 상세 화면에서 고칠 수 있는 부분입니다.
 *
 * 필드에 readonly 를 붙이지 않는 이유는 이 타입이 폼의 모델이기도 하기 때문입니다.
 * Signal Forms 는 읽기 전용 속성에 경로를 만들지 못합니다. 저장된 값의 불변성은
 * Task 가 지키며 이 타입은 편집 중인 사본입니다.
 */
export type TaskDraft = {
  title: string;
  note: string;

  /** 정하지 않은 상태를 담아야 하므로 null 을 허용합니다. 형식은 Task 와 같습니다. */
  dueDate: string | null;

  /** 미리 알림입니다. TK-003 A10. 기한과 서로를 정하지 않으므로 따로 담습니다. */
  remindAt: string | null;
};

/**
 * 작업을 바꾸는 명령들입니다. 상태를 갖지 않으므로 스토어가 아닙니다.
 *
 * 변경에 httpResource 를 쓰지 않습니다. 읽기 전용이고 요청이 바뀌면 진행 중인 작업을
 * 중단해 저장이 도중에 취소됩니다. 09-state.md 4.1절.
 *
 * 명령은 성공 여부만 받고 목록을 다시 받지 않습니다. 사본은 TaskList 가 들고 있으므로
 * 명령을 부른 쪽이 `reload()` 를 부릅니다. 여기서 부르면 목록이 필요 없는 호출부까지
 * 재조회 비용을 냅니다.
 */
@Injectable()
export class TaskCommands {
  private readonly http = inject(HttpClient);

  /**
   * 제목만으로 만듭니다. `seed` 는 적는 자리가 놓인 관점이 부여하는 성질입니다.
   *
   * 관점 안에서 적은 항목이 그 관점에 나타나지 않으면 적은 사람은 사라진 것으로 봅니다.
   * 그래서 화면이 관점의 조건을 씨앗으로 넘기고 명령은 그것을 그대로 담습니다.
   */
  async add(title: string, seed: TaskSeed = {}): Promise<void> {
    const taskId = await this.create(title, seed.dueDate ?? null);

    // 셋은 각자 하위 자원이라 생성 요청에 함께 담으면 같은 값을 두 경로로 바꾸게 됩니다.
    if (seed.important) await this.patch(ENDPOINTS.taskImportance(taskId), { important: true });
    if (seed.inMyDay) await this.patch(ENDPOINTS.taskMyDay(taskId), { inMyDay: true });
    if (seed.remindAt) {
      await this.patch(ENDPOINTS.task(taskId), {
        title,
        note: '',
        dueDate: seed.dueDate ?? null,
        remindAt: seed.remindAt,
      });
    }
  }

  async setCompleted(id: string, completed: boolean): Promise<void> {
    await this.patch(ENDPOINTS.taskCompletion(id), { completed });
  }

  /** 중요 표시를 켜고 끕니다. TK-003 A4. */
  async setImportant(id: string, important: boolean): Promise<void> {
    await this.patch(ENDPOINTS.taskImportance(id), { important });
  }

  /**
   * 나의 하루에 담고 뺍니다. 담는 날짜는 서버가 정합니다.
   *
   * 화면이 오늘 날짜를 넘기지 않는 이유는 그 값이 저장 형식의 일부이기 때문입니다.
   * 화면마다 오늘을 계산하면 자정을 넘긴 화면과 그렇지 않은 화면이 다른 날짜를 씁니다.
   */
  async setMyDay(id: string, inMyDay: boolean): Promise<void> {
    await this.patch(ENDPOINTS.taskMyDay(id), { inMyDay });
  }

  /**
   * 편집 가능한 필드만 받습니다. 완료 여부는 setCompleted 가 소유하며, 목록의 체크와
   * 상세의 저장이 같은 값을 서로 다른 경로로 바꾸면 어느 쪽이 이겼는지 알 수 없게 됩니다.
   */
  async update(id: string, patch: TaskDraft): Promise<void> {
    await this.patch(ENDPOINTS.task(id), patch);
  }

  /**
   * 지운 항목을 되살리는 명령은 두지 않습니다. 삭제 전 확인이 안전장치이며, 영구적인
   * 복구가 필요한지는 TK-003 의 미결 `삭제 복구` 가 정합니다.
   */
  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(ENDPOINTS.task(id)));
  }

  /**
   * 파일 붙이기의 세 걸음 (TK-003 A11). presign 으로 자리를 받고, 브라우저가 보관소로
   * 직접 올린 뒤, attach 로 확정합니다. 서버는 확정 시점에 보관소의 실측으로 검증합니다.
   */
  async presignFile(taskId: string, fileName: string, contentType: string, size: number): Promise<PresignedUpload> {
    return firstValueFrom(
      this.http.post<PresignedUpload>(ENDPOINTS.taskFilePresign(taskId), { fileName, contentType, size }),
    );
  }

  async attachFile(
    taskId: string,
    objectKey: string,
    fileName: string,
    contentType: string,
  ): Promise<TaskFileView> {
    return firstValueFrom(
      this.http.post<TaskFileView>(ENDPOINTS.taskFiles(taskId), { objectKey, fileName, contentType }),
    );
  }

  /** 떼면 보관소의 바이트도 함께 사라집니다. 되살리는 수단은 없습니다. */
  async detachFile(taskId: string, fileId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(ENDPOINTS.taskFile(taskId, fileId)));
  }

  /**
   * 만든 것의 식별자를 Location 에서 꺼냅니다. 응답 본문에는 없습니다. 07-api-design.md 2절.
   *
   * 다른 출처의 서버를 부르게 되면 `Access-Control-Expose-Headers` 없이는 이 헤더가
   * 보이지 않습니다. 개발 프록시를 거치는 동안은 같은 출처라 드러나지 않습니다.
   */
  private async create(title: string, dueDate: string | null): Promise<string> {
    const response = await firstValueFrom(
      this.http.post(ENDPOINTS.tasks, { title, dueDate }, { observe: 'response' }),
    );
    const location = response.headers.get('Location');
    if (!location) throw new Error('Location 헤더가 없어 만든 작업을 가리킬 수 없습니다.');
    return location.slice(location.lastIndexOf('/') + 1);
  }

  private async patch(url: string, body: object): Promise<void> {
    await firstValueFrom(this.http.patch<void>(url, body));
  }
}
