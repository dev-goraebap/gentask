import { parseArgs } from 'node:util';
import { currentProject } from './config.js';
import {
  formatDoc,
  formatDocs,
  formatRevision,
  formatRevisions,
  revisionHeadline,
} from './doc-format.js';
import type { DocSummary, GentaskClient } from './gentask-client.js';

/**
 * 문서를 명령줄에서 다루는 자리.
 *
 * <p>사람은 화면으로 읽고 에이전트는 여기로 읽는다. 화면이 그린 결과를 내는 것과 달리 이쪽이 내는
 * 것은 마크다운 원문이며, 그것이 이 명령이 서 있는 이유다(DOC-002 A5).
 *
 * <p>지우기는 아직 없다. 서버에 그 자리가 서면 여기에 붙는다.
 */

export interface Outcome {
  readonly out: string;
  readonly code: number;
}

export const DOC_HELP = `문서
  doc list [--json]              프로젝트의 문서를 봅니다
  doc show <식별자> [--rev 번호] [--json]
                                 하나를 펼칩니다. 본문은 마크다운 원문 그대로 옵니다
                                 --rev 는 그때의 본문을 냅니다. 없으면 지금 참인 것입니다
  doc add <제목> [--body …]      세웁니다. 세운 것의 식별자를 냅니다
  doc edit <식별자> [--title …] [--body …] [--comment …]
                                 넘긴 것만 바꿉니다. --comment 는 왜 고쳤는지입니다
  doc history <식별자> [--page 쪽] [--size 개수] [--json]
                                 개정을 최근 것부터 봅니다. 쪽은 0 부터입니다
  doc revert <식별자> <번호> [--yes] [--comment …]
                                 그때의 본문을 새 개정으로 담습니다
                                 --yes 없이는 어느 시점으로 가는지만 보입니다`;

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

export async function runDoc(
  argv: readonly string[],
  client: GentaskClient,
  env: NodeJS.ProcessEnv,
): Promise<Outcome> {
  const [sub, ...rest] = argv;

  switch (sub) {
    case 'list': {
      const { values } = parseArgs({ args: [...rest], options: { json: { type: 'boolean' } } });
      const docs = await client.docs(currentProject(env));
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
        options: { body: { type: 'string' } },
        allowPositionals: true,
      });
      const title = positionals.join(' ').trim();
      if (title === '') {
        throw new Error('제목이 필요합니다: gentask doc add <제목>');
      }

      const id = await client.addDoc(currentProject(env), {
        title,
        ...(values.body === undefined ? {} : { body: values.body }),
      });
      return { out: `세웠습니다: ${id}`, code: 0 };
    }

    case 'edit': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: {
          title: { type: 'string' },
          body: { type: 'string' },
          comment: { type: 'string' },
        },
        allowPositionals: true,
      });
      /*
       * 사유만 넘기는 것은 받지 않는다. 서버는 앞의 개정과 같은 것이 오면 아무것도 담지 않고 성공으로
       * 답하므로(DOC-003 A2), 그대로 통과시키면 사유를 적었는데 아무 데도 남지 않는다.
       */
      if (values.title === undefined && values.body === undefined) {
        throw new Error(
          '바꿀 것이 없습니다. --title · --body 중 하나를 넘기세요. --comment 는 그 둘과 함께 갑니다.',
        );
      }

      // 서버의 편집은 부분 갱신이 아니라 제목과 본문을 그대로 받는다. 넘기지 않은 것은 지금 값을 되돌려 준다.
      const project = currentProject(env);
      const documentId = await resolveDoc(client, project, positionals[0]);
      const now = await client.doc(project, documentId);

      await client.editDoc(project, documentId, {
        title: values.title ?? now.summary.title,
        body: values.body ?? now.body,
        ...(values.comment === undefined ? {} : { comment: values.comment }),
      });
      return { out: `고쳤습니다: ${documentId}`, code: 0 };
    }

    default:
      throw new Error(`doc 의 하위 명령이 아닙니다: ${sub ?? '(없음)'}`);
  }
}
