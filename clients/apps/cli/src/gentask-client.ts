import type { Config } from './config.js';
import type { components } from 'api-types';

/**
 * 작업 항목 인터페이스 모델이다.
 */
export type Task = components['schemas']['TaskView'];

/** 프로젝트 요약 정보. */
export type Project = components['schemas']['ProjectView'];

/** 작업 항목 목록용 요약 모델. */
export type IssueSummary = components['schemas']['IssueSummary'];

/** 작업 항목 상세 모델. */
export type Issue = components['schemas']['IssueView'];

export type IssueKind = NonNullable<components['schemas']['CreateIssue']['kind']>;
export type IssueState = components['schemas']['ChangeState']['state'];

/** 문서 목록용 요약 모델. */
export type DocSummary = components['schemas']['DocumentSummary'];

/** 문서 최신 개정 상세 모델. */
export type Doc = components['schemas']['DocumentView'];

/** 개정 이력 목록용 요약 모델. */
export type DocRevisionSummary = components['schemas']['RevisionSummary'];

/** 개정 이력 페이징 응답 모델. */
export type DocRevisionPage = components['schemas']['RevisionPageView'];

/** 특정 시점의 개정 상세 모델. */
export type DocRevision = components['schemas']['RevisionView'];

/**
 * 문서 폴더 요약 모델이다.
 */
export type DocFolder = components['schemas']['DocumentFolderSummary'];

/**
 * 서버 API 오류 예외 클래스다.
 */
export class GentaskError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    detail: string,
  ) {
    super(detail);
    this.name = 'GentaskError';
  }
}

/** 인증 실패 예외. 유효하지 않거나 만료된 토큰인 경우 발생한다. */
export const UNAUTHENTICATED =
  '토큰이 받아들여지지 않았습니다. gentask 의 계정 화면에서 에이전트 토큰을 다시 발급해 설정에 두세요.';

/**
 * 작업 및 백로그 API 클라이언트.
 */
export class GentaskClient {
  constructor(
    private readonly config: Config,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  list(): Promise<readonly Task[]> {
    return this.send<readonly Task[]>('GET', '/api/v1/tasks');
  }

  get(taskId: string): Promise<Task> {
    return this.send<Task>('GET', `/api/v1/tasks/${encodeURIComponent(taskId)}`);
  }

  /** 작업 생성 요청을 전송하고 Location 헤더에서 작업 식별자를 반환한다. */
  async add(title: string, dueDate: string | null): Promise<string> {
    const response = await this.raw('POST', '/api/v1/tasks', { title, dueDate });
    const location = response.headers.get('location') ?? '';
    return location.split('/').pop() ?? '';
  }

  /** 작업 속성 전체를 전송하여 수정을 반영한다. */
  async edit(
    taskId: string,
    fields: {
      title: string;
      note: string;
      dueDate: string | null;
      remindAt: string | null;
    },
  ): Promise<void> {
    await this.raw('PATCH', `/api/v1/tasks/${encodeURIComponent(taskId)}`, fields);
  }

  async setCompleted(taskId: string, completed: boolean): Promise<void> {
    await this.raw('PATCH', `/api/v1/tasks/${encodeURIComponent(taskId)}/completion`, {
      completed,
    });
  }

  async setImportant(taskId: string, important: boolean): Promise<void> {
    await this.raw('PATCH', `/api/v1/tasks/${encodeURIComponent(taskId)}/importance`, {
      important,
    });
  }

  async setMyDay(taskId: string, inMyDay: boolean): Promise<void> {
    await this.raw('PATCH', `/api/v1/tasks/${encodeURIComponent(taskId)}/my-day`, { inMyDay });
  }

  async remove(taskId: string): Promise<void> {
    await this.raw('DELETE', `/api/v1/tasks/${encodeURIComponent(taskId)}`);
  }

  // --- 프로젝트 -----------------------------------------------------------------------------------
  projects(): Promise<readonly Project[]> {
    return this.send<readonly Project[]>('GET', '/api/v1/projects');
  }

  // --- 작업 아이템 --------------------------------------------------------------------------------
  issues(projectId: string): Promise<readonly IssueSummary[]> {
    return this.send<readonly IssueSummary[]>('GET', `${issuesPath(projectId)}`);
  }

  issue(projectId: string, number: number): Promise<Issue> {
    return this.send<Issue>('GET', `${issuesPath(projectId)}/${number}`);
  }

  /** 작업 항목 생성 요청을 전송하고 Location 헤더에서 발급된 일련번호를 반환한다. */
  async addIssue(
    projectId: string,
    fields: { title: string; kind?: IssueKind; body?: string; parentKey?: string | null },
  ): Promise<number> {
    const response = await this.raw('POST', issuesPath(projectId), fields);
    const location = response.headers.get('location') ?? '';
    return Number(location.split('/').pop());
  }

  /** 작업 항목 속성 전체를 전송하여 수정을 반영한다. */
  async editIssue(
    projectId: string,
    number: number,
    fields: { title: string; kind: IssueKind; body: string; parentKey: string | null },
  ): Promise<void> {
    await this.raw('PATCH', `${issuesPath(projectId)}/${number}`, fields);
  }

  async setIssueState(projectId: string, number: number, state: IssueState): Promise<void> {
    await this.raw('PATCH', `${issuesPath(projectId)}/${number}/state`, { state });
  }

  /** 작업 항목을 삭제한다. */
  async removeIssue(projectId: string, number: number): Promise<void> {
    await this.raw('DELETE', `${issuesPath(projectId)}/${number}`);
  }

  // --- 문서 ---------------------------------------------------------------------------------------
  docs(projectId: string): Promise<readonly DocSummary[]> {
    return this.send<readonly DocSummary[]>('GET', docsPath(projectId));
  }

  /** 문서 상세 정보를 조회한다. */
  doc(projectId: string, documentId: string): Promise<Doc> {
    return this.send<Doc>('GET', `${docsPath(projectId)}/${encodeURIComponent(documentId)}`);
  }

  /** 문서 생성 요청을 전송하고 Location 헤더에서 발급된 문서 식별자를 반환한다. */
  async addDoc(
    projectId: string,
    fields: { title: string; body?: string; folderId?: string | null },
  ): Promise<string> {
    const response = await this.raw('POST', docsPath(projectId), fields);
    const location = response.headers.get('location') ?? '';
    return location.split('/').pop() ?? '';
  }

  /** 문서 내용 수정을 전송하고 신규 개정을 등록한다. */
  async editDoc(
    projectId: string,
    documentId: string,
    fields: { title: string; body: string; comment?: string | null },
  ): Promise<void> {
    await this.raw('PATCH', `${docsPath(projectId)}/${encodeURIComponent(documentId)}`, fields);
  }

  /**
   * 문서의 소속 폴더를 변경한다. 문서 이동은 내용 변경이 아니므로 개정 이력을 추가하지 않는다.
   */
  async moveDoc(projectId: string, documentId: string, folderId: string | null): Promise<void> {
    await this.raw('PUT', `${docsPath(projectId)}/${encodeURIComponent(documentId)}/folder`, {
      folderId,
    });
  }

  /**
   * 문서 개정 이력을 페이징 조회한다.
   */
  revisions(
    projectId: string,
    documentId: string,
    page?: { page?: number; size?: number },
  ): Promise<DocRevisionPage> {
    const query = new URLSearchParams();
    if (page?.page !== undefined) {
      query.set('page', String(page.page));
    }
    if (page?.size !== undefined) {
      query.set('size', String(page.size));
    }
    const suffix = query.size === 0 ? '' : `?${query.toString()}`;
    return this.send<DocRevisionPage>('GET', `${revisionsPath(projectId, documentId)}${suffix}`);
  }

  /** 특정 개정 버전의 상세 본문을 조회한다. */
  revision(projectId: string, documentId: string, revisionNo: number): Promise<DocRevision> {
    return this.send<DocRevision>(
      'GET',
      `${revisionsPath(projectId, documentId)}/${revisionNo}`,
    );
  }

  /**
   * 문서를 과거 개정 시점으로 롤백한다. 과거 본문을 담은 신규 개정을 등록하는 방식으로 처리한다.
   */
  async revertDoc(
    projectId: string,
    documentId: string,
    revisionNo: number,
    comment?: string,
  ): Promise<void> {
    await this.raw(
      'POST',
      `${revisionsPath(projectId, documentId)}/${revisionNo}/revert`,
      comment === undefined ? {} : { comment },
    );
  }

  // --- 문서 폴더 ----------------------------------------------------------------------------------
  /** 프로젝트의 전체 폴더 목록을 평탄화된 목록으로 조회한다. */
  folders(projectId: string): Promise<readonly DocFolder[]> {
    return this.send<readonly DocFolder[]>('GET', foldersPath(projectId));
  }

  /** 폴더 생성 요청을 전송하고 Location 헤더에서 발급된 폴더 식별자를 반환한다. */
  async addFolder(
    projectId: string,
    fields: { name: string; parentId?: string | null },
  ): Promise<string> {
    const response = await this.raw('POST', foldersPath(projectId), fields);
    const location = response.headers.get('location') ?? '';
    return location.split('/').pop() ?? '';
  }

  /** 폴더명을 수정한다. */
  async renameFolder(projectId: string, folderId: string, name: string): Promise<void> {
    await this.raw('PATCH', `${foldersPath(projectId)}/${encodeURIComponent(folderId)}`, { name });
  }

  /**
   * 폴더를 대상 상위 폴더로 이동한다. 하위 문서와 자식 폴더가 함께 이동한다.
   */
  async moveFolder(projectId: string, folderId: string, parentId: string | null): Promise<void> {
    await this.raw('PUT', `${foldersPath(projectId)}/${encodeURIComponent(folderId)}/parent`, {
      parentId,
    });
  }

  /** 폴더를 삭제한다. 소속 문서 및 하위 폴더는 상위 계층으로 승격된다. */
  async removeFolder(projectId: string, folderId: string): Promise<void> {
    await this.raw('DELETE', `${foldersPath(projectId)}/${encodeURIComponent(folderId)}`);
  }

  // --- 보조 ---------------------------------------------------------------------------------------

  private async send<T>(method: string, path: string): Promise<T> {
    const response = await this.raw(method, path);
    return (await response.json()) as T;
  }

  private async raw(method: string, path: string, body?: unknown): Promise<Response> {
    const response = await this.fetchFn(`${this.config.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      throw await toError(response);
    }
    return response;
  }
}

function issuesPath(projectId: string): string {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/issues`;
}

function docsPath(projectId: string): string {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/documents`;
}

function foldersPath(projectId: string): string {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/document-folders`;
}

function revisionsPath(projectId: string, documentId: string): string {
  return `${docsPath(projectId)}/${encodeURIComponent(documentId)}/revisions`;
}

/**
 * RFC 9457 오류 응답을 파싱하여 클라이언트 예외로 변환한다.
 */
async function toError(response: Response): Promise<GentaskError> {
  if (response.status === 401) {
    return new GentaskError(401, 'UNAUTHENTICATED', UNAUTHENTICATED);
  }

  let code: string | null = null;
  let detail = `요청이 실패했습니다 (HTTP ${response.status})`;
  try {
    const problem = (await response.json()) as { code?: string; detail?: string };
    code = problem.code ?? null;
    detail = problem.detail ?? detail;
  } catch {
    // 응답 본문이 없거나 JSON 파싱 실패 시 HTTP 상태 코드 기반 기본 메시지를 설정한다.
  }
  return new GentaskError(response.status, code, detail);
}
