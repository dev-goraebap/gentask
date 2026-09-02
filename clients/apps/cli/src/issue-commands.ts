import { parseArgs } from 'node:util';
import { readConfig, storeProject } from './config.js';
import type { GentaskClient, IssueKind, IssueState, IssueSummary } from './gentask-client.js';
import { formatIssue, formatIssues } from './issue-format.js';

/**
 * 백로그를 명령줄에서 다루는 자리.
 *
 * <p>저장소의 `backlog/` 마크다운이 갖던 일을 이 명령들이 받는다. 사람은 화면으로 읽고 에이전트는
 * 여기로 읽는다 — 트래커의 두 번째 소비자가 에이전트다.
 */

export interface Outcome {
  readonly out: string;
  readonly code: number;
}

const KINDS: readonly IssueKind[] = ['EPIC', 'STORY', 'TASK', 'BUG'];
const STATES: readonly IssueState[] = [
  'BACKLOG',
  'UNSTARTED',
  'STARTED',
  'COMPLETED',
  'CANCELED',
];

export const ISSUE_HELP = `작업 아이템
  issue list [--state …] [--kind …] [--json]
                                 백로그를 봅니다. 기본은 닫히지 않은 것만입니다
  issue show <키> [--json]       하나를 펼칩니다. 본문과 인수 조건이 함께 옵니다
  issue add <제목> [--kind …] [--body …] [--parent 키]
                                 세웁니다. 번호는 서버가 매깁니다
  issue edit <키> [--title …] [--kind …] [--body …] [--parent 키|""]
                                 넘긴 것만 바꿉니다. --parent "" 는 최상위로 올립니다
  issue state <키> <상태>        상태를 옮깁니다
  issue rm <키> [--yes]          지웁니다. --yes 없이는 무엇을 지우는지만 보입니다
  issue export [--out 파일]      전부를 JSON 으로 내립니다. 추적 검사가 이것을 읽습니다

프로젝트
  project list                   내 프로젝트와 그 식별자를 봅니다
  project use <식별자>           이 자리의 프로젝트를 정합니다. 지금 디렉터리에 매여 남습니다`;

/**
 * 지금 자리의 프로젝트.
 *
 * <p>정해지지 않았으면 무엇을 하면 되는지까지 알린다. 부르는 것이 사람일 수도 에이전트일 수도
 * 있으므로 <b>부르는 쪽이 스스로 실행할 수 있는 명령</b>으로 적는다 — 사람에게 부탁하라는 말로
 * 읽히면 에이전트가 거기서 멈춘다.
 */
function currentProject(env: NodeJS.ProcessEnv): string {
  const projectId = readConfig(env).projectId;
  if (projectId === null) {
    throw new Error(
      [
        '이 자리의 프로젝트가 정해지지 않았습니다. 아래를 차례로 실행하면 정해집니다.',
        '',
        '  gentask project list           내 프로젝트와 그 식별자를 봅니다',
        '  gentask project use <식별자>   이 자리의 프로젝트로 둡니다',
        '',
        '고른 것은 지금 디렉터리에 매여 저장되므로 다른 저장소의 것을 건드리지 않습니다.',
        '한 번만 다른 것을 보려면 GENTASK_PROJECT 로 넘깁니다.',
      ].join('\n'),
    );
  }
  return projectId;
}

/** 사람이 부르는 이름에서 번호를 읽는다. 붙이는 규칙은 서버가 갖는다. */
function numberOf(key: string): number {
  const number = Number(key.slice(key.lastIndexOf('-') + 1));
  if (!Number.isInteger(number)) {
    throw new Error(`작업 아이템의 이름이 아닙니다: ${key}`);
  }
  return number;
}

function asKind(raw: string): IssueKind {
  const kind = raw.toUpperCase() as IssueKind;
  if (!KINDS.includes(kind)) {
    throw new Error(`유형이 아닙니다: ${raw}\n\n${KINDS.join(' · ')} 중 하나입니다.`);
  }
  return kind;
}

function asState(raw: string): IssueState {
  const state = raw.toUpperCase() as IssueState;
  if (!STATES.includes(state)) {
    throw new Error(`상태가 아닙니다: ${raw}\n\n${STATES.join(' · ')} 중 하나입니다.`);
  }
  return state;
}

/** 닫히지 않은 것. 목록을 처음 열었을 때 눈에 먼저 들어와야 하는 것들이다. */
function isLive(issue: IssueSummary): boolean {
  return issue.state !== 'COMPLETED' && issue.state !== 'CANCELED';
}

export async function runProject(
  argv: readonly string[],
  client: GentaskClient,
  env: NodeJS.ProcessEnv,
): Promise<Outcome> {
  const [sub, ...rest] = argv;

  if (sub === 'list') {
    const projects = await client.projects();
    const current = readConfig(env).projectId;
    // 식별자를 앞에 둔다. `use` 에 넘길 것이 그것이고 접두어는 이슈 이름에만 쓰인다.
    const out = projects
      .map(
        (p) =>
          `${p.id === current ? '*' : ' '} ${p.id}  ${p.name}  ${p.key}-  작업 아이템 ${p.issueCount}`,
      )
      .join('\n');
    return { out: out === '' ? '프로젝트가 없습니다.' : out, code: 0 };
  }

  if (sub === 'use') {
    const projectId = rest[0];
    if (projectId === undefined) {
      throw new Error('식별자가 필요합니다: gentask project use <식별자>');
    }
    // 있는 것인지 먼저 본다. 없는 것을 저장해 두면 그 뒤의 모든 명령이 같은 자리에서 실패한다.
    await client.projects().then((projects) => {
      if (!projects.some((p) => p.id === projectId)) {
        throw new Error(`그 프로젝트가 없습니다: ${projectId}`);
      }
    });
    const path = storeProject(projectId, env);
    return { out: `이 자리의 프로젝트를 ${projectId} 로 두었습니다. (${path})`, code: 0 };
  }

  throw new Error(`project 의 하위 명령이 아닙니다: ${sub ?? '(없음)'}`);
}

export async function runIssue(
  argv: readonly string[],
  client: GentaskClient,
  env: NodeJS.ProcessEnv,
): Promise<Outcome> {
  const [sub, ...rest] = argv;

  switch (sub) {
    case 'list': {
      const { values } = parseArgs({
        args: [...rest],
        options: {
          state: { type: 'string' },
          kind: { type: 'string' },
          all: { type: 'boolean' },
          json: { type: 'boolean' },
        },
      });
      const all = await client.issues(currentProject(env));

      const states = values.state === undefined ? null : values.state.split(',').map(asState);
      const kinds = values.kind === undefined ? null : values.kind.split(',').map(asKind);
      const shown = all.filter((issue) => {
        if (states !== null) return states.includes(issue.state);
        if (!values.all && !isLive(issue)) return false;
        return kinds === null || kinds.includes(issue.kind);
      });

      return {
        out: values.json ? JSON.stringify(shown, null, 2) : formatIssues(shown),
        code: 0,
      };
    }

    case 'show': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: { json: { type: 'boolean' } },
        allowPositionals: true,
      });
      const key = positionals[0];
      if (key === undefined) {
        throw new Error('이름이 필요합니다: gentask issue show <키>');
      }
      const issue = await client.issue(currentProject(env), numberOf(key));
      return {
        out: values.json ? JSON.stringify(issue, null, 2) : formatIssue(issue),
        code: 0,
      };
    }

    case 'add': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: {
          kind: { type: 'string' },
          body: { type: 'string' },
          parent: { type: 'string' },
        },
        allowPositionals: true,
      });
      const title = positionals.join(' ').trim();
      if (title === '') {
        throw new Error('제목이 필요합니다: gentask issue add <제목>');
      }

      const project = currentProject(env);
      const number = await client.addIssue(project, {
        title,
        ...(values.kind === undefined ? {} : { kind: asKind(values.kind) }),
        ...(values.body === undefined ? {} : { body: values.body }),
        ...(values.parent === undefined ? {} : { parentKey: values.parent || null }),
      });
      const created = await client.issue(project, number);
      return { out: `세웠습니다: ${created.summary.key}`, code: 0 };
    }

    case 'edit': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: {
          title: { type: 'string' },
          kind: { type: 'string' },
          body: { type: 'string' },
          parent: { type: 'string' },
        },
        allowPositionals: true,
      });
      const key = positionals[0];
      if (key === undefined) {
        throw new Error('이름이 필요합니다: gentask issue edit <키>');
      }
      if (
        values.title === undefined &&
        values.kind === undefined &&
        values.body === undefined &&
        values.parent === undefined
      ) {
        throw new Error('바꿀 것이 없습니다. --title · --kind · --body · --parent 중 하나를 넘기세요.');
      }

      // 서버의 편집은 셋을 그대로 받는다. 넘기지 않은 것은 지금 값을 그대로 되돌려 준다.
      const project = currentProject(env);
      const number = numberOf(key);
      const now = await client.issue(project, number);

      await client.editIssue(project, number, {
        title: values.title ?? now.summary.title,
        kind: values.kind === undefined ? now.summary.kind : asKind(values.kind),
        body: values.body ?? now.body,
        parentKey: values.parent === undefined ? now.summary.parentKey : values.parent || null,
      });
      return { out: `고쳤습니다: ${now.summary.key}`, code: 0 };
    }

    case 'state': {
      const { positionals } = parseArgs({ args: [...rest], allowPositionals: true });
      const [key, state] = positionals;
      if (key === undefined || state === undefined) {
        throw new Error('이름과 상태가 필요합니다: gentask issue state <키> <상태>');
      }
      const project = currentProject(env);
      await client.setIssueState(project, numberOf(key), asState(state));
      return { out: `${key} 를 ${asState(state)} 로 옮겼습니다.`, code: 0 };
    }

    case 'rm': {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: { yes: { type: 'boolean' } },
        allowPositionals: true,
      });
      const key = positionals[0];
      if (key === undefined) {
        throw new Error('이름이 필요합니다: gentask issue rm <키>');
      }

      const project = currentProject(env);
      const number = numberOf(key);
      const target = await client.issue(project, number);

      /*
       * 되묻는 자리를 여기서도 지난다(ITM-005).
       *
       * <p>명령줄에는 되물을 사람이 없으므로 되묻는 대신 무엇이 지워지는지를 보이고 멈춘다. 지우는
       * 것은 되돌릴 수 없고 되살릴 자리를 두지 않았으므로, 한 번 더 적게 하는 값이 그보다 싸다.
       */
      const children = (await client.issues(project)).filter(
        (issue) => issue.parentKey === target.summary.key,
      );
      const 딸린것 = children.length === 0 ? '' : `\n딸린 ${children.length} 건은 최상위로 올라갑니다.`;

      if (!values.yes) {
        return {
          out: `${target.summary.key} ${target.summary.title}${딸린것}\n\n지우려면 --yes 를 함께 넘기세요. 되돌릴 수 없습니다.`,
          code: 1,
        };
      }

      await client.removeIssue(project, number);
      return { out: `지웠습니다: ${target.summary.key}${딸린것}`, code: 0 };
    }

    case 'export':
      return await runExport(rest, client, env);

    default:
      throw new Error(`issue 의 하위 명령이 아닙니다: ${sub ?? '(없음)'}`);
  }
}

/**
 * 전부를 JSON 으로 내린다.
 *
 * <p>추적 검사가 이것을 읽는다. 검사가 API 를 직접 부르게 하면 서버와 토큰 없이는 돌지 않게 되는데,
 * 그 검사는 지금까지 오프라인으로 돌던 것이라 내리는 한 단계를 두어 그 성질을 지킨다.
 *
 * <p>본문을 함께 담는다. 인수 조건이 본문 안의 체크 항목이므로 그것 없이는 셀 수 없다.
 */
async function runExport(
  argv: readonly string[],
  client: GentaskClient,
  env: NodeJS.ProcessEnv,
): Promise<Outcome> {
  const { values } = parseArgs({ args: [...argv], options: { out: { type: 'string' } } });

  const project = currentProject(env);
  const summaries = await client.issues(project);

  // 본문은 상세에만 있다. 항목마다 한 번씩 묻는 것이 이 명령이 치르는 값이다.
  const issues = [];
  for (const summary of summaries) {
    const issue = await client.issue(project, summary.number);
    issues.push({
      key: issue.summary.key,
      number: issue.summary.number,
      kind: issue.summary.kind,
      state: issue.summary.state,
      title: issue.summary.title,
      parentKey: issue.summary.parentKey,
      body: issue.body,
      criteria: issue.criteria,
    });
  }

  const json = `${JSON.stringify({ project, issues }, null, 2)}\n`;
  if (values.out === undefined) {
    return { out: json, code: 0 };
  }

  const { writeFileSync } = await import('node:fs');
  writeFileSync(values.out, json);
  return { out: `${issues.length} 건을 ${values.out} 에 내렸습니다.`, code: 0 };
}
