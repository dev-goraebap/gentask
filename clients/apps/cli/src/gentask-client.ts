import type { Config } from './config.js';
import type { components } from 'api-types';

/**
 * 작업 하나.
 *
 * <p>손으로 적지 않고 API 명세가 만든 것을 쓴다(결정-0003). 계약이 바뀌면 이 자리가 컴파일 오류로
 * 드러나며, 다시 적어 두면 그 변화가 조용히 지나간다.
 */
export type Task = components['schemas']['TaskView'];

/** 프로젝트 하나. `id` 가 주소에 담기고 `key` 는 작업 아이템 이름의 접두어다. */
export type Project = components['schemas']['ProjectView'];

/** 목록의 작업 아이템 한 줄. */
export type IssueSummary = components['schemas']['IssueSummary'];

/** 본문과 인수 조건까지 담은 작업 아이템. */
export type Issue = components['schemas']['IssueView'];

export type IssueKind = NonNullable<components['schemas']['CreateIssue']['kind']>;
export type IssueState = components['schemas']['ChangeState']['state'];

/** 목록의 문서 한 줄. */
export type DocSummary = components['schemas']['DocumentSummary'];

/** 지금 참인 개정의 본문까지 담은 문서. */
export type Doc = components['schemas']['DocumentView'];

/** 개정 이력의 한 줄. 본문은 담지 않는다. */
export type DocRevisionSummary = components['schemas']['RevisionSummary'];

/** 이력의 한 쪽. 전체 수를 함께 주므로 더 볼 것이 남았는지 부르는 쪽이 안다. */
export type DocRevisionPage = components['schemas']['RevisionPageView'];

/** 그때의 제목과 본문까지 담은 개정 하나. */
export type DocRevision = components['schemas']['RevisionView'];

/**
 * 문서를 담는 자리 하나.
 *
 * <p>목록은 평평하게 오고 계층은 `parentId` 가 갖는다. 조립은 부르는 쪽이 한다(DOC-008).
 */
export type DocFolder = components['schemas']['DocumentFolderSummary'];

/**
 * 서버가 거절했다.
 *
 * <p>사유를 그대로 옮긴다. 다시 시도할지 사용자에게 물을지는 이 서버가 정하지 않고 에이전트가 정한다.
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

/** 자격이 서지 않았다. 토큰을 다시 발급해야 하는 자리이며 AGT-001 의 A2 다. */
export const UNAUTHENTICATED =
  '토큰이 받아들여지지 않았습니다. gentask 의 계정 화면에서 에이전트 토큰을 다시 발급해 설정에 두세요.';

/**
 * 작업 API 를 부르는 자리.
 *
 * <p>판정하거나 저장하는 것이 없다. 규칙은 모두 서버가 가지며 여기는 옮기기만 한다.
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

  /** 만든 작업의 식별자는 Location 헤더가 낸다. */
  async add(title: string, dueDate: string | null): Promise<string> {
    const response = await this.raw('POST', '/api/v1/tasks', { title, dueDate });
    const location = response.headers.get('location') ?? '';
    return location.split('/').pop() ?? '';
  }

  /** 네 값을 함께 보낸다. 서버의 편집은 부분 갱신이 아니라 그 넷을 그대로 받는다. */
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

  /** 세운 것의 번호는 Location 헤더가 낸다. 번호는 서버가 매긴다. */
  async addIssue(
    projectId: string,
    fields: { title: string; kind?: IssueKind; body?: string; parentKey?: string | null },
  ): Promise<number> {
    const response = await this.raw('POST', issuesPath(projectId), fields);
    const location = response.headers.get('location') ?? '';
    return Number(location.split('/').pop());
  }

  /** 셋을 함께 보낸다. 서버의 편집은 부분 갱신이 아니라 그 셋을 그대로 받는다. */
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

  /** 되살릴 자리가 없다. 되묻는 것은 이 자리가 아니라 부르는 쪽이 한다(ITM-005). */
  async removeIssue(projectId: string, number: number): Promise<void> {
    await this.raw('DELETE', `${issuesPath(projectId)}/${number}`);
  }

  // --- 문서 ---------------------------------------------------------------------------------------
  docs(projectId: string): Promise<readonly DocSummary[]> {
    return this.send<readonly DocSummary[]>('GET', docsPath(projectId));
  }

  /** 본문은 여기에만 있다. 목록의 줄은 제목과 때만 갖는다. */
  doc(projectId: string, documentId: string): Promise<Doc> {
    return this.send<Doc>('GET', `${docsPath(projectId)}/${encodeURIComponent(documentId)}`);
  }

  /** 세운 것의 식별자는 Location 헤더가 낸다. 문서는 번호를 매기지 않는다. */
  async addDoc(
    projectId: string,
    fields: { title: string; body?: string; folderId?: string | null },
  ): Promise<string> {
    const response = await this.raw('POST', docsPath(projectId), fields);
    const location = response.headers.get('location') ?? '';
    return location.split('/').pop() ?? '';
  }

  /** 제목과 본문을 함께 보낸다. 서버의 편집은 부분 갱신이 아니라 그 둘을 그대로 받는다. */
  async editDoc(
    projectId: string,
    documentId: string,
    fields: { title: string; body: string; comment?: string | null },
  ): Promise<void> {
    await this.raw('PATCH', `${docsPath(projectId)}/${encodeURIComponent(documentId)}`, fields);
  }

  /**
   * 문서가 담긴 자리를 바꾼다.
   *
   * <p>본문도 제목도 건드리지 않으므로 개정이 쌓이지 않는다(DOC-006). 값을 비우면 뿌리로 간다.
   */
  async moveDoc(projectId: string, documentId: string, folderId: string | null): Promise<void> {
    await this.raw('PUT', `${docsPath(projectId)}/${encodeURIComponent(documentId)}/folder`, {
      folderId,
    });
  }

  /**
   * 개정 이력의 한 쪽을 읽는다.
   *
   * <p>최근 것부터 오는 것은 서버가 정한다. 여기서 다시 세우지 않는 것은 두 자리가 어긋날 때 어느
   * 쪽이 참인지 판정할 근거가 없기 때문이다.
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

  /** 그때의 본문은 여기에만 있다. 이력의 줄은 번호와 때와 사유만 갖는다. */
  revision(projectId: string, documentId: string, revisionNo: number): Promise<DocRevision> {
    return this.send<DocRevision>(
      'GET',
      `${revisionsPath(projectId, documentId)}/${revisionNo}`,
    );
  }

  /**
   * 그 개정의 본문을 담은 새 개정을 남긴다.
   *
   * <p>사이의 개정을 지우지 않으므로 되돌리기도 앞으로 가는 것이다(DOC-005). 사유를 넘기지 않으면
   * 서버가 몇 번으로 되돌렸는지를 스스로 적으므로 여기서 그 문구를 만들지 않는다.
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
  /** 프로젝트의 폴더 전부가 평평하게 온다. 트리로 세우는 것은 부르는 쪽의 일이다. */
  folders(projectId: string): Promise<readonly DocFolder[]> {
    return this.send<readonly DocFolder[]>('GET', foldersPath(projectId));
  }

  /** 세운 것의 식별자는 Location 헤더가 낸다. 같은 이름이 이미 있어도 서버가 막지 않는다(DOC-008 A2). */
  async addFolder(
    projectId: string,
    fields: { name: string; parentId?: string | null },
  ): Promise<string> {
    const response = await this.raw('POST', foldersPath(projectId), fields);
    const location = response.headers.get('location') ?? '';
    return location.split('/').pop() ?? '';
  }

  /** 이름만 바꾼다. 그 폴더를 가리키던 길은 식별자로 서 있으므로 끊기지 않는다(DOC-008 A4). */
  async renameFolder(projectId: string, folderId: string, name: string): Promise<void> {
    await this.raw('PATCH', `${foldersPath(projectId)}/${encodeURIComponent(folderId)}`, { name });
  }

  /**
   * 폴더를 다른 자리로 옮긴다. 담긴 문서와 하위 폴더가 함께 간다(DOC-008 A5).
   *
   * <p>자기 자신이나 자기 자손 아래로 옮기려 하면 서버가 거절한다(A6). 여기서 미리 세어 두지
   * 않는 것은 판정에 필요한 트리 전체를 서버가 갖기 때문이다.
   */
  async moveFolder(projectId: string, folderId: string, parentId: string | null): Promise<void> {
    await this.raw('PUT', `${foldersPath(projectId)}/${encodeURIComponent(folderId)}/parent`, {
      parentId,
    });
  }

  /** 담긴 문서와 하위 폴더는 함께 지워지지 않고 한 단계 위로 올라간다(DOC-008 A7). */
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
 * 실패 응답을 옮긴다.
 *
 * <p>서버는 RFC 9457 로 답하며 `code` 가 분기의 계약이다(결정-0004). 자격이 서지 않은 것만 여기서
 * 말을 바꾸는데, 그 자리는 토큰을 다시 발급해야 한다는 것이 사용자가 알아야 할 전부이기 때문이다.
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
    // 본문이 없거나 JSON 이 아니면 상태 코드만 남긴다
  }
  return new GentaskError(response.status, code, detail);
}
