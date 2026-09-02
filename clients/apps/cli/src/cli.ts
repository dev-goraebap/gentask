import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { clearToken, configPath, readConfig, readStoredToken, storeToken } from './config.js';
import { GentaskClient, type Task } from './gentask-client.js';
import { formatList, formatTask } from './format.js';
import { ISSUE_HELP, runIssue, runProject } from './issue-commands.js';

/**
 * 명령의 결과.
 *
 * <p>표준출력에 낼 것과 종료 코드를 갖는다. 여기서 직접 쓰지 않는 것은 시험이 출력을 읽기
 * 위해서다 — 명령이 무엇을 냈는지 문자열로 받아 본다.
 */
export interface Outcome {
  readonly out: string;
  readonly code: number;
}

/** 클라이언트를 만드는 자리. 시험이 가짜를 끼운다. */
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

식별자는 앞 몇 자만 적어도 됩니다. 그것으로 하나가 가려지지 않으면 그 사실을 알립니다.`;

/**
 * 명령 하나를 실행한다.
 *
 * <p>실패는 던진다. 무엇을 어떻게 알릴지는 진입점이 정한다.
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

    const token = (await stdin()).trim();
    if (!token) {
      throw new Error('토큰이 비어 있습니다.');
    }
    const path = storeToken(token, env);
    return { out: `토큰을 ${path} 에 저장했습니다.`, code: 0 };
  }

  if (sub === 'status') {
    if (env['GENTASK_TOKEN']?.trim()) {
      return { out: 'GENTASK_TOKEN 의 토큰을 씁니다. 저장된 것보다 이것이 먼저입니다.', code: 0 };
    }
    if (readStoredToken(env)) {
      return { out: `${configPath(env)} 의 토큰을 씁니다.`, code: 0 };
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
 * 토큰을 받는다.
 *
 * <p>터미널이면 한 줄만 받고, 파이프로 들어오면 끝까지 읽는다. 어느 쪽이든 표준입력이라 명령줄에
 * 남지 않는다 — 결정-0013 이 토큰을 인자로 받지 않기로 한 자리다.
 */
async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    process.stderr.write('토큰을 붙여 넣고 Enter 를 누르세요: ');
    const rl = createInterface({ input: process.stdin });
    try {
      for await (const line of rl) {
        return line;
      }
      return '';
    } finally {
      rl.close();
      process.stderr.write('\n');
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
      // 서버의 편집은 부분 갱신이 아니라 넷을 그대로 받는다. 넘기지 않은 것은 지금 값을 다시 보낸다.
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
 * 적어 넣은 것으로 작업 하나를 가린다.
 *
 * <p>전문이면 그대로 부르고, 짧게 적었으면 목록에서 앞이 맞는 것을 찾는다. 둘 이상이면 고르지
 * 않고 그 사실을 알린다 — 아무거나 골라 지우면 되돌릴 수 없다.
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
