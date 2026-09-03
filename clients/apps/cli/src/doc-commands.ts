import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { currentProject } from './config.js';
import {
  folderHolds,
  formatDoc,
  formatDocs,
  formatFolders,
  formatRevision,
  formatRevisions,
  revisionHeadline,
} from './doc-format.js';
import type { DocFolder, DocSummary, GentaskClient } from './gentask-client.js';

/**
 * CLI 문서 관리 명령어 처리 모듈.
 *
 * show 명령은 파이프라인 연계 및 에이전트 처리를 위해 가공되지 않은 마크다운 원본 텍스트를 출력한다.
 * 본문은 명령행 인자(--body)뿐만 아니라 파일(--file) 및 표준 입력(-)을 통해서도 전달받는다.
 */

export interface Outcome {
  readonly out: string;
  readonly code: number;
}

export const DOC_HELP = `문서
  doc list [--folder 식별자] [--json]
                                 프로젝트의 문서를 봅니다. --folder 는 그 자리의 것만입니다
  doc show <식별자> [--rev 번호] [--json]
                                 하나를 펼칩니다. 본문은 마크다운 원문 그대로 옵니다
                                 --rev 는 그때의 본문을 냅니다. 없으면 지금 참인 것입니다
  doc add <제목> [--body …|--body-file 경로] [--folder 식별자] [--json]
                                 세웁니다. 세운 것의 식별자를 냅니다
                                 --body-file - 은 표준입력에서 본문을 받습니다
  doc edit <식별자> [--title …] [--body …|--body-file 경로] [--comment …]
                                 넘긴 것만 바꿉니다. --comment 는 왜 고쳤는지입니다
  doc mv <식별자> [--folder 식별자]
                                 담긴 자리를 바꿉니다. --folder 를 비우면 최상위입니다
  doc history <식별자> [--page 쪽] [--size 개수] [--json]
                                 개정을 최근 것부터 봅니다. 쪽은 0 부터입니다
  doc revert <식별자> <번호> [--yes] [--comment …]
                                 그때의 본문을 새 개정으로 담습니다
                                 --yes 없이는 어느 시점으로 가는지만 보입니다

문서 폴더
  doc folder list [--json]       계층이 보이게 냅니다
  doc folder add <이름> [--parent 식별자] [--json]
                                 세웁니다. 세운 것의 식별자를 냅니다
  doc folder rename <식별자> <새 이름>
                                 이름만 바꿉니다. 가리키던 길은 끊기지 않습니다
  doc folder mv <식별자> [--parent 식별자]
                                 담긴 자리를 바꿉니다. 비우면 최상위입니다
  doc folder rm <식별자> [--yes]  지웁니다. 담긴 것은 한 단계 위로 올라갑니다
                                 --yes 없이는 무엇이 올라오는지만 보입니다`;

/** 입력된 개정 번호를 파싱한다. */
function asRevisionNo(raw: string | undefined, usage: string): number {
  const given = raw?.trim();
  if (!given) {
    throw new Error(`개정 번호가 필요합니다: ${usage}`);
  }

  const no = Number(given);
  if (!Number.isInteger(no) || no < 1) {
    throw new Error(`개정 번호가 아닙니다: ${given}\n\n1 부터의 정수입니다.`);
  }
  return no;
}

/** 페이지 번호 및 페이지 크기를 파싱한다. */
function asCount(raw: string | undefined, name: string, least: number): number | undefined {
  if (raw === undefined) {
    return undefined;
  }

  const value = Number(raw.trim());
  if (!Number.isInteger(value) || value < least) {
    throw new Error(`${name} 가 아닙니다: ${raw}\n\n${least} 부터의 정수입니다.`);
  }
  return value;
}

/**
 * 입력된 식별자로 단일 문서를 조회한다. 전문 식별자 또는 접두부 단축 식별자를 지원하며, 다수 일치 시 모호성 오류를 던진다.
 */
async function resolveDoc(
  client: GentaskClient,
  projectId: string,
  given: string | undefined,
): Promise<string> {
  const needle = given?.trim();
  if (!needle) {
    throw new Error('문서의 식별자가 필요합니다: gentask doc show <식별자>');
  }

  if (needle.length === 36) {
    return needle;
  }

  const matched = (await client.docs(projectId)).filter((doc) => doc.id.startsWith(needle));
  if (matched.length === 1) {
    return (matched[0] as DocSummary).id;
  }
  if (matched.length === 0) {
    throw new Error(`그 식별자로 시작하는 문서가 없습니다: ${needle}`);
  }
  throw new Error(
    [
      `${needle} 로 시작하는 문서가 ${matched.length} 개입니다. 더 적어 주세요.`,
      '',
      formatDocs(matched),
    ].join('\n'),
  );
}

/**
 * 입력된 식별자로 단일 폴더를 조회한다.
 */
async function resolveFolder(
  client: GentaskClient,
  projectId: string,
  given: string | undefined,
): Promise<DocFolder> {
  return pickFolder(await client.folders(projectId), given);
}

/**
 * 기조회된 폴더 목록에서 대상 폴더를 조회한다.
 */
function pickFolder(folders: readonly DocFolder[], given: string | undefined): DocFolder {
  const needle = given?.trim();
  if (!needle) {
    throw new Error('폴더의 식별자가 필요합니다: gentask doc folder mv <식별자>');
  }

  const matched = folders.filter((folder) => folder.id.startsWith(needle));
  if (matched.length === 1) {
    return matched[0] as DocFolder;
  }
  if (matched.length === 0) {
    throw new Error(`그 식별자로 시작하는 폴더가 없습니다: ${needle}`);
  }
  throw new Error(
    [
      `${needle} 로 시작하는 폴더가 ${matched.length} 개입니다. 더 적어 주세요.`,
      '',
      formatFolders(matched),
    ].join('\n'),
  );
}

/**
 * 명령행 인자, 파일 경로, 표준 입력 중 지정된 소스로부터 문서 본문 문자열을 획득한다.
 */
async function readBody(
  values: { body?: string | undefined; 'body-file'?: string | undefined },
  stdin: () => Promise<string>,
): Promise<string | undefined> {
  const path = values['body-file'];
  if (path === undefined) {
    return values.body;
  }
  if (values.body !== undefined) {
    throw new Error(
      '--body 와 --body-file 은 함께 넘길 수 없습니다. 본문이 오는 자리는 하나입니다.',
    );
  }
  if (path === '-') {
    return await stdin();
  }

  try {
    return readFileSync(path, 'utf8');
  } catch {
    throw new Error(`본문으로 읽을 파일이 없습니다: ${path}`);
  }
}

export async function runDoc(
  argv: readonly string[],
  client: GentaskClient,
  env: NodeJS.ProcessEnv,
  stdin: () => Promise<string> = async () => '',
): Promise<Outcome> {
  const [sub, ...rest] = argv;

  if (sub === 'folder') {
    return await runDocFolder(rest, client, env);
  }

  switch (sub) {
    /*
     * 폴더별 필터링은 클라이언트에서 수행한다.
     */
    case 'list': {
      const { values } = parseArgs({
        args: [...rest],
        options: { json: { type: 'boolean' }, folder: { type: 'string' } },
      });
      const project = currentProject(env);
      const all = await client.docs(project);

      const folder =
        values.folder === undefined ? null : await resolveFolder(client, project, values.folder);
      const docs = folder === null ? all : all.filter((doc) => doc.folderId === folder.id);
      if (folder !== null && docs.length === 0 && !values.json) {
        return { out: `${folder.name} 에 담긴 문서가 없습니다.`, code: 0 };
      }
      return {
        out: values.json ? JSON.stringify(docs, null, 2) : formatDocs(docs),
        code: 0,
      };
    }

    /*
     * 특정 개정 버전 조회를 지원하기 위해 --rev 옵션을 처리한다.
     */
    case 'show': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: { json: { type: 'boolean' }, rev: { type: 'string' } },
        allowPositionals: true,
      });
      const project = currentProject(env);
      const documentId = await resolveDoc(client, project, positionals[0]);

      if (values.rev !== undefined) {
        const revision = await client.revision(
          project,
          documentId,
          asRevisionNo(values.rev, 'gentask doc show <식별자> --rev <번호>'),
        );
        return {
          out: values.json ? JSON.stringify(revision, null, 2) : formatRevision(revision),
          code: 0,
        };
      }

      const doc = await client.doc(project, documentId);
      return {
        out: values.json ? JSON.stringify(doc, null, 2) : formatDoc(doc),
        code: 0,
      };
    }

    /*
     * 서버의 페이징 응답 계약을 준수하여 목록 및 다음 페이지 안내를 출력한다.
     */
    case 'history': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: {
          json: { type: 'boolean' },
          page: { type: 'string' },
          size: { type: 'string' },
        },
        allowPositionals: true,
      });
      const project = currentProject(env);
      const documentId = await resolveDoc(client, project, positionals[0]);

      const at = asCount(values.page, '쪽', 0);
      const size = asCount(values.size, '개수', 1);
      const page = await client.revisions(project, documentId, {
        ...(at === undefined ? {} : { page: at }),
        ...(size === undefined ? {} : { size }),
      });
      return {
        out: values.json ? JSON.stringify(page, null, 2) : formatRevisions(page),
        code: 0,
      };
    }

    /*
     * 비대화형 환경에서 의도치 않은 롤백을 방지하기 위해 --yes 플래그 없이 실행 시 롤백 대상 개정 정보만 미리 표시한다.
     */
    case 'revert': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: { yes: { type: 'boolean' }, comment: { type: 'string' } },
        allowPositionals: true,
      });
      const project = currentProject(env);
      const documentId = await resolveDoc(client, project, positionals[0]);
      const revisionNo = asRevisionNo(positionals[1], 'gentask doc revert <식별자> <번호>');

      if (!values.yes) {
        const revision = await client.revision(project, documentId, revisionNo);
        return {
          out: [
            `${revision.title}`,
            `  돌아갈곳 ${revisionHeadline(revision)}`,
            '',
            '되돌리려면 --yes 를 함께 넘기세요. 사이의 개정은 지워지지 않고 새 개정이 하나 쌓입니다.',
            `그때의 본문은 gentask doc show ${documentId} --rev ${revisionNo} 로 봅니다.`,
          ].join('\n'),
          code: 1,
        };
      }

      /* 사유 미입력 시 서버에서 기본 사유를 자동 생성하도록 위임한다. */
      await client.revertDoc(project, documentId, revisionNo, values.comment);

      /*
       * 롤백 완료 후 최신 개정 상태를 재조회하여 확인한다.
       */
      const now = await client.doc(project, documentId);
      return {
        out:
          now.revisionNo === revisionNo
            ? `개정 ${revisionNo} 이 이미 지금 참인 것이라 새로 담지 않았습니다: ${documentId}`
            : `개정 ${revisionNo} 로 되돌렸습니다. 지금은 개정 ${now.revisionNo} 입니다: ${documentId}`,
        code: 0,
      };
    }

    case 'add': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: {
          body: { type: 'string' },
          'body-file': { type: 'string' },
          folder: { type: 'string' },
          json: { type: 'boolean' },
        },
        allowPositionals: true,
      });
      const title = positionals.join(' ').trim();
      if (title === '') {
        throw new Error('제목이 필요합니다: gentask doc add <제목>');
      }

      const project = currentProject(env);
      const folder =
        values.folder === undefined ? null : await resolveFolder(client, project, values.folder);
      const body = await readBody(values, stdin);

      const id = await client.addDoc(project, {
        title,
        ...(body === undefined ? {} : { body }),
        ...(folder === null ? {} : { folderId: folder.id }),
      });
      return { out: values.json ? JSON.stringify({ id }) : `세웠습니다: ${id}`, code: 0 };
    }

    case 'edit': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: {
          title: { type: 'string' },
          body: { type: 'string' },
          'body-file': { type: 'string' },
          comment: { type: 'string' },
        },
        allowPositionals: true,
      });
      /*
       * 내용 변경 없이 사유만 전달된 경우 불필요한 개정 생성을 방지하기 위해 처리를 중단한다.
       */
      const 바꿀것없음 =
        values.title === undefined &&
        values.body === undefined &&
        values['body-file'] === undefined;
      if (바꿀것없음) {
        throw new Error(
          '바꿀 것이 없습니다. --title · --body · --body-file 중 하나를 넘기세요. --comment 는 그것과 함께 갑니다.',
        );
      }

      const body = await readBody(values, stdin);

      // 전체 필드 갱신 규약에 따라 미수정 필드는 기존 값을 유지하여 전송한다.
      const project = currentProject(env);
      const documentId = await resolveDoc(client, project, positionals[0]);
      const now = await client.doc(project, documentId);

      await client.editDoc(project, documentId, {
        title: values.title ?? now.summary.title,
        body: body ?? now.body,
        ...(values.comment === undefined ? {} : { comment: values.comment }),
      });
      return { out: `고쳤습니다: ${documentId}`, code: 0 };
    }

    /*
     * 폴더 이동은 문서 내용 변경이 아니므로 개정 이력을 추가하지 않는다.
     */
    case 'mv': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: { folder: { type: 'string' } },
        allowPositionals: true,
      });
      const project = currentProject(env);
      const documentId = await resolveDoc(client, project, positionals[0]);
      const folder =
        values.folder === undefined || values.folder.trim() === ''
          ? null
          : await resolveFolder(client, project, values.folder);

      await client.moveDoc(project, documentId, folder === null ? null : folder.id);
      return {
        out:
          folder === null
            ? `최상위로 옮겼습니다: ${documentId}`
            : `${folder.name} 으로 옮겼습니다: ${documentId}`,
        code: 0,
      };
    }

    default:
      throw new Error(`doc 의 하위 명령이 아닙니다: ${sub ?? '(없음)'}`);
  }
}

/**
 * 문서 폴더 관리 명령어(목록, 생성, 이름 변경, 이동, 삭제)를 처리한다.
 */
async function runDocFolder(
  argv: readonly string[],
  client: GentaskClient,
  env: NodeJS.ProcessEnv,
): Promise<Outcome> {
  const [sub, ...rest] = argv;

  switch (sub) {
    /*
     * 서버의 평탄화된 폴더 목록을 계층 트리 형태로 가공하여 출력한다.
     */
    case 'list': {
      const { values } = parseArgs({ args: [...rest], options: { json: { type: 'boolean' } } });
      const folders = await client.folders(currentProject(env));
      return {
        out: values.json ? JSON.stringify(folders, null, 2) : formatFolders(folders),
        code: 0,
      };
    }

    case 'add': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: { parent: { type: 'string' }, json: { type: 'boolean' } },
        allowPositionals: true,
      });
      const name = positionals.join(' ').trim();
      if (name === '') {
        throw new Error('이름이 필요합니다: gentask doc folder add <이름>');
      }

      const project = currentProject(env);
      const parent =
        values.parent === undefined || values.parent.trim() === ''
          ? null
          : await resolveFolder(client, project, values.parent);

      /* 동일 이름의 폴더가 존재해도 폴더 ID로 고유 식별하므로 중복 생성을 허용한다. */
      const id = await client.addFolder(project, {
        name,
        ...(parent === null ? {} : { parentId: parent.id }),
      });
      return { out: values.json ? JSON.stringify({ id }) : `세웠습니다: ${id}`, code: 0 };
    }

    /* 폴더명을 변경해도 폴더 ID 기반 식별 경로는 유지된다. */
    case 'rename': {
      const { positionals } = parseArgs({ args: [...rest], allowPositionals: true });
      const name = positionals.slice(1).join(' ').trim();
      if (name === '') {
        throw new Error('새 이름이 필요합니다: gentask doc folder rename <식별자> <새 이름>');
      }

      const project = currentProject(env);
      const folder = await resolveFolder(client, project, positionals[0]);
      await client.renameFolder(project, folder.id, name);
      return { out: `이름을 바꿨습니다: ${folder.name} → ${name}`, code: 0 };
    }

    /*
     * 폴더 이동 시 하위 폴더와 소속 문서가 함께 이동하며, 순환 참조 여부는 서버에서 검증한다.
     */
    case 'mv': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: { parent: { type: 'string' } },
        allowPositionals: true,
      });
      const project = currentProject(env);
      // 원자적 상태 조회를 위해 단일 목록에서 이동 대상 및 목적지 폴더를 동시에 검증한다.
      const folders = await client.folders(project);
      const folder = pickFolder(folders, positionals[0]);
      const parent =
        values.parent === undefined || values.parent.trim() === ''
          ? null
          : pickFolder(folders, values.parent);

      await client.moveFolder(project, folder.id, parent === null ? null : parent.id);
      const 함께 = '담긴 문서와 하위 폴더가 함께 갔습니다.';
      return {
        out:
          parent === null
            ? `${folder.name} 을 최상위로 옮겼습니다. ${함께}`
            : `${folder.name} 을 ${parent.name} 아래로 옮겼습니다. ${함께}`,
        code: 0,
      };
    }

    /*
     * 비대화형 환경에서 삭제 영향도를 사전 인지할 수 있도록 --yes 플래그 없이 실행 시 상위로 승격될 하위 항목 개수를 표시하고 중단한다.
     */
    case 'rm': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: { yes: { type: 'boolean' } },
        allowPositionals: true,
      });
      const project = currentProject(env);
      const folder = await resolveFolder(client, project, positionals[0]);

      const 담긴것 = folder.documentCount + folder.folderCount;
      const 올라감 =
        담긴것 === 0
          ? ''
          : `\n담긴 ${folderHolds(folder)} 는 함께 지워지지 않고 한 단계 위로 올라갑니다.`;

      if (!values.yes) {
        return {
          out: [
            `${folder.name}`,
            `  식별자   ${folder.id}`,
            `  담긴것   ${folderHolds(folder)}`,
            '',
            `지우려면 --yes 를 함께 넘기세요. 폴더는 되살릴 수 없습니다.${올라감}`,
          ].join('\n'),
          code: 1,
        };
      }

      await client.removeFolder(project, folder.id);
      return {
        out:
          담긴것 === 0
            ? `지웠습니다: ${folder.name}`
            : `지웠습니다: ${folder.name}\n담겨 있던 ${folderHolds(folder)} 는 한 단계 위로 올라갔습니다.`,
        code: 0,
      };
    }

    default:
      throw new Error(`doc folder 의 하위 명령이 아닙니다: ${sub ?? '(없음)'}`);
  }
}
