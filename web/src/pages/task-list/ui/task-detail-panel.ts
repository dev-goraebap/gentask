import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import {
  formatDueDate,
  fromDateKey,
  isAddableTitle,
  isCompleted,
  isInMyDay,
  TASK_STORE,
  toDateKey,
  type Task,
  type TaskDraft,
} from '@/entities/task';
import { TASK_PANEL } from '@/shared/config';
import { toast } from '@/shared/ui/sonner';
import {
  HlmAlertDialog,
  HlmAlertDialogAction,
  HlmAlertDialogCancel,
  HlmAlertDialogContent,
  HlmAlertDialogDescription,
  HlmAlertDialogFooter,
  HlmAlertDialogHeader,
  HlmAlertDialogPortal,
  HlmAlertDialogTitle,
  HlmAlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { HlmButton } from '@/shared/ui/button';
import { HlmCheckbox } from '@/shared/ui/checkbox';
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
import { lucideCalendar, lucideStar, lucideSun, lucideTrash2, lucideX } from '@ng-icons/lucide';

/**
 * 작업 하나의 내용을 채우는 패널입니다. TK-003 작업 편집의 기본 흐름과 A2–A6 을 담습니다.
 *
 * 별도 화면이 아니라 목록 곁에 열리는 패널입니다. 경로가 바뀌면 라우터가 목록을
 * 언마운트하고 전환 베일이 목록을 덮으므로, 열린 항목을 쿼리 파라미터에 둡니다.
 * 기각한 대안(별도 페이지)은 shared/config/routes.ts 의 TASK_PANEL 주석에 있습니다.
 *
 * 저장 버튼을 두지 않고 고친 값을 즉시 반영합니다. 저장 시점이 있으면 저장하지 않은
 * 변경이라는 상태가 생기고 닫기·취소·뒤로가기를 가로채는 이탈 확인이 따라옵니다.
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
    FormRoot,
    FormField,
    AppIcon,
    HlmButton,
    HlmCheckbox,
    HlmInput,
    HlmTextarea,
    HlmField,
    HlmFieldLabel,
    HlmFieldError,
    HlmDatePicker,
    HlmDatePickerTrigger,
    HlmAlertDialog,
    HlmAlertDialogAction,
    HlmAlertDialogCancel,
    HlmAlertDialogContent,
    HlmAlertDialogDescription,
    HlmAlertDialogFooter,
    HlmAlertDialogHeader,
    HlmAlertDialogPortal,
    HlmAlertDialogTitle,
    HlmAlertDialogTrigger,
  ],
  providers: [
    provideIcons({ lucideCalendar, lucideStar, lucideSun, lucideTrash2, lucideX }),
    /*
     * 달력이 다루는 값은 Date 이고 저장 형식은 날짜 문자열입니다. 표기를 이 자리에서
     * 정해 두면 목록과 상세가 같은 함수를 거치므로 두 화면의 날짜가 어긋나지 않습니다.
     */
    provideHlmDatePickerConfig<Date>({
      formatDate: (date) => formatDueDate(toDateKey(date)),
      autoCloseOnSelect: true,
    }),
  ],
  /*
   * 슬롯이 준 높이를 채웁니다. 자리와 폭은 여전히 셸이 정하며 이 클래스는 그 안에서
   * 지우기 줄을 아래로 밀어내는 역할만 합니다. 06-layout.md 3.3절.
   */
  host: { class: 'flex min-h-0 flex-1 flex-col' },
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

  /** 확인을 거쳐야 지웁니다. 되돌릴 수단이 없으므로 확인이 유일한 안전장치입니다. */
  private readonly confirm = viewChild(HlmAlertDialog);

  /** 어느 항목의 값을 담고 있는지입니다. 대상이 바뀔 때만 폼을 다시 채웁니다. */
  private readonly loaded = signal<string | null>(null);

  constructor() {
    /*
     * 대상이 정해지거나 바뀌면 폼을 그 값으로 채웁니다.
     *
     * 저장소의 값이 바뀌었다는 이유만으로는 다시 채우지 않습니다. 즉시 반영이라 값을
     * 고칠 때마다 저장소가 바뀌는데, 그때마다 폼을 덮으면 반영과 입력이 경합합니다.
     */
    effect(() => {
      const current = this.task();
      if (!current || untracked(this.loaded) === current.id) return;

      this.loaded.set(current.id);
      this.draft.set({
        title: current.title,
        note: current.note,
        dueDate: current.dueDate,
      });
    });

    /*
     * 입력란에 포커스를 둔 채 닫으면 blur 가 오지 않아 마지막 입력이 남습니다.
     * 파괴 시점에 한 번 더 반영해 그 자리를 막습니다.
     */
    inject(DestroyRef).onDestroy(() => void this.commit());
  }

  /**
   * 달력에 넘길 값입니다. 저장 형식과 달력의 값 타입이 달라 경계에서 한 번 변환합니다.
   * 모델을 Date 로 두지 않는 이유는 그것이 시각과 시간대를 함께 들고 다니는 타입이라
   * 날짜만 다루기로 한 결정이 코드에서 흐려지기 때문입니다.
   */
  protected readonly dueDate = computed<Date | undefined>(() => {
    const key = this.draft().dueDate;
    return key ? (fromDateKey(key) ?? undefined) : undefined;
  });

  /**
   * 나의 하루에 추가긴 것인지입니다. 어제 담은 것은 오늘의 나의 하루가 아닙니다.
   *
   * 오늘을 화면이 계산하는 것은 표시 판정에 한정합니다. 저장할 날짜는 저장소가 정하며,
   * 그러지 않으면 자정을 넘긴 화면과 그렇지 않은 화면이 다른 날짜를 씁니다.
   */
  protected readonly inMyDay = computed(() => {
    const current = this.task();
    return current ? isInMyDay(current, this.today) : false;
  });

  private readonly today = toDateKey(new Date());

  protected readonly completed = computed(() => {
    const current = this.task();
    return current ? isCompleted(current) : false;
  });

  /**
   * 목록 행과 같은 완료 체크입니다. 실패하면 체크박스를 누르기 전으로 되돌립니다. TK-004 A4.
   * 체크박스는 자기 표시를 갖고 입력값이 그대로면 다시 그리지 않으므로 그 표시를 직접 되돌립니다.
   */
  protected async setCompleted(completed: boolean, box: HlmCheckbox): Promise<void> {
    const current = this.task();
    if (!current) return;
    try {
      await this.store.setCompleted(current.id, completed);
    } catch {
      box.checked.set(!completed);
      toast.error(completed ? '완료하지 못했습니다.' : '되돌리지 못했습니다.');
    }
  }

  /** 중요 표시를 켜고 끕니다. TK-003 A4. 목록 행의 별과 같은 동작입니다. */
  protected async setImportant(important: boolean): Promise<void> {
    const current = this.task();
    if (!current) return;
    await this.store.setImportant(current.id, important);
  }

  /** 담고 빼는 것은 즉시 반영입니다. 벗어나는 조작이 따로 없습니다. */
  protected async toggleMyDay(): Promise<void> {
    const current = this.task();
    if (!current) return;

    await this.store.setMyDay(current.id, !this.inMyDay());
  }

  /** 지우기 버튼의 표시 조건입니다. 정하지 않은 상태에서는 지울 것이 없습니다. */
  protected readonly draftDueDate = computed(() => this.draft().dueDate);

  /** 날짜는 고르는 즉시 반영합니다. 텍스트와 달리 벗어나는 조작이 따로 없습니다. */
  protected setDueDate(date: Date | null): void {
    this.draft.update((draft) => ({ ...draft, dueDate: date ? toDateKey(date) : null }));
    void this.commit();
  }

  /**
   * 엔터로 반영합니다. 조합 중의 엔터는 반영 신호가 아니라 입력기가 글자를 확정하는
   * 조작이므로 흘려보냅니다. 목록의 추가와 같은 규칙입니다.
   */
  protected commitOnEnter(event: KeyboardEvent): void {
    // keydown 을 그대로 받는 사유는 목록 화면의 같은 자리에 적혀 있습니다.
    if (event.key !== 'Enter' || event.isComposing) return;

    // 막지 않으면 입력란이 하나뿐인 폼이 암묵 제출되어 화면이 통째로 다시 뜹니다.
    event.preventDefault();
    void this.commit();
  }

  /**
   * 고치던 것을 그만둡니다. 저장 버튼이 없는 대신 이것이 취소입니다.
   *
   * 입력란을 벗어나면 반영되므로, 그만두려면 벗어나기 전에 값을 되돌려야 합니다.
   * Escape 가 그 자리이며 조합 중의 Escape 는 입력기가 받습니다.
   */
  protected cancelOnEscape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || event.isComposing) return;

    const current = this.task();
    if (!current) return;

    // 대화가 열려 있을 때의 Escape 는 대화의 몫입니다. 여기까지 오면 입력란의 것입니다.
    event.preventDefault();
    this.draft.set({ title: current.title, note: current.note, dueDate: current.dueDate });
    this.editForm().reset();
  }

  /**
   * 고친 값을 저장소에 반영합니다. 저장 버튼이 없으므로 이 호출이 곧 저장입니다.
   *
   * 텍스트는 입력란을 벗어날 때 반영합니다. 글자마다 반영하면 백엔드가 붙는 시점에
   * 타자 수만큼 요청이 나가며, 그 빈도를 뒤늦게 줄이려면 호출 구조를 다시 짜야 합니다.
   *
   * 값이 그대로면 넘기지 않습니다. 벗어나기만 해도 반영이 일어나면 고치지 않은 항목의
   * 갱신 시각이 바뀌고, 백엔드가 붙으면 빈 요청이 그만큼 나갑니다.
   */
  protected async commit(): Promise<void> {
    const current = this.task();
    if (!current) return;

    // 검증 실패로 입력란을 잠그지 않습니다. 벗어난 뒤 사유를 보여 줍니다. 12-forms.md 5절.
    this.editForm().markAsTouched();
    if (!this.editForm().valid()) return;

    const next = this.draft();
    const unchanged =
      next.title.trim() === current.title &&
      next.note === current.note &&
      next.dueDate === current.dueDate;
    if (unchanged) return;

    try {
      await this.store.update(current.id, next);
    } catch {
      // 이전 값으로 돌아갑니다. TK-003 A9. 고치던 값을 폼에 남기면 화면과 저장소가 다른 값을 보입니다.
      this.draft.set({ title: current.title, note: current.note, dueDate: current.dueDate });
      this.editForm().reset();
      toast.error('바꾸지 못했습니다.');
    }
  }

  /**
   * 확인을 받은 뒤 지웁니다. 되돌리기 안내를 두지 않으므로 이 조작은 되돌아오지 않습니다.
   *
   * 대화를 먼저 거두는 이유는 대상이 사라지면 이 패널의 내용이 통째로 바뀌어 대화가
   * 매달릴 자리가 없어지기 때문입니다.
   */
  protected async remove(): Promise<void> {
    const current = this.task();
    if (!current) return;

    this.confirm()?.close();
    await this.store.remove(current.id);

    // 지운 항목의 상세는 남을 이유가 없습니다.
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
