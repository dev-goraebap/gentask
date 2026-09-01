import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { MEMO_PANEL, ROUTES } from '@/shared/config';
import { HlmButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { HlmField, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmTextarea } from '@/shared/ui/textarea';
import { MemoService } from '../api/memo-service';
import { parseMemo, summarize, type Memo } from '../model/memo';

/** 곁의 목록에 서는 한 줄. 요약을 미리 만들어 템플릿이 매 그리기마다 다시 세지 않는다. */
interface MemoRow {
  readonly memo: Memo;
  readonly summary: string;
  readonly current: boolean;
}

@Component({
  selector: 'app-memo-list',
  imports: [
    FormRoot,
    FormField,
    RouterLink,
    HlmButton,
    HlmTextarea,
    HlmField,
    HlmFieldLabel,
    AppIcon,
    EmptyState,
  ],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  templateUrl: './memo-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoListPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;
  protected readonly panel = MEMO_PANEL;

  // --- 계약 --------------------------------------------------------------------------------------
  readonly memo = input<string | undefined>(undefined);

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly memoService = inject(MemoService);
  private readonly router = inject(Router);

  // --- 상태 --------------------------------------------------------------------------------------
  protected readonly previewing = signal(false);

  // --- 파생 --------------------------------------------------------------------------------------
  /** 고른 것이 없으면 맨 앞의 것을 편다. 빈 화면으로 들어오는 자리가 아니다. */
  protected readonly selected = computed<Memo | undefined>(() => {
    const id = this.memo();
    return id === undefined ? this.memoService.list()[0] : this.memoService.find(id);
  });

  /**
   * 적고 있는 본문.
   *
   * <p>고른 메모가 바뀌면 그 본문으로 되돌아간다. 신호를 갈아 끼우지 않으면 앞 메모에 적던 것이
   * 다음 메모의 자리에 남는다.
   */
  private readonly draft = linkedSignal(() => ({ body: this.selected()?.body ?? '' }));
  protected readonly bodyForm = form(this.draft);

  protected readonly rows = computed<readonly MemoRow[]>(() =>
    this.memoService.list().map((memo) => ({
      memo,
      summary: summarize(memo.body),
      current: memo.id === this.selected()?.id,
    })),
  );

  protected readonly lines = computed(() => parseMemo(this.draft().body));

  // --- 동작 --------------------------------------------------------------------------------------
  protected showWriting(): void {
    this.previewing.set(false);
  }

  protected showPreview(): void {
    this.previewing.set(true);
  }

  protected save(): void {
    const current = this.selected();
    if (current === undefined) return;
    this.memoService.write(current.id, this.draft().body);
  }

  protected async addMemo(): Promise<void> {
    const id = this.memoService.add();
    await this.router.navigate([], { queryParams: MEMO_PANEL.open(id), replaceUrl: true });
  }
}
