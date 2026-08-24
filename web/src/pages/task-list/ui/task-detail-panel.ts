import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import {
  DEFAULT_REMIND_TIME,
  describeRemind,
  fromDateKey,
  fromDateTimeKey,
  HOURS12,
  isAddableTitle,
  isCompleted,
  isInMyDay,
  joinTime,
  MERIDIEMS,
  MINUTES,
  quickDues,
  quickReminds,
  remindTimeKey,
  splitTime,
  TaskCommands,
  toDateKey,
  withRemindDate,
  withRemindTime,
  type Meridiem,
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
import { HlmDatePicker, HlmDatePickerTrigger } from '@/shared/ui/date-picker';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';
import { HlmTextarea } from '@/shared/ui/textarea';
import { provideIcons } from '@ng-icons/core';
import {
  lucideAlarmClock,
  lucideCalendar,
  lucideCalendarArrowDown,
  lucideCalendarCheck,
  lucideCalendarRange,
  lucideChevronsRight,
  lucideCircleArrowRight,
  lucideClock,
  lucideStar,
  lucideSun,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';

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
 * 대상은 부모가 입력으로 넘깁니다. 이 패널은 목록의 조회를 모르며, 바꾼 뒤에는
 * `(changed)` 로만 알립니다. 사본을 다시 받는 것은 조회를 든 쪽의 일입니다. 09-state.md 4.1절.
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
    provideIcons({
      lucideAlarmClock,
      lucideCalendar,
      lucideCalendarArrowDown,
      lucideCalendarCheck,
      lucideCalendarRange,
      lucideChevronsRight,
      lucideCircleArrowRight,
      lucideClock,
      lucideStar,
      lucideSun,
      lucideTrash2,
      lucideX,
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
  /** 부모가 목록에서 찾아 넘깁니다. 없는 식별자를 열었으면 undefined 입니다. */
  readonly task = input.required<Task | undefined>();

  /** 값을 바꾸는 데 성공했음을 알립니다. 무엇이 바뀌었는지는 싣지 않습니다. */
  readonly changed = output<void>();

  private readonly commands = inject(TaskCommands);
  private readonly router = inject(Router);

  private readonly draft = signal<TaskDraft>({
    title: '',
    note: '',
    dueDate: null,
    remindAt: null,
  });

  /** 검증 규칙을 스키마 한 곳에 모읍니다. 12-forms.md 2절. */
  protected readonly editForm = form(this.draft, (p) => {
    validate(p.title, ({ value }) =>
      isAddableTitle(value()) ? undefined : requiredError({ message: '제목을 입력해 주세요.' }),
    );
  });

  /** 확인을 거쳐야 지웁니다. 되돌릴 수단이 없으므로 확인이 유일한 안전장치입니다. */
  private readonly confirm = viewChild(HlmAlertDialog);

  /** 시와 분의 열입니다. 팝오버가 열릴 때 자리를 잡으므로 그 전에는 높이가 없습니다. */
  private readonly hourList = viewChild<ElementRef<HTMLElement>>('hourList');
  private readonly minuteList = viewChild<ElementRef<HTMLElement>>('minuteList');

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
      this.draft.set(toDraft(current));
    });

    /*
     * 시각 목록을 열면 골라 둔 시각이 보이는 자리에서 시작합니다.
     *
     * 하루가 마흔여덟 칸이라 목록은 늘 자정에서 시작하는데, 고른 값이 그 아래 어딘가에
     * 있으면 열 때마다 찾아 내려가야 합니다. 아직 고르지 않았으면 기본 시각을 보입니다.
     *
     * 목록이 뷰에 나타나는 순간에만 맞춥니다. 고른 값에 반응하면 사용자가 스크롤해 둔
     * 자리가 고를 때마다 되돌아갑니다. `scrollTop` 을 직접 두는 이유는 `scrollIntoView`
     * 가 조상 스크롤까지 건드려 패널 전체가 따라 움직이기 때문입니다.
     */
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
      await this.commands.setCompleted(current.id, completed);
    } catch {
      box.checked.set(!completed);
      toast.error(completed ? '완료하지 못했습니다.' : '되돌리지 못했습니다.');
      return;
    }
    this.changed.emit();
  }

  /** 중요 표시를 켜고 끕니다. TK-003 A4. 목록 행의 별과 같은 동작입니다. */
  protected async setImportant(important: boolean): Promise<void> {
    const current = this.task();
    if (!current) return;
    await this.commands.setImportant(current.id, important);
    this.changed.emit();
  }

  /** 담고 빼는 것은 즉시 반영입니다. 벗어나는 조작이 따로 없습니다. */
  protected async toggleMyDay(): Promise<void> {
    const current = this.task();
    if (!current) return;

    await this.commands.setMyDay(current.id, !this.inMyDay());
    this.changed.emit();
  }

  /** 지우기 버튼의 표시 조건입니다. 정하지 않은 상태에서는 지울 것이 없습니다. */
  protected readonly draftDueDate = computed(() => this.draft().dueDate);

  /**
   * 기한의 빠른 선택입니다. 고를 수 있는 날은 엔티티가 정하고 아이콘만 여기서 붙입니다.
   * 아이콘은 표현이라 그 계층에 두지 않으며, 순서가 고정이므로 자리로 맞춥니다.
   *
   * 오늘은 열 때마다 다시 재지 않습니다. 패널이 열려 있는 동안 자정을 넘는 경우는 드물고,
   * 넘더라도 다음에 열 때 맞습니다.
   */
  protected readonly quickDue = computed(() =>
    quickDues(fromDateKey(this.today) ?? new Date()).map((q, index) => ({
      ...q,
      icon: DUE_ICONS[index],
    })),
  );

  /** 빠른 선택은 달력을 거치지 않으므로 팝오버를 직접 닫습니다. */
  protected pickQuick(date: Date, picker: { close(): void }): void {
    this.setDueDate(date);
    picker.close();
  }

  /**
   * 미리 알림의 빠른 선택입니다. 기한과 달리 시각까지 한 번에 정해집니다.
   *
   * 지금을 기준으로 삼습니다. "오늘 나중에" 가 세 시간 뒤라 오늘 날짜만으로는 값이 서지
   * 않습니다. 열 때마다 다시 재지 않는 것은 기한과 같은 이유입니다.
   */
  protected readonly quickRemind = computed(() =>
    quickReminds(this.now).map((q, index) => ({ ...q, icon: REMIND_ICONS[index] })),
  );

  private readonly now = new Date();

  /** 지우기 버튼의 표시 조건이자, 트리거의 켜짐 표시입니다. */
  protected readonly draftRemindAt = computed(() => this.draft().remindAt);

  /** 달력에 넘길 날짜 부분입니다. 시각은 달력이 다루지 않습니다. */
  protected readonly remindDate = computed<Date | undefined>(() => {
    const at = this.draft().remindAt;
    return at ? (fromDateTimeKey(at) ?? undefined) : undefined;
  });

  /** 시각 목록에서 지금 골라져 있는 값입니다. 정하지 않았으면 아무것도 골라지지 않습니다. */
  protected readonly remindTime = computed(() => {
    const at = this.draft().remindAt;
    return at ? remindTimeKey(at) : null;
  });

  /**
   * 세 열에서 골라져 있는 값입니다. 아직 정하지 않았으면 기본 시각의 자리를 보입니다.
   *
   * 정하지 않은 상태에서도 어딘가가 골라져 보이는 이유는 세 축이 함께 하나의 값을 이루기
   * 때문입니다. 셋 다 비어 있으면 무엇을 눌러야 값이 서는지 알 수 없습니다.
   */
  protected readonly remindParts = computed(() =>
    splitTime(this.remindTime() ?? DEFAULT_REMIND_TIME),
  );

  protected readonly meridiems = MERIDIEMS;
  protected readonly hours12 = HOURS12;
  protected readonly minutes = MINUTES;

  /** 한 축만 바꾸고 나머지 둘은 지킵니다. 셋이 모여 하나의 시각이 됩니다. */
  protected setRemindMeridiem(meridiem: Meridiem): void {
    const { hour12, minute } = this.remindParts();
    this.setRemindTime(joinTime(meridiem, hour12, minute));
  }

  protected setRemindHour(hour12: number): void {
    const { meridiem, minute } = this.remindParts();
    this.setRemindTime(joinTime(meridiem, hour12, minute));
  }

  protected setRemindMinute(minute: string): void {
    const { meridiem, hour12 } = this.remindParts();
    this.setRemindTime(joinTime(meridiem, hour12, minute));
  }

  /**
   * 트리거에 적을 문구입니다. 달력은 날짜만 아는데 이 값은 시각까지 있어야 하므로,
   * 화면이 들고 있는 초안에서 시각을 가져와 합칩니다.
   *
   * 앞에 "알림" 을 붙이는 이유는 값이 정해지면 트리거가 아이콘 대신 이 문구를 보이기
   * 때문입니다. 바로 아래가 기한 줄이라 날짜만 남으면 둘이 구별되지 않습니다. 기한 쪽은
   * "~까지" 가 그 구실을 하므로 따로 붙이지 않습니다.
   *
   * 화살표 함수로 두는 이유는 이것이 `hlm-date-picker` 의 입력으로 넘어가 그 안에서
   * 불리기 때문입니다. 메서드로 두면 `this` 가 풀립니다.
   */
  protected readonly formatRemind = (date: Date): string =>
    `알림 ${describeRemind(withRemindDate(this.draft().remindAt, date, DEFAULT_REMIND_TIME), this.today)}`;

  /**
   * 달력에서 날짜만 바꿉니다. 이미 정한 시각이 있으면 그것을 지킵니다.
   *
   * 날짜를 고칠 때마다 시각이 기본값으로 돌아가면, 시각을 먼저 정한 사용자는 자기가 정한
   * 것이 조용히 지워진 것을 나중에야 알게 됩니다.
   */
  protected setRemindDate(date: Date | null): void {
    this.setRemindAt(
      date ? withRemindDate(this.draft().remindAt, date, DEFAULT_REMIND_TIME) : null,
    );
  }

  /** 시각만 바꿉니다. 날짜를 아직 정하지 않았으면 오늘로 둡니다. */
  protected setRemindTime(time: string): void {
    this.setRemindAt(withRemindTime(this.draft().remindAt, time, this.today));
  }

  /** 빠른 선택은 날짜와 시각을 함께 정하므로 달력을 거치지 않고 팝오버를 닫습니다. */
  protected pickQuickRemind(at: string, picker: { close(): void }): void {
    this.setRemindAt(at);
    picker.close();
  }

  /**
   * 시각 목록을 골라 둔 시각이 보이는 자리에서 시작하게 합니다.
   *
   * 하루가 마흔여덟 칸이라 목록은 늘 자정에서 시작하는데, 고른 값이 그 아래 어딘가에
   * 있으면 열 때마다 찾아 내려가야 합니다. 아직 고르지 않았으면 기본 시각을 보입니다.
   *
   * 트리거의 클릭에 매다는 이유는 팝오버 안의 내용이 투사된 콘텐츠라 이 컴포넌트의
   * 뷰에서는 열기 전부터 존재하기 때문입니다. 존재 여부로는 열린 시점을 알 수 없습니다.
   * 한 프레임 미루는 것은 그때까지 오버레이가 자리를 잡지 않아 높이가 0 이어서입니다.
   *
   * `scrollIntoView` 를 쓰지 않습니다. 그것은 조상 스크롤까지 건드려 패널 전체가 따라
   * 움직입니다.
   */
  protected scrollToRemindTime(): void {
    requestAnimationFrame(() => {
      const { hour12, minute } = this.remindParts();
      center(this.hourList()?.nativeElement, hour12 - 1);
      center(this.minuteList()?.nativeElement, Number(minute));
    });
  }

  /** 미리 알림도 고르는 즉시 반영합니다. 기한과 같은 규칙입니다. */
  protected setRemindAt(at: string | null): void {
    this.draft.update((draft) => ({ ...draft, remindAt: at }));
    void this.commit();
  }

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
    this.draft.set(toDraft(current));
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
      next.dueDate === current.dueDate &&
      next.remindAt === current.remindAt;
    if (unchanged) return;

    try {
      await this.commands.update(current.id, next);
    } catch {
      // 이전 값으로 돌아갑니다. TK-003 A9. 고치던 값을 폼에 남기면 화면과 서버가 다른 값을 보입니다.
      this.draft.set(toDraft(current));
      this.editForm().reset();
      toast.error('바꾸지 못했습니다.');
      return;
    }
    this.changed.emit();
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
    await this.commands.remove(current.id);
    this.changed.emit();

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

/** 기한 빠른 선택의 아이콘입니다. 엔티티가 주는 순서(오늘 · 내일 · 다음 주)와 자리를 맞춥니다. */
const DUE_ICONS = ['lucideCalendarCheck', 'lucideCalendarArrowDown', 'lucideCalendarRange'];

/** 미리 알림 빠른 선택의 아이콘입니다. 순서는 오늘 나중에 · 내일 · 다음 주입니다. */
const REMIND_ICONS = ['lucideClock', 'lucideCircleArrowRight', 'lucideChevronsRight'];

/** 저장된 작업에서 편집할 부분만 떼어 냅니다. 채우기와 되돌리기가 같은 자리를 씁니다. */
function toDraft(task: Task): TaskDraft {
  return {
    title: task.title,
    note: task.note,
    dueDate: task.dueDate,
    remindAt: task.remindAt,
  };
}

/** 열의 스크롤을 그 자리의 항목이 가운데 오도록 맞춥니다. 오전·오후 열은 둘뿐이라 없습니다. */
function center(list: HTMLElement | undefined, index: number): void {
  const item = list?.children.item(index) as HTMLElement | null;
  if (list && item) {
    list.scrollTop = item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2;
  }
}
