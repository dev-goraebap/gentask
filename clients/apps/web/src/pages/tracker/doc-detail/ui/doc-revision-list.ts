import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { RevisionSummary } from '@/shared/api';
import { AppIcon } from '@/shared/ui/icon';

/** 한 줄과 그 줄이 여는 자리. 주소가 열림의 진실이므로 고르는 것도 링크다. */
interface RevisionRow {
  readonly summary: RevisionSummary;
  readonly at: string;
  readonly comment: string;
  readonly chosen: boolean;
  readonly compared: boolean;
  /** 지금 참인 개정인가. 되돌려도 담기지 않는 자리라 표시가 있어야 한다(DOC-005 A2). */
  readonly current: boolean;
  readonly view: Record<string, number | null>;
  /** 견줄 상대로 삼는 자리. 아직 아무것도 고르지 않았거나 자기 자신이면 없다. */
  readonly compare: Record<string, number | null> | null;
}

/**
 * 지나온 개정을 최근 것부터 늘어놓는 자리.
 *
 * <p>줄에 본문을 싣지 않는다(DOC-004). 이력을 여는 이유의 대부분은 되돌리려는 것이 아니라 언제 왜
 * 그렇게 되었는지를 훑는 것이므로, 훑는 데 필요한 넷만 담는다 — 몇 번째인지 · 언제 · 누가 · 사유.
 */
@Component({
  selector: 'app-doc-revision-list',
  imports: [RouterLink, AppIcon],
  templateUrl: './doc-revision-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocRevisionList {
  // --- 계약 --------------------------------------------------------------------------------------
  readonly items = input.required<readonly RevisionSummary[]>();
  readonly total = input.required<number>();
  readonly page = input.required<number>();
  readonly size = input.required<number>();
  /** 이 문서의 주소. 고르는 것은 쿼리만 바꾸므로 경로는 언제나 같다. */
  readonly link = input.required<string>();
  readonly chosen = input<number | undefined>(undefined);
  readonly against = input<number | undefined>(undefined);
  readonly currentNo = input<number | undefined>(undefined);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly rows = computed<readonly RevisionRow[]>(() => {
    const chosen = this.chosen();
    const against = this.against();
    const currentNo = this.currentNo();
    const page = this.page();

    return this.items().map((summary) => ({
      summary,
      at: describeAt(summary.createdAt),
      // 적지 않아도 되는 자리라(DOC-003) 비어 있는 것이 잘못이 아니다. 빈 줄로 두지 않고 그렇게 적는다.
      comment: summary.comment ?? '사유를 적지 않았습니다',
      chosen: summary.revisionNo === chosen,
      compared: summary.revisionNo === against,
      current: summary.revisionNo === currentNo,
      view: { revisions: 1, rev: summary.revisionNo, against: null, revPage: pageParam(page) },
      compare:
        chosen === undefined || chosen === summary.revisionNo
          ? null
          : {
              revisions: 1,
              rev: chosen,
              against: summary.revisionNo,
              revPage: pageParam(page),
            },
    }));
  });

  /** 몇 번째부터 몇 번째까지 보고 있는가. 더 있는지를 단추의 유무만으로 말하지 않는다. */
  protected readonly range = computed(() => {
    const total = this.total();
    if (total === 0) return '';

    const first = this.page() * this.size() + 1;
    const last = Math.min(first + this.items().length - 1, total);
    return `${total}개 중 ${first}–${last}`;
  });

  protected readonly older = computed(() =>
    (this.page() + 1) * this.size() < this.total() ? this.pageLink(this.page() + 1) : null,
  );

  protected readonly newer = computed(() =>
    this.page() > 0 ? this.pageLink(this.page() - 1) : null,
  );

  // --- 내부 --------------------------------------------------------------------------------------
  /** 쪽을 넘겨도 고른 것은 그대로 둔다. 넘기는 일과 고르는 일이 서로를 지우지 않는다. */
  private pageLink(page: number): Record<string, number | null> {
    return {
      revisions: 1,
      rev: this.chosen() ?? null,
      against: this.against() ?? null,
      revPage: pageParam(page),
    };
  }
}

/** 첫 쪽은 주소에 적지 않는다. 기본값을 실으면 같은 자리를 가리키는 주소가 둘이 된다. */
function pageParam(page: number): number | null {
  return page === 0 ? null : page;
}

function describeAt(at: string): string {
  return new Date(at).toLocaleString('ko-KR');
}
