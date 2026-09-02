import { isPlatformServer } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
  type ResourceStatus,
  type Signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS, type RevisionPageView, type RevisionView } from '@/shared/api';
import { CURRENT_PROJECT_ID } from '@/shared/config';
import type { Doc, DocFolder, DocSummary } from '../model/doc';

/**
 * 이력 한 쪽에 담는 수.
 *
 * <p>한 화면에 담기지 않는 것을 전제로 한다(DOC-004 A3). 서버의 기본값과 같으나 넘기는 쪽이
 * 정하는 값이므로 이 자리에 둔다.
 */
const REVISION_PAGE_SIZE = 20;

/** 서버가 내는 목록의 한 줄. 화면의 어휘와 이름이 갈리는 자리는 여기서 맞춘다. */
interface DocumentSummaryResponse {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface DocumentResponse {
  readonly summary: DocumentSummaryResponse;
  readonly body: string;
  readonly revisionNo: number;
  readonly authorName: string;
}

/**
 * 문서.
 *
 * <p>주소와 API 가 담는 것이 같다. 작업 아이템과 달리 문서는 번호를 매기지 않으므로 사람이 부르는
 * 이름과 식별자를 잇는 자리가 없다.
 *
 * <p>폴더는 아직 이 자리 안에서만 산다. 서버가 갖지 않으므로(GT-70) 실어 온 문서는 모두 뿌리에
 * 서며, 화면이 이미 가진 폴더 칸은 목 위에 그대로 둔다.
 */
@Injectable()
export class DocService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly httpClient = inject(HttpClient);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  /** 지금 프로젝트는 라우트가 내려 준다. 슬라이스끼리 직접 참조하지 않기 위해서다. */
  private readonly projectId = inject(CURRENT_PROJECT_ID);

  // --- 상태 --------------------------------------------------------------------------------------
  /** 목. 서버에 폴더가 없어(GT-70) 화면 안에서만 살고 새로 고치면 사라진다. */
  private readonly folderList = signal<readonly DocFolder[]>([]);

  // --- 파생 --------------------------------------------------------------------------------------
  private readonly resource = httpResource<readonly DocumentSummaryResponse[]>(() => {
    const id = this.projectId();
    return this.isServer || id === undefined ? undefined : ENDPOINTS.docs(id);
  });

  readonly list = computed<readonly DocSummary[]>(() =>
    this.resource.hasValue() ? this.resource.value().map(toSummary) : [],
  );

  readonly status = this.resource.status;

  readonly folders = this.folderList.asReadonly();

  // --- 동작 --------------------------------------------------------------------------------------
  /** 목록에 이미 실려 있는 것에서 찾는다. 본문이 필요 없는 자리가 이것을 쓴다. */
  find(id: string): DocSummary | undefined {
    return this.list().find((doc) => doc.id === id);
  }

  /**
   * 세운 것의 식별자를 낸다. 호출부가 곧바로 그 자리로 옮기기 때문이다.
   *
   * <p>세우는 것이 곧 첫 개정을 남기는 것이므로 본문을 함께 넘긴다(DOC-001). 본문이 비어 있어도
   * 세운다 — 검증하는 것은 제목뿐이다.
   */
  async add(title: string, body = ''): Promise<string | undefined> {
    const projectId = this.projectId();
    if (projectId === undefined) return undefined;

    const created = await firstValueFrom(
      this.httpClient.post(ENDPOINTS.docs(projectId), { title, body }, { observe: 'response' }),
    );
    const location = created.headers.get('Location') ?? '';
    const id = location.slice(location.lastIndexOf('/') + 1);

    this.resource.reload();

    return id === '' ? undefined : id;
  }

  /**
   * 제목과 본문을 고친다.
   *
   * <p>개정 사유는 적지 않아도 된다(DOC-003). 앞의 개정과 같은 것을 담으면 개정을 만들지 않으며
   * 그 판정은 서버가 갖는다(DOC-003 A2).
   */
  async edit(
    id: string,
    title: string,
    body: string,
    comment: string | null = null,
  ): Promise<void> {
    const projectId = this.projectId();
    if (projectId === undefined) return;

    await firstValueFrom(
      this.httpClient.patch(ENDPOINTS.doc(projectId, id), { title, body, comment }),
    );
    this.resource.reload();
  }

  /**
   * 상세 하나를 싣는다.
   *
   * <p>목록의 줄은 본문을 갖지 않으므로 상세는 따로 묻는다. 주입 자리에서 불러야 하며, 받은 신호가
   * 바뀌면 스스로 다시 싣는다.
   */
  detailOf(id: Signal<string | undefined>): DocDetail {
    const resource = httpResource<Doc>(
      () => {
        const projectId = this.projectId();
        const documentId = id();
        if (this.isServer || projectId === undefined || documentId === undefined) return undefined;

        return ENDPOINTS.doc(projectId, documentId);
      },
      { parse: (raw) => toDoc(raw as DocumentResponse) },
    );

    return {
      value: computed(() => (resource.hasValue() ? resource.value() : undefined)),
      reload: () => resource.reload(),
    };
  }

  /**
   * 개정 이력 한 쪽을 싣는다.
   *
   * <p>최근 것부터 온다. 한 쪽에 담기지 않으면 쪽을 넘겨 더 본다(DOC-004 A3) — 몇 쪽인지는 부르는
   * 쪽이 쥐며, 그 값이 바뀌면 스스로 다시 싣는다.
   *
   * <p>목록의 줄은 본문을 갖지 않는다. 이력을 여는 이유의 대부분은 언제 왜 고쳤는지를 훑는 것이고,
   * 개정마다 본문 전체를 실으면 훑는 값이 문서 전체의 몇 배가 된다.
   */
  revisionsOf(id: Signal<string | undefined>, page: Signal<number>): DocRevisions {
    const resource = httpResource<RevisionPageView>(() => {
      const projectId = this.projectId();
      const documentId = id();
      if (this.isServer || projectId === undefined || documentId === undefined) return undefined;

      return {
        url: ENDPOINTS.docRevisions(projectId, documentId),
        params: { page: page(), size: REVISION_PAGE_SIZE },
      };
    });

    return {
      value: computed(() => (resource.hasValue() ? resource.value() : undefined)),
      status: resource.status,
      reload: () => resource.reload(),
    };
  }

  /**
   * 개정 하나의 그때 본문을 싣는다.
   *
   * <p>개정마다 본문 전체를 갖는다(DOC-004). 앞의 것을 이어붙여 되살리지 않으므로 이 한 번으로
   * 그릴 것이 전부 온다.
   */
  revisionOf(id: Signal<string | undefined>, revisionNo: Signal<number | undefined>): DocRevision {
    const resource = httpResource<RevisionView>(() => {
      const projectId = this.projectId();
      const documentId = id();
      const no = revisionNo();
      if (
        this.isServer ||
        projectId === undefined ||
        documentId === undefined ||
        no === undefined
      ) {
        return undefined;
      }

      return ENDPOINTS.docRevision(projectId, documentId, no);
    });

    return {
      value: computed(() => (resource.hasValue() ? resource.value() : undefined)),
      status: resource.status,
      reload: () => resource.reload(),
    };
  }

  /**
   * 고른 개정의 본문을 담은 <b>새 개정</b>을 남긴다.
   *
   * <p>사이의 개정을 지우지 않는다(DOC-005). 되돌리기도 앞으로 가는 것이므로 지우는 길은 없다.
   *
   * <p>되돌린 이유는 적지 않아도 된다(DOC-005 A3). 적지 않으면 몇 번째로 되돌렸는지를 서버가 스스로
   * 적으므로 이 자리가 대신 지어내지 않는다.
   */
  async revert(id: string, revisionNo: number, comment: string | null = null): Promise<void> {
    const projectId = this.projectId();
    if (projectId === undefined) return;

    await firstValueFrom(
      this.httpClient.post(ENDPOINTS.docRevisionRevert(projectId, id, revisionNo), { comment }),
    );
    this.resource.reload();
  }

  /** 목. 폴더가 서버에 서면(GT-70) 이 자리가 HTTP 로 바뀐다. */
  addFolder(name: string, parentId: string | null): void {
    this.folderList.update((folders) => [
      ...folders,
      {
        id: `folder-${folders.length + 1}`,
        name,
        parentId,
        docCount: 0,
        updatedOn: new Date().toISOString().slice(0, 10),
      },
    ]);
  }
}

/**
 * 상세 하나를 싣는 자리.
 *
 * <p>다시 싣는 길을 함께 낸다. 목록과 다른 리소스라 목록만 다시 실으면 방금 고친 것이 화면에 남지
 * 않는다.
 */
export interface DocDetail {
  readonly value: Signal<Doc | undefined>;
  readonly reload: () => void;
}

/**
 * 개정 이력 한 쪽을 싣는 자리.
 *
 * <p>실패를 함께 낸다. 이력이 하나뿐인 문서는 있어도 이력이 없는 문서는 없으므로(DOC-004 A2),
 * 비어 있는 것과 싣지 못한 것을 같은 화면으로 그리면 없는 일을 있다고 그리게 된다.
 */
export interface DocRevisions {
  readonly value: Signal<RevisionPageView | undefined>;
  readonly status: Signal<ResourceStatus>;
  readonly reload: () => void;
}

export interface DocRevision {
  readonly value: Signal<RevisionView | undefined>;
  readonly status: Signal<ResourceStatus>;
  readonly reload: () => void;
}

function toSummary(response: DocumentSummaryResponse): DocSummary {
  return {
    id: response.id,
    title: response.title,
    updatedOn: response.updatedAt.slice(0, 10),
    // 아래 셋은 아직 서버에 자리가 없다. 폴더(GT-70) · 첨부(GT-71) · 작업 아이템 잇기(GT-72) 다.
    folderId: null,
    linkedIssueCount: 0,
    attachmentCount: 0,
  };
}

function toDoc(response: DocumentResponse): Doc {
  return {
    ...toSummary(response.summary),
    body: response.body,
    revisionNo: response.revisionNo,
    authorName: response.authorName,
    // 첨부(GT-71)와 작업 아이템 잇기(GT-72)는 아직 서버에 자리가 없다.
    attachments: [],
    linkedIssues: [],
  };
}
