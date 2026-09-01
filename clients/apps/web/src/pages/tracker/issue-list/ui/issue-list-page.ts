import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ISSUE_KIND_FACES,
  ISSUE_STATE_FACES,
  isNested,
  isSettled,
  IssueKindBadge,
  issueKindLabel,
  IssueService,
  IssueStateChip,
  matchesFilter,
  orderByHierarchy,
  toKindFilter,
  toStateFilter,
  toggleFilter,
  type IssueKind,
  type IssueSummary,
} from '@/entities/issue';
import { ISSUE_CREATE_PANEL, ROUTES } from '@/shared/config';
import { injectRoutedOverlay, type RoutedOverlayRef } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { AppIcon } from '@/shared/ui/icon';
import { HlmPopoverImports } from '@/shared/ui/popover';
import { IssueCreateDialog } from './issue-create-dialog';

/** 목록의 한 줄. 판정을 미리 해 두어 템플릿이 매 그리기마다 다시 세지 않는다. */
interface IssueRow {
  readonly issue: IssueSummary;
  readonly nested: boolean;
  readonly settled: boolean;
}

@Component({
  selector: 'app-issue-list',
  imports: [
    RouterLink,
    HlmButton,
    HlmPopoverImports,
    AppIcon,
    EmptyState,
    IssueKindBadge,
    IssueStateChip,
  ],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  templateUrl: './issue-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueListPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;
  protected readonly kindFaces = ISSUE_KIND_FACES;
  protected readonly stateFaces = ISSUE_STATE_FACES;

  protected readonly createPanel = ISSUE_CREATE_PANEL;

  // --- 계약 --------------------------------------------------------------------------------------
  readonly kind = input<string | undefined>(undefined);
  readonly state = input<string | undefined>(undefined);

  /** 세우는 덮개가 열려 있는가. 주소가 그것을 갖는다. */
  readonly new = input(false, { transform: booleanAttribute });

  // --- 의존 --------------------------------------------------------------------------------------
  protected readonly issueService = inject(IssueService);
  private readonly router = inject(Router);
  private readonly overlay = injectRoutedOverlay();

  // --- 상태 --------------------------------------------------------------------------------------
  /** 지금 떠 있는 덮개. 주소가 바뀔 때 그것을 걷기 위해 들고 있는다. */
  private creating: RoutedOverlayRef<IssueCreateDialog> | null = null;

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly kinds = computed(() => toKindFilter(this.kind()));
  protected readonly states = computed(() => toStateFilter(this.state()));

  protected readonly rows = computed<readonly IssueRow[]>(() => {
    const kinds = this.kinds();
    const states = this.states();
    const matched = this.issueService.list().filter((issue) => matchesFilter(issue, kinds, states));

    return orderByHierarchy(matched).map((issue) => ({
      issue,
      nested: isNested(issue, matched),
      settled: isSettled(issue),
    }));
  });

  protected readonly hiddenCount = computed(
    () => this.issueService.list().length - this.rows().length,
  );

  protected readonly kindSummary = computed(() => {
    const kinds = this.kinds();
    if (kinds.length === ISSUE_KIND_FACES.length) return '전체';
    return kinds.map((value) => issueKindLabel(value)).join(' · ');
  });

  protected readonly stateSummary = computed(() =>
    this.states()
      .map((value) => ISSUE_STATE_FACES.find((face) => face.value === value)?.label ?? '')
      .join(' · '),
  );

  // --- 생성 --------------------------------------------------------------------------------------
  /**
   * 주소가 덮개의 열림을 갖는다.
   *
   * <p>여기가 주소를 따라간다. 반대로 덮개가 스스로 주소를 바꾸게 하면 열림의 진실이 둘로 나뉘어
   * 뒤로가기와 새로고침에서 어긋난다.
   */
  constructor() {
    effect(() => {
      if (this.new() && this.creating === null) this.openCreate();
      if (!this.new() && this.creating !== null) this.closeCreate();
    });
  }

  // --- 동작 --------------------------------------------------------------------------------------
  protected toggleKind(value: IssueKind): void {
    const all = ISSUE_KIND_FACES.map((face) => face.value);
    this.applyFilter({ kind: toggleFilter(this.kinds(), all, value) });
  }

  protected toggleState(value: string): void {
    const all = ISSUE_STATE_FACES.map((face) => face.value);
    const next = toggleFilter(this.states(), all, value as (typeof all)[number]);
    // 비우면 남은 일로 되돌아간다. 전부 켠 상태는 따로 적어 두어야 유지된다.
    this.applyFilter({ state: next ?? 'all' });
  }

  private openCreate(): void {
    const ref = this.overlay.open(IssueCreateDialog, ROUTES.issues());
    this.creating = ref;

    ref.instance.created.subscribe((id) => {
      this.creating = null;
      ref.close(ROUTES.issue(id));
    });

    ref.instance.dismissed.subscribe(() => {
      this.creating = null;
      ref.close();
    });
  }

  /** 주소가 먼저 바뀐 경우다. 뒤로가기로 덮개를 닫았으므로 이동 없이 걷기만 한다. */
  private closeCreate(): void {
    const ref = this.creating;
    this.creating = null;
    ref?.dismiss();
  }

  private applyFilter(params: Record<string, string | null>): void {
    // 거르개를 바꿀 때 히스토리를 쌓지 않는다. 뒤로가기가 거른 횟수만큼 멈춘다.
    void this.router.navigate([], {
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
