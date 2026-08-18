import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { isAddableTitle, TASK_STORE, type Task, type TaskDraft } from '@/entities/task';
import { ROUTES } from '@/shared/config';
import { HlmButton } from '@/shared/ui/button';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@/shared/ui/field';
import { HlmInput } from '@/shared/ui/input';
import { HlmTextarea } from '@/shared/ui/textarea';

/**
 * 할일 하나의 내용을 채우는 화면입니다. 요구사항 3을 담습니다.
 *
 * 목록과 같은 저장소 인스턴스를 봅니다. 두 화면을 감싸는 라우트가 프로바이더를 갖기
 * 때문이며, 화면마다 따로 두면 목록에서 고친 것이 여기 보이지 않습니다.
 *
 * 대상을 목록에서 파생하는 것은 프로토타입 구간의 형태입니다. 백엔드가 붙으면 화면
 * 진입에 필수인 데이터이므로 리졸버로 옮기고, 없는 식별자에 대한 처리도 그때 리졸버가
 * 가져갑니다. 09-state.md 3.1절.
 */
@Component({
  selector: 'app-task-detail',
  imports: [
    FormRoot, FormField, RouterLink,
    HlmButton, HlmInput, HlmTextarea, HlmField, HlmFieldLabel, HlmFieldError,
  ],
  templateUrl: './task-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailPage {
  /** 경로 파라미터입니다. withComponentInputBinding 이 묶어 줍니다. 08-routing.md 3.1절. */
  readonly id = input.required<string>();

  private readonly store = inject(TASK_STORE);
  private readonly router = inject(Router);

  protected readonly routes = ROUTES;

  protected readonly task = computed<Task | undefined>(() =>
    this.store.tasks().find((candidate) => candidate.id === this.id()),
  );

  private readonly draft = signal<TaskDraft>({ title: '', note: '' });

  /** 검증 규칙을 스키마 한 곳에 모읍니다. 12-forms.md 2절. */
  protected readonly editForm = form(this.draft, (p) => {
    validate(p.title, ({ value }) =>
      isAddableTitle(value()) ? undefined : requiredError({ message: '제목을 입력해 주세요.' }),
    );
  });

  constructor() {
    // 대상이 정해지거나 바뀌면 폼을 그 값으로 채웁니다.
    effect(() => {
      const current = this.task();
      if (!current) return;
      this.draft.set({ title: current.title, note: current.note });
    });
  }

  /**
   * (submit) 에 바인딩하고 preventDefault 를 직접 호출합니다. (ngSubmit) 은 발화하지 않으며
   * 없는 채로 쓰면 빌드가 통과하고 제출만 조용히 동작하지 않습니다. 12-forms.md 1절.
   */
  protected async save(event: Event): Promise<void> {
    event.preventDefault();

    // 검증 실패로 버튼을 비활성화하지 않습니다. 12-forms.md 6절.
    this.editForm().markAsTouched();
    if (!this.editForm().valid()) return;

    const current = this.task();
    if (!current) return;

    await this.store.update(current.id, this.draft());

    // 경로가 바뀌는 이동이라 전환 베일이 관여합니다. 10-loading.md 3.1절.
    void this.router.navigate([ROUTES.taskList()]);
  }
}
