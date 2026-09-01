import { isPlatformServer } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, type Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS } from '@/shared/api';
import { CURRENT_PROJECT_KEY } from '@/shared/config';
import { issueNumberOf, type Issue, type IssueKind, type IssueState, type IssueSummary } from '../model/issue';

/** 서버가 내는 목록의 한 줄. 화면의 어휘와 이름이 갈리는 자리는 여기서 맞춘다. */
interface IssueSummaryResponse {
  readonly id: string;
  readonly key: string;
  readonly number: number;
  readonly kind: IssueKind;
  readonly state: IssueState;
  readonly title: string;
  readonly parentKey: string | null;
  readonly dueDate: string | null;
  readonly closedAt: string | null;
  readonly childCount: number;
  readonly closedChildCount: number;
  readonly criteriaCount: number;
  readonly unverifiedCount: number;
}

interface IssueResponse {
  readonly summary: IssueSummaryResponse;
  readonly body: string;
  readonly criteria: readonly {
    readonly number: number;
    readonly sentence: string;
    readonly verified: boolean;
    readonly retired: boolean;
  }[];
  readonly authorName: string;
  readonly createdAt: string;
}

/**
 * 작업 아이템.
 *
 * <p>화면이 다니는 식별자는 사람이 부르는 이름(`TG-030`)이고 API 가 받는 것은 프로젝트 안의 번호다.
 * 주소가 앞의 것을 담으므로 이 자리가 둘을 잇는다.
 */
@Injectable()
export class IssueService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly httpClient = inject(HttpClient);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  /** 지금 프로젝트는 라우트가 내려 준다. 슬라이스끼리 직접 참조하지 않기 위해서다. */
  private readonly projectKey = inject(CURRENT_PROJECT_KEY);

  private readonly resource = httpResource<readonly IssueSummaryResponse[]>(() => {
    const key = this.projectKey();
    return this.isServer || key === undefined ? undefined : ENDPOINTS.issues(key);
  });

  readonly list = computed<readonly IssueSummary[]>(() =>
    this.resource.hasValue() ? this.resource.value().map(toSummary) : [],
  );

  readonly status = this.resource.status;

  // --- 동작 --------------------------------------------------------------------------------------
  /** 목록에 이미 실려 있는 것에서 찾는다. 상세의 부모 줄이 이것을 쓴다. */
  find(id: string): IssueSummary | undefined {
    return this.list().find((issue) => issue.id === id);
  }

  /**
   * 세운 것의 이름을 낸다. 호출부가 곧바로 그 자리로 옮기거나 덮개를 닫기 때문이다.
   *
   * <p>이름을 여기서 만들지 않고 세운 것을 다시 물어 받는다. 접두어와 번호를 붙이는 규칙이 서버와
   * 화면 두 곳에 생기면 한쪽만 바뀌었을 때 링크가 조용히 어긋난다.
   */
  async add(title: string, kind: IssueKind, body = ''): Promise<string | undefined> {
    const projectKey = this.projectKey();
    if (projectKey === undefined) return undefined;

    const created = await firstValueFrom(
      this.httpClient.post(ENDPOINTS.issues(projectKey), { title, kind, body }, { observe: 'response' }),
    );
    const location = created.headers.get('Location') ?? '';
    const number = Number(location.slice(location.lastIndexOf('/') + 1));

    const detail = await firstValueFrom(
      this.httpClient.get<IssueResponse>(ENDPOINTS.issue(projectKey, number)),
    );
    this.resource.reload();

    return detail.summary.key;
  }

  async setState(id: string, state: IssueState): Promise<void> {
    const projectKey = this.projectKey();
    if (projectKey === undefined) return;

    await firstValueFrom(
      this.httpClient.patch(ENDPOINTS.issueState(projectKey, issueNumberOf(id)), { state }),
    );
    this.resource.reload();
  }

  /**
   * 상세 하나를 싣는다.
   *
   * <p>목록의 줄은 본문과 인수 조건을 갖지 않으므로 상세는 따로 묻는다. 주입 자리에서 불러야 하며,
   * 받은 신호가 바뀌면 스스로 다시 싣는다.
   */
  detailOf(id: Signal<string | undefined>): Signal<Issue | undefined> {
    const resource = httpResource<Issue>(
      () => {
        const projectKey = this.projectKey();
        const raw = id();
        if (this.isServer || projectKey === undefined || raw === undefined) return undefined;

        // 주소에 이름이 아닌 것이 들어올 수 있다. 그때는 묻지 않고 없는 것으로 둔다 — 물으면 서버가
        // 잘못된 요청으로 답하는데, 주소를 손으로 고친 사람이 보아야 하는 것은 없다는 말이다.
        const number = issueNumberOf(raw);
        return Number.isInteger(number) ? ENDPOINTS.issue(projectKey, number) : undefined;
      },
      { parse: (raw) => toIssue(raw as IssueResponse) },
    );

    return computed(() => (resource.hasValue() ? resource.value() : undefined));
  }
}

function toSummary(response: IssueSummaryResponse): IssueSummary {
  return {
    // 화면은 사람이 부르는 이름으로 다닌다. 주소가 그것을 담기 때문이다.
    id: response.key,
    number: response.number,
    kind: response.kind,
    title: response.title,
    state: response.state,
    parentId: response.parentKey,
    dueDate: response.dueDate,
    closedOn: response.closedAt === null ? null : response.closedAt.slice(0, 10),
    childCount: response.childCount,
    closedChildCount: response.closedChildCount,
    criteriaCount: response.criteriaCount,
    unverifiedCount: response.unverifiedCount,
    // 문서 잇기는 아직 서버에 자리가 없다.
    linkedDocTitle: null,
  };
}

function toIssue(response: IssueResponse): Issue {
  return {
    ...toSummary(response.summary),
    body: response.body,
    criteria: response.criteria,
    createdOn: response.createdAt.slice(0, 10),
    authorName: response.authorName,
    // 아래 셋은 아직 서버에 자리가 없다. 저장소 잇기와 문서가 정해져야 채워진다.
    linkedDocIds: [],
    commits: [],
    attachmentNames: [],
  };
}
