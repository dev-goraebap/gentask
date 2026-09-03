import { isPlatformServer } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  type ResourceStatus,
  type Signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ENDPOINTS,
  type DocumentFolderSummary,
  type DocumentSummary,
  type DocumentView,
  type RevisionPageView,
  type RevisionView,
} from '@/shared/api';
import { CURRENT_PROJECT_ID } from '@/shared/config';
import type { Doc, DocFolder, DocSummary } from '../model/doc';

/**
 * 이력 한 쪽에 담는 수.
 *
 * 한 화면에 담기지 않는 것을 전제로 한다(DOC-004 A3). 서버의 기본값과 같으나 넘기는 쪽이
 * 정하는 값이므로 이 자리에 둔다.
 */
const REVISION_PAGE_SIZE = 20;

/**
 * 문서와 문서를 담는 폴더.
 *
 * 주소와 API 가 담는 것이 같다. 작업 아이템과 달리 문서는 번호를 매기지 않으므로 사람이 부르는
 * 폴더명과 식별자 매핑은 서비스가 담당한다.
 *
 * 폴더는 평평한 목록에 담긴 자리를 실어 온다. 계층으로 세우는 것은 화면이 하며(`foldersIn`),
 * 그래서 폴더 하나를 고쳐도 다시 묻는 것은 이 목록 하나다.
 */
@Injectable()
export class DocService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly httpClient = inject(HttpClient);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  /** 지금 프로젝트는 라우트가 내려 준다. 슬라이스끼리 직접 참조하지 않기 위해서다. */
  private readonly projectId = inject(CURRENT_PROJECT_ID);

  // --- 파생 --------------------------------------------------------------------------------------
  private readonly resource = httpResource<readonly DocumentSummary[]>(() => {
    const id = this.projectId();
    return this.isServer || id === undefined ? undefined : ENDPOINTS.docs(id);
  });

  private readonly folderResource = httpResource<readonly DocumentFolderSummary[]>(() => {
    const id = this.projectId();
    return this.isServer || id === undefined ? undefined : ENDPOINTS.docFolders(id);
  });

  readonly list = computed<readonly DocSummary[]>(() =>
    this.resource.hasValue() ? this.resource.value().map(toSummary) : [],
  );

  readonly status = this.resource.status;

  readonly folders = computed<readonly DocFolder[]>(() =>
    this.folderResource.hasValue() ? this.folderResource.value().map(toFolder) : [],
  );

  readonly folderStatus = this.folderResource.status;

  // --- 동작 --------------------------------------------------------------------------------------
  /** 목록에 이미 실려 있는 것에서 찾는다. 본문이 필요 없는 자리가 이것을 쓴다. */
  find(id: string): DocSummary | undefined {
    return this.list().find((doc) => doc.id === id);
  }

  /** 둘 다 다시 묻는다. 싣지 못한 자리가 다시 시도하는 길이다. */
  reload(): void {
    this.resource.reload();
    this.folderResource.reload();
  }

  /**
   * 생성된 문서의 식별자를 반환한다.
   *
   * 세우는 것이 곧 첫 개정을 남기는 것이므로 본문을 함께 넘긴다(DOC-001). 본문이 비어 있어도
   * 세운다 — 검증하는 것은 제목뿐이다.
   *
   * 지금 열어 둔 자리가 담길 자리가 된다. 세우고 나서 다시 옮기게 하지 않기 위해서다.
   */
  async add(title: string, body = '', folderId: string | null = null): Promise<string | undefined> {
    const projectId = this.projectId();
    if (projectId === undefined) return undefined;

    const created = await firstValueFrom(
      this.httpClient.post(
        ENDPOINTS.docs(projectId),
        { title, body, folderId },
        { observe: 'response' },
      ),
    );
    const location = created.headers.get('Location') ?? '';
    const id = location.slice(location.lastIndexOf('/') + 1);

    this.reload();

    return id === '' ? undefined : id;
  }

  /**
   * 제목과 본문을 고친다.
   *
   * 개정 사유는 적지 않아도 된다(DOC-003). 앞의 개정과 같은 것을 담으면 개정을 만들지 않으며
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
   * 문서가 담긴 자리를 바꾼다(DOC-006).
   *
   * 옮기는 것은 개정이 아니다. 본문도 제목도 건드리지 않으므로 상세를 다시 싣지 않는다.
   * 자리를 비우면 최상위로 간다(DOC-006 A1).
   */
  async moveDoc(id: string, folderId: string | null): Promise<void> {
    const projectId = this.projectId();
    if (projectId === undefined) return;

    await firstValueFrom(this.httpClient.put(ENDPOINTS.docParent(projectId, id), { folderId }));
    // 폴더가 담은 수도 함께 바뀌므로 둘을 같이 묻는다.
    this.reload();
  }

  /**
   * 상세 하나를 싣는다.
   *
   * 목록의 줄은 본문을 갖지 않으므로 상세는 따로 묻는다. 주입 자리에서 불러야 하며, 받은 신호가
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
      { parse: (raw) => toDoc(raw as DocumentView) },
    );

    return {
      value: computed(() => (resource.hasValue() ? resource.value() : undefined)),
      reload: () => resource.reload(),
    };
  }

  /**
   * 개정 이력 한 쪽을 싣는다.
   *
   * 최근 것부터 온다. 한 쪽에 담기지 않으면 쪽을 넘겨 더 본다(DOC-004 A3) — 몇 쪽인지는 부르는
   * 쪽이 쥐며, 그 값이 바뀌면 스스로 다시 싣는다.
   *
   * 목록의 줄은 본문을 갖지 않는다. 이력을 여는 이유의 대부분은 언제 왜 고쳤는지를 훑는 것이고,
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
   * 개정별 전체 본문을 조회한다(DOC-004).
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
   * 고른 개정의 본문을 담은 새 개정을 남긴다.
   *
   * 사이의 개정을 지우지 않는다(DOC-005). 되돌리기도 앞으로 가는 것이므로 지우는 길은 없다.
   *
   * 되돌린 이유는 적지 않아도 된다(DOC-005 A3). 적지 않으면 몇 번째로 되돌렸는지를 서버가 스스로
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

  /** 지금 열어 둔 자리 아래에 선다(DOC-008 기본 흐름 6). 이름이 겹쳐도 막지 않는다(DOC-008 A2). */
  async addFolder(name: string, parentId: string | null): Promise<void> {
    const projectId = this.projectId();
    if (projectId === undefined) return;

    await firstValueFrom(this.httpClient.post(ENDPOINTS.docFolders(projectId), { name, parentId }));
    this.folderResource.reload();
  }

  /** 이름을 바꿔도 그 폴더를 가리키던 길은 끊기지 않는다. 가리키는 것이 식별자이기 때문이다(DOC-008 A4). */
  async renameFolder(id: string, name: string): Promise<void> {
    const projectId = this.projectId();
    if (projectId === undefined) return;

    await firstValueFrom(this.httpClient.patch(ENDPOINTS.docFolder(projectId, id), { name }));
    this.folderResource.reload();
  }

  /**
   * 폴더를 다른 자리로 옮긴다(DOC-008 A5). 담긴 문서와 하위 폴더가 함께 간다.
   *
   * 자기 자신이나 자손 아래로는 갈 수 없다(DOC-008 A6). 그 판정은 서버가 쥐며 어긴 요청은
   * 409 로 돌아온다.
   */
  async moveFolder(id: string, parentId: string | null): Promise<void> {
    const projectId = this.projectId();
    if (projectId === undefined) return;

    await firstValueFrom(this.httpClient.put(ENDPOINTS.docFolderParent(projectId, id), { parentId }));
    this.folderResource.reload();
  }

  /**
   * 폴더를 지운다(DOC-008 A7).
   *
   * 담긴 것을 함께 지우지 않는다. 문서와 하위 폴더는 한 단계 위로 올라오므로 둘 다 다시 묻는다.
   */
  async removeFolder(id: string): Promise<void> {
    const projectId = this.projectId();
    if (projectId === undefined) return;

    await firstValueFrom(this.httpClient.delete(ENDPOINTS.docFolder(projectId, id)));
    this.reload();
  }
}

/**
 * 상세 하나를 싣는 자리.
 *
 * 다시 싣는 길을 함께 낸다. 목록과 다른 리소스라 목록만 다시 실으면 방금 고친 것이 화면에 남지
 * 않는다.
 */
export interface DocDetail {
  readonly value: Signal<Doc | undefined>;
  readonly reload: () => void;
}

/**
 * 개정 이력 한 쪽을 싣는 자리.
 *
 * 실패를 함께 낸다. 이력이 하나뿐인 문서는 있어도 이력이 없는 문서는 없으므로(DOC-004 A2),
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

function toSummary(response: DocumentSummary): DocSummary {
  return {
    id: response.id,
    title: response.title,
    folderId: response.folderId,
    updatedOn: response.updatedAt.slice(0, 10),
    // 아래 둘은 아직 서버에 자리가 없다. 첨부(GT-71) · 작업 아이템 잇기(GT-72) 다.
    linkedIssueCount: 0,
    attachmentCount: 0,
  };
}

function toFolder(response: DocumentFolderSummary): DocFolder {
  return {
    id: response.id,
    name: response.name,
    parentId: response.parentId,
    docCount: response.documentCount,
    folderCount: response.folderCount,
    updatedOn: response.updatedAt.slice(0, 10),
  };
}

function toDoc(response: DocumentView): Doc {
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
