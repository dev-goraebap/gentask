import { parseArgs } from 'node:util';
import { currentProject } from './config.js';
import { formatDoc, formatDocs } from './doc-format.js';
import type { DocSummary, GentaskClient } from './gentask-client.js';

/**
 * 문서를 명령줄에서 다루는 자리.
 *
 * <p>사람은 화면으로 읽고 에이전트는 여기로 읽는다. 화면이 그린 결과를 내는 것과 달리 이쪽이 내는
 * 것은 마크다운 원문이며, 그것이 이 명령이 서 있는 이유다(DOC-002 A5).
 *
 * <p>개정 이력과 되돌리기와 지우기는 아직 없다. 서버에 그 자리가 서면 여기에 붙는다.
 */

export interface Outcome {
  readonly out: string;
  readonly code: number;
}

export const DOC_HELP = `문서
  doc list [--json]              프로젝트의 문서를 봅니다
  doc show <식별자> [--json]     하나를 펼칩니다. 본문은 마크다운 원문 그대로 옵니다
  doc add <제목> [--body …]      세웁니다. 세운 것의 식별자를 냅니다
  doc edit <식별자> [--title …] [--body …] [--comment …]
                                 넘긴 것만 바꿉니다. --comment 는 왜 고쳤는지입니다`;

/**
 * 적어 넣은 것으로 문서 하나를 가린다.
 *
 * <p>전문이면 그대로 부르고, 짧게 적었으면 목록에서 앞이 맞는 것을 찾는다. 둘 이상이면 고르지 않고
 * 그 사실을 알린다 — 엉뚱한 문서를 고쳐 놓으면 개정이 하나 더 쌓일 뿐 되돌릴 자리가 아직 없다.
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

    case 'show': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: { json: { type: 'boolean' } },
        allowPositionals: true,
      });
      const project = currentProject(env);
      const doc = await client.doc(project, await resolveDoc(client, project, positionals[0]));
      return {
        out: values.json ? JSON.stringify(doc, null, 2) : formatDoc(doc),
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
