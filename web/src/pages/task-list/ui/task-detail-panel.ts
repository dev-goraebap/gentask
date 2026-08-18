import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import {
  formatDueDate,
  fromDateKey,
  isAddableTitle,
  TASK_STORE,
  toDateKey,
  type Task,
  type TaskDraft,
} from '@/entities/task';
import { TASK_PANEL } from '@/shared/config';
import { HlmButton } from '@/shared/ui/button';
import {
  HlmDatePicker,
  HlmDatePickerTrigger,
  provideHlmDatePickerConfig,
} from '@/shared/ui/date-picker';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { HlmTextarea } from '@/shared/ui/textarea';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';

/**
 * 할일 하나의 내용을 채우는 패널입니다. 요구사항 3을 담습니다.
 *
 * 별도 화면이 아니라 목록 곁에 열리는 패널입니다. 경로가 바뀌면 라우터가 목록을
 * 언마운트하고 전환 베일이 목록을 덮으므로, 열린 항목을 쿼리 파라미터에 둡니다.
 * 기각한 대안은 specs/할일-해내기/requirements.md 부록 A 에 있습니다.
 *
 * 목록과 같은 저장소 인스턴스를 봅니다. 두 화면을 감싸는 라우트가 프로바이더를 갖기
 * 때문이며, 화면마다 따로 두면 목록에서 고친 것이 여기 보이지 않습니다.
 *
 * 대상을 목록에서 파생하는 것은 프로토타입 구간의 형태입니다. 백엔드가 붙으면 화면
 * 진입에 필수인 데이터이므로 리졸버로 옮기고, 없는 식별자에 대한 처리도 그때 리졸버가
 * 가져갑니다. 09-state.md 3.1절.
 */
@Component({
  selector: 'app-task-detail-panel',
  imports: [
    FormRoot, FormField, AppIcon,
    HlmButton, HlmInput, HlmTextarea, HlmField, HlmFieldLabel, HlmFieldError,
    HlmDatePicker, HlmDatePickerTrigger,
  ],
  providers: [
    provideIcons({ lucideX }),
    /*
     * 달력이 다루는 값은 Date 이고 저장 형식은 날짜 문자열입니다. 표기를 이 자리에서
     * 정해 두면 목록과 상세가 같은 함수를 거치므로 두 화면의 날짜가 어긋나지 않습니다.
     */
    provideHlmDatePickerConfig<Date>({
      formatDate: (date) => formatDueDate(toDateKey(date)),
      autoCloseOnSelect: true,
    }),
  ],
  templateUrl: './task-detail-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailPanel {
  /** 목록 화면이 쿼리 파라미터에서 받아 넘깁니다. */
  readonly id = input.required<string>();

  private readonly store = inject(TASK_STORE);
  private readonly router = inject(Router);

  protected readonly task = computed<Task | undefined>(() =>
    this.store.tasks().find((candidate) => candidate.id === this.id()),
  );

  private readonly draft = signal<TaskDraft>({ title: '', note: '', dueDate: null });

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
      this.draft.set({
        title: current.title,
        note: current.note,
        dueDate: current.dueDate,
      });
    });
  }

  /**
   * (submit) 에 바인딩하고 preventDefault 를 직접 호출합니다. (ngSubmit) 은 발화하지 않으며
   * 없는 채로 쓰면 빌드가 통과하고 제출만 조용히 동작하지 않습니다. 12-forms.md 1절.
   */
  /**
   * 달력에 넘길 값입니다. 저장 형식과 달력의 값 타입이 달라 경계에서 한 번 변환합니다.
   * 모델을 Date 로 두지 않는 이유는 그것이 시각과 시간대를 함께 들고 다니는 타입이라
   * 날짜만 다루기로 한 결정이 코드에서 흐려지기 때문입니다.
   */
  protected readonly dueDate = computed<Date | undefined>(() => {
    const key = this.draft().dueDate;
    return key ? (fromDateKey(key) ?? undefined) : undefined;
  });

  /** 지우기 버튼의 표시 조건입니다. 정하지 않은 상태에서는 지울 것이 없습니다. */
  protected readonly draftDueDate = computed(() => this.draft().dueDate);

  protected setDueDate(date: Date | null): void {
    this.draft.update((draft) => ({ ...draft, dueDate: date ? toDateKey(date) : null }));
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();

    // 검증 실패로 버튼을 비활성화하지 않습니다. 12-forms.md 6절.
    this.editForm().markAsTouched();
    if (!this.editForm().valid()) return;

    const current = this.task();
    if (!current) return;

    await this.store.update(current.id, this.draft());

    // 저장하면 닫습니다. 목록이 곁에 남아 있으므로 돌아갈 곳이 따로 없습니다.
    this.close();
  }

  /**
   * 패널을 닫습니다. 경로는 그대로 두고 쿼리 파라미터만 지웁니다.
   *
   * `replaceUrl` 로 항목을 덮는 이유는 닫기가 새로운 자리가 아니기 때문입니다. 쌓으면
   * 닫은 뒤의 뒤로가기가 방금 닫은 패널을 다시 엽니다. 여는 것은 반대로 쌓아서
   * 뒤로가기가 곧 닫기가 되게 합니다. 08-routing.md 3.2절.
   */
  protected close(): void {
    void this.router.navigate([], {
      queryParams: TASK_PANEL.close(),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
