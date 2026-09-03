import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import {
  clearToken,
  configPath,
  DEFAULT_BASE_URL,
  readConfig,
  readStoredToken,
  storeToken,
} from './config.js';
import { DOC_HELP, runDoc } from './doc-commands.js';
import { GentaskClient, type Task } from './gentask-client.js';
import { formatList, formatTask } from './format.js';
import { ISSUE_HELP, runIssue, runProject } from './issue-commands.js';

/**
 * CLI 명령 실행 결과 모델이다. 표준 출력 문자열과 종료 코드를 포함한다.
 */
export interface Outcome {
  readonly out: string;
  readonly code: number;
}

/** 테스트용 모의 클라이언트 팩토리 타입이다. */
export type ClientFactory = () => GentaskClient;

const HELP = `gentask — 작업을 명령줄에서 다룹니다

사용법
  gentask <명령> [인자] [옵션]

작업
  list [--all] [--json]          작업을 봅니다. 기본은 미완료만입니다
  show <id> [--json]             하나를 펼칩니다
  add <제목> [--due YYYY-MM-DD]  작업을 만듭니다
  edit <id> [--title …] [--note …] [--due …] [--remind …]
                                 넘긴 것만 바꿉니다. 비우려면 빈 문자열을 넘깁니다
  done <id> [--undo]             완료하거나 되돌립니다
  star <id> [--off]              중요 표시를 켜거나 끕니다
  today <id> [--off]             나의 하루에 담거나 뺍니다
  rm <id>                        지웁니다

자격
  auth login                     토큰을 저장합니다. 표준입력으로 받으므로 이력에 남지 않습니다
  auth status                    어디서 온 토큰을 쓰는지 봅니다
  auth logout                    저장된 토큰을 지웁니다

${ISSUE_HELP}

${DOC_HELP}

식별자는 앞 몇 자만 적어도 됩니다. 그것으로 하나가 가려지지 않으면 그 사실을 알립니다.`;

/**
 * 명령어를 실행하고 결과를 반환한다.
 */
export async function run(
  argv: readonly string[],
  makeClient: ClientFactory = () => new GentaskClient(readConfig()),
  env: NodeJS.ProcessEnv = process.env,
  stdin: () => Promise<string> = readStdin,
): Promise<Outcome> {
  const [command, ...rest] = argv;

  if (command === undefined || command === '--help' || command === '-h' || command === 'help') {
    return { out: HELP, code: 0 };
  }

  if (command === 'auth') {
    return await runAuth(rest, env, stdin);
  }

  if (command === 'issue') {
    return await runIssue(rest, makeClient(), env);
  }

  if (command === 'doc') {
    return await runDoc(rest, makeClient(), env, stdin);
  }

  if (command === 'project') {
    return await runProject(rest, makeClient(), env);
  }

  return await runTask(command, rest, makeClient);
}

// --- 자격 -----------------------------------------------------------------------------------------

async function runAuth(
  argv: readonly string[],
  env: NodeJS.ProcessEnv,
  stdin: () => Promise<string>,
): Promise<Outcome> {
  const [sub, ...rest] = argv;

  if (sub === 'login') {
    parseArgs({ args: [...rest], allowPositionals: false });

    // 대화형 TTY 환경인 경우 입력 안내 문구를 stderr에 출력한다.
    const tty = process.stdin.isTTY === true;
    if (tty) {
      process.stderr.write('토큰을 붙여 넣고 Enter 를 누르세요: ');
    }
    const token = (await stdin()).trim();
    if (tty) {
      process.stderr.write('\n');
    }
    if (!token) {
      throw new Error('토큰이 비어 있습니다.');
    }
    // API 서버 주소를 설정 파일에 함께 저장하여 일관된 접속 환경을 유지한다.
    const baseUrl = (env['GENTASK_BASE_URL']?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '');
    const path = storeToken(token, baseUrl, env);
    return { out: `${baseUrl} 의 토큰을 ${path} 에 저장했습니다.`, code: 0 };
  }

  if (sub === 'status') {
    if (env['GENTASK_TOKEN']?.trim()) {
      return { out: 'GENTASK_TOKEN 의 토큰을 씁니다. 저장된 것보다 이것이 먼저입니다.', code: 0 };
    }
    if (readStoredToken(env)) {
      return { out: `${readConfig(env).baseUrl} — ${configPath(env)} 의 토큰을 씁니다.`, code: 0 };
    }
    return { out: '저장된 토큰이 없습니다.', code: 1 };
  }

  if (sub === 'logout') {
    return clearToken(env)
      ? { out: '저장된 토큰을 지웠습니다.', code: 0 }
      : { out: '지울 토큰이 없습니다.', code: 0 };
  }

  throw new Error(`auth 의 하위 명령이 아닙니다: ${sub ?? '(없음)'}`);
}

/**
 * 표준 입력을 읽어 문자열로 반환한다. 터미널 환경에서는 1행을, 파이프 입력에서는 스트림 전체를 읽는다.
 */
async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin });
    try {
      for await (const line of rl) {
        return line;
      }
      return '';
    } finally {
      rl.close();
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

// --- 작업 -----------------------------------------------------------------------------------------

async function runTask(
  command: string,
  argv: readonly string[],
  makeClient: ClientFactory,
): Promise<Outcome> {
  const client = makeClient();

  switch (command) {
    case 'list': {
      const { values } = parseArgs({
        args: [...argv],
        options: { all: { type: 'boolean' }, json: { type: 'boolean' } },
        allowPositionals: false,
      });
      const tasks = await client.list();
      const shown = values.all ? tasks : tasks.filter((t) => !t.completedAt);
      return values.json
        ? { out: JSON.stringify(shown, null, 2), code: 0 }
        : { out: formatList(shown), code: 0 };
    }

    case 'show': {
      const { values, positionals } = parseArgs({
        args: [...argv],
        options: { json: { type: 'boolean' } },
        allowPositionals: true,
      });
      const task = await resolve(client, positionals[0]);
      return values.json
        ? { out: JSON.stringify(task, null, 2), code: 0 }
        : { out: formatTask(task), code: 0 };
    }

    case 'add': {
      const { values, positionals } = parseArgs({
        args: [...argv],
        options: { due: { type: 'string' } },
        allowPositionals: true,
      });
      const title = positionals.join(' ').trim();
      if (!title) {
        throw new Error('제목이 필요합니다. gentask add "할 일"');
      }
      const id = await client.add(title, values.due ?? null);
      return { out: id, code: 0 };
    }

    case 'edit': {
      const { values, positionals } = parseArgs({
        args: [...argv],
        options: {
          title: { type: 'string' },
          note: { type: 'string' },
          due: { type: 'string' },
          remind: { type: 'string' },
        },
        allowPositionals: true,
      });
      const task = await resolve(client, positionals[0]);
      // 전체 필드 갱신 규약에 따라 미수정 필드는 기존 값을 유지하여 전송한다.
      await client.edit(task.id, {
        title: values.title ?? task.title,
        note: values.note ?? task.note ?? '',
        dueDate: values.due === undefined ? (task.dueDate ?? null) : blankToNull(values.due),
        remindAt: values.remind === undefined ? (task.remindAt ?? null) : blankToNull(values.remind),
      });
      return { out: task.id, code: 0 };
    }

    case 'done': {
      const { values, positionals } = parseArgs({
        args: [...argv],
        options: { undo: { type: 'boolean' } },
        allowPositionals: true,
      });
      const task = await resolve(client, positionals[0]);
      await client.setCompleted(task.id, !values.undo);
      return { out: task.id, code: 0 };
    }

    case 'star': {
      const { values, positionals } = parseArgs({
        args: [...argv],
        options: { off: { type: 'boolean' } },
        allowPositionals: true,
      });
      const task = await resolve(client, positionals[0]);
      await client.setImportant(task.id, !values.off);
      return { out: task.id, code: 0 };
    }

    case 'today': {
      const { values, positionals } = parseArgs({
        args: [...argv],
        options: { off: { type: 'boolean' } },
        allowPositionals: true,
      });
      const task = await resolve(client, positionals[0]);
      await client.setMyDay(task.id, !values.off);
      return { out: task.id, code: 0 };
    }

    case 'rm': {
      const { positionals } = parseArgs({ args: [...argv], allowPositionals: true });
      const task = await resolve(client, positionals[0]);
      await client.remove(task.id);
      return { out: task.id, code: 0 };
    }

    default:
      throw new Error(`명령이 아닙니다: ${command}\n\ngentask --help 로 목록을 봅니다.`);
  }
}

function blankToNull(value: string): string | null {
  return value.trim() === '' ? null : value;
}

/**
 * 전달받은 식별자로 단일 작업을 조회한다. 접두부 단축 식별자인 경우 고유 일치 항목을 탐색하며, 다수 일치 시 모호성 오류를 던진다.
 */
async function resolve(client: GentaskClient, given: string | undefined): Promise<Task> {
  const needle = given?.trim();
  if (!needle) {
    throw new Error('작업의 식별자가 필요합니다.');
  }

  if (needle.length === 36) {
    return await client.get(needle);
  }

  const matched = (await client.list()).filter((t) => t.id.startsWith(needle));
  if (matched.length === 1) {
    return matched[0] as Task;
  }
  if (matched.length === 0) {
    throw new Error(`그 식별자로 시작하는 작업이 없습니다: ${needle}`);
  }
  throw new Error(
    [`${needle} 로 시작하는 작업이 ${matched.length} 개입니다. 더 적어 주세요.`, '', formatList(matched)].join('\n'),
  );
}
