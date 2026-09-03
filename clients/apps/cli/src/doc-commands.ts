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
 * 문서를 명령줄에서 다루는 자리.
 *
 * <p>사람은 화면으로 읽고 에이전트는 여기로 읽는다. 화면이 그린 결과를 내는 것과 달리 이쪽이 내는
 * 것은 마크다운 원문이며, 그것이 이 명령이 서 있는 이유다(DOC-002 A5).
 *
 * <p>문서를 지우는 자리는 아직 없다. 서버에 그것이 서면 여기에 붙는다. 폴더를 지우는 자리는 있으나
 * 그것은 담긴 문서를 지우지 않는다(DOC-008 A7).
 *
 * <p>본문은 인자로도 파일로도 받는다. 이 저장소의 `docs/` 를 트래커로 옮기는 일이 이 명령으로
 * 이루어지며, 마크다운 한 편을 `--body` 에 실으면 셸의 인자 길이 한계에 걸린다.
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

/** 사람이 적어 넣은 개정 번호를 읽는다. 있는 번호인지는 서버가 가린다. */
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

/** 쪽과 한 쪽에 담을 수. 넘기지 않은 것은 서버의 기본을 그대로 쓴다. */
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
 * 적어 넣은 것으로 문서 하나를 가린다.
 *
 * <p>전문이면 그대로 부르고, 짧게 적었으면 목록에서 앞이 맞는 것을 찾는다. 둘 이상이면 고르지 않고
 * 그 사실을 알린다 — 되돌릴 자리가 생겼어도 엉뚱한 문서에 개정을 쌓아 놓는 것이 공짜는 아니다.
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
 * 적어 넣은 것으로 폴더 하나를 가린다.
 *
 * <p>문서와 같은 규약이다 — 전문이면 그대로, 짧게 적었으면 앞이 맞는 것을 찾고 둘 이상이면 고르지
 * 않는다. 다만 전문을 적어도 목록을 부르는데, 폴더 하나를 따로 읽는 자리가 서버에 없고 이름을
 * 알아야 무엇을 옮기고 무엇을 지우는지 말할 수 있기 때문이다.
 */
async function resolveFolder(
  client: GentaskClient,
  projectId: string,
  given: string | undefined,
): Promise<DocFolder> {
  return pickFolder(await client.folders(projectId), given);
}

/**
 * 이미 받아 둔 목록에서 폴더 하나를 가린다.
 *
 * <p>옮기기는 옮길 것과 옮길 자리를 함께 가리므로, 부르는 자리를 나누어 두지 않으면 같은 목록을
 * 두 번 받아 온다.
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
 * 본문이 오는 자리를 정한다.
 *
 * <p>인자로 받는 길만 두면 마크다운 한 편이 셸의 인자 길이 한계에 걸린다. 파일과 표준입력을 함께
 * 두는 것은 이 명령이 옮기기의 손이 되기 때문이며, `-` 는 표준입력을 가리키는 관례를 따른다.
 *
 * <p>두 길을 함께 넘기는 것은 받지 않는다. 어느 쪽이 이겼는지 부르는 쪽이 알 수 없고, 파이프로
 * 이어 붙인 본문이 조용히 버려지면 그 사실이 어디에도 드러나지 않는다.
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
     * 자리로 좁히는 것은 여기서 한다. 서버의 목록은 프로젝트 아래 전부를 내고 폴더로 거르는 질의를
     * 받지 않으므로, 걸러 낸 뒤 낸다. 줄마다 `folderId` 가 실려 오므로 다시 물을 것은 없다.
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
     * 시점을 옵션으로 받는다.
     *
     * <p>내는 것이 같은 종류이기 때문이다 — 어느 개정이든 나오는 것은 그 문서의 마크다운 원문이고
     * 다른 것은 언제의 것인가뿐이다. 명령을 따로 세우면 본문을 얻는 이름이 둘이 되고, 부르는 쪽은
     * 지금 것을 원하는지 지난 것을 원하는지에 따라 다른 이름을 기억해야 한다.
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
     * 쪽을 감추지 않는다.
     *
     * <p>서버가 쪽을 계약으로 냈고(`{items, total, page, size}`), 명령줄이 그것을 대신 돌며 전부를
     * 실어 오면 한 번의 부름이 여러 왕복이 되는 것이 부르는 쪽에 보이지 않는다. 한 쪽에 담기지 않은
     * 것은 마지막 줄이 말하고, `--json` 은 서버가 준 쪽 정보를 그대로 낸다(DOC-004 A3).
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
     * 되묻는 자리를 지운 것과 같은 모양으로 둔다(DOC-005 A6).
     *
     * <p>명령줄에는 되물을 사람이 없으므로 어느 시점으로 가는지를 보이고 멈춘다. 다만 지우기만큼
     * 무겁지 않은데, 되돌리기는 사이의 개정을 지우지 않아 잃는 것이 없기 때문이다. 그래서 보이는
     * 것은 되돌릴 수 없다는 경고가 아니라 고른 개정이 언제 누구의 것인가다.
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

      /* --comment 를 적지 않으면 서버가 몇 번으로 되돌렸는지를 스스로 적는다. 그 문구를 흉내 내지 않는다. */
      await client.revertDoc(project, documentId, revisionNo, values.comment);

      /*
       * 담긴 것이 무엇인지는 서버에 물어 말한다. 고른 개정이 이미 지금 참인 것이면 서버는 아무것도
       * 담지 않고 성공으로 답하므로(DOC-005 A2), 물어보지 않으면 쌓지 않은 개정을 쌓았다고 말하게 된다.
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
       * 사유만 넘기는 것은 받지 않는다. 서버는 앞의 개정과 같은 것이 오면 아무것도 담지 않고 성공으로
       * 답하므로(DOC-003 A2), 그대로 통과시키면 사유를 적었는데 아무 데도 남지 않는다.
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

      // 서버의 편집은 부분 갱신이 아니라 제목과 본문을 그대로 받는다. 넘기지 않은 것은 지금 값을 되돌려 준다.
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
     * 옮기는 것은 개정이 아니다(DOC-006). 담긴 자리가 바뀌어도 문서가 말하는 바는 그대로이므로
     * 이력에 줄이 서지 않으며, 그래서 편집과 한 명령에 담지 않는다.
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
 * 문서를 담는 자리를 다룬다(DOC-008).
 *
 * <p>세우기와 이름 바꾸기와 옮기기와 지우기가 한 자리에 있다. 폴더는 그 자체로 읽을 것을 담지 않고
 * 문서를 어디에 둘지만 정하므로, 넷이 목표 하나를 나눠 갖는다.
 */
async function runDocFolder(
  argv: readonly string[],
  client: GentaskClient,
  env: NodeJS.ProcessEnv,
): Promise<Outcome> {
  const [sub, ...rest] = argv;

  switch (sub) {
    /*
     * 계층은 여기서 세운다. 서버가 내는 것은 `parentId` 를 실은 평평한 목록이며, 깊이를 제한하지
     * 않으므로 조립한 모양이 한 화면에 담긴다는 보장이 없다. `--json` 은 서버가 준 것을 그대로 낸다.
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

      /* 같은 이름이 이미 있어도 막지 않는다(DOC-008 A2). 폴더를 가리키는 것은 이름이 아니라 식별자다. */
      const id = await client.addFolder(project, {
        name,
        ...(parent === null ? {} : { parentId: parent.id }),
      });
      return { out: values.json ? JSON.stringify({ id }) : `세웠습니다: ${id}`, code: 0 };
    }

    /* 이름을 바꿔도 그 폴더를 가리키던 길은 끊기지 않는다. 가리키는 것이 식별자이기 때문이다(A4). */
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
     * 담긴 것을 따로 옮기지 않는다(A5). 자기 자신이나 자기 자손 아래로 가는 것은 서버가 거절하며(A6),
     * 그 사유를 여기서 다시 짓지 않는다 — 판정에 필요한 트리 전체를 가진 쪽이 서버다.
     */
    case 'mv': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: { parent: { type: 'string' } },
        allowPositionals: true,
      });
      const project = currentProject(env);
      // 옮길 것과 옮길 자리를 한 목록에서 가린다. 두 번 부르면 그 사이에 바뀐 것을 섞어 읽는다.
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
     * 되묻는 자리를 반드시 지난다(A7). 명령줄에는 되물을 사람이 없으므로 무엇이 걸려 있는지를
     * 보이고 멈춘다.
     *
     * <p>보이는 것이 <b>지워지는 수</b>가 아니라 <b>올라오는 수</b>라는 것을 말에 담는다. 담긴 문서는
     * 함께 지워지지 않고 한 단계 위로 올라가며, 그것을 삭제로 읽으면 사람이 지우지 않을 것을 지운다.
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
