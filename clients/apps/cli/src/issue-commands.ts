import { parseArgs } from 'node:util';
import { currentProject, readConfig, storeProject } from './config.js';
import type { GentaskClient, IssueKind, IssueState, IssueSummary } from './gentask-client.js';
import { formatIssue, formatIssues } from './issue-format.js';

/**
 * CLI 작업 항목 및 프로젝트 관리 명령어 처리 모듈.
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
  issue export [--out 파일]      본문과 인수 조건까지 전부를 JSON 으로 내립니다

프로젝트
  project list                   내 프로젝트와 그 식별자를 봅니다
  project use <식별자>           이 자리의 프로젝트를 정합니다. 지금 디렉터리에 매여 남습니다`;

/** 작업 항목 키(예: GT-12)에서 일련번호 정수값을 추출한다. */
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

/** 미완료 작업 항목 필터. */
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
    // 프로젝트 고유 식별자(ID)를 첫 열에 배치하고 접두어(Key)를 병기한다.
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
    // 설정 저장 전 대상 프로젝트의 실존 여부를 먼저 검증한다.
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

      // 전체 갱신 규약에 따라 미전달 필드는 기존 값을 유지하여 전송한다.
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
       * 비대화형 환경에서 실수로 인한 삭제를 방지하기 위해 --yes 플래그 없이 실행 시 삭제 대상만 표시하고 중단한다.
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
 * 백로그의 모든 작업 항목을 본문 및 인수 조건과 함께 JSON 형태로 내보낸다.
 */
async function runExport(
  argv: readonly string[],
  client: GentaskClient,
  env: NodeJS.ProcessEnv,
): Promise<Outcome> {
  const { values } = parseArgs({ args: [...argv], options: { out: { type: 'string' } } });

  const project = currentProject(env);
  const summaries = await client.issues(project);

  // 본문 및 인수 조건 수집을 위해 각 작업 항목의 상세 API를 순회 호출한다.
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
