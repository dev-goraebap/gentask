#!/usr/bin/env node
// backlog/ 의 마크다운을 트래커의 작업 아이템으로 옮기는 SQL 을 낸다 (TG-045).
//
// 옮기는 것은 애플리케이션을 거치지 않는다. 번호를 원본 그대로 써야 하는데 API 는 다음 번호를
// 스스로 매기기 때문이다. 값이 틀리는 것은 표의 check 가 막는다 (V9).
//
// 이 스크립트는 데이터베이스에 붙지 않는다. SQL 을 표준 출력으로 내며 사람이 그것을 읽고 psql 로
// 흘린다. 붙는 자리를 갖지 않는 것은 이 저장소가 운영 자격을 추적하지 않기 때문이며(.deploy.env),
// 옮기기 전에 무엇이 들어가는지 읽을 수 있는 편이 낫다.
//
//     node scripts/import-backlog.mjs --owner <이메일> --key TG > /tmp/backlog.sql
//     psql "$DB_URL" -v ON_ERROR_STOP=1 -f /tmp/backlog.sql
//
// 두 번 흘려도 두 벌이 되지 않는다. (project_id, number) 로 덮어쓴다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

// 오래 닫힌 것과 걷어낸 것까지 함께 옮긴다. 이력이 저장소에만 남으면 트래커가 원본이 되지 못한다.
const SOURCES = [
  { dir: join(ROOT, 'backlog', 'tasks'), archived: false },
  { dir: join(ROOT, 'backlog', 'completed'), archived: false },
  { dir: join(ROOT, 'backlog', 'archive', 'tasks'), archived: true },
];

// 도구가 셋만 제공하므로 상태 다섯 가운데 셋만 원본에 있다. 나머지 둘은 옮긴 뒤에 쓰인다.
const STATES = {
  열림: 'UNSTARTED',
  '진행 중': 'STARTED',
  닫힘: 'COMPLETED',
};

const KINDS = { epic: 'EPIC', story: 'STORY', task: 'TASK', bug: 'BUG' };

// --- 인자 ------------------------------------------------------------------------------------------
const args = process.argv.slice(2);
const value = (name) => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? null : args[at + 1];
};

const owner = value('owner');
const key = value('key') ?? 'TG';
const projectName = value('name') ?? 'gentask';

if (!owner) {
  console.error('쓰임: node scripts/import-backlog.mjs --owner <이메일> [--key TG] [--name gentask]');
  process.exit(2);
}

// --- 읽기 ------------------------------------------------------------------------------------------
const read = (file) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

/** 프런트매터와 본문을 가른다. 본문은 손대지 않고 그대로 옮긴다 — 인수 조건이 그 안에 있다. */
function split(text) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  if (!match) return null;
  const front = {};
  for (const line of match[1].split('\n')) {
    const pair = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (pair) front[pair[1]] = pair[2].trim().replace(/^'(.*)'$/, '$1');
  }
  return { front, body: match[2] };
}

const items = [];
for (const { dir, archived } of SOURCES) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    continue;
  }
  for (const name of names) {
    const full = join(dir, name);
    if (!name.endsWith('.md') || statSync(full).isDirectory()) continue;
    const parsed = split(read(full));
    if (!parsed) continue;

    const id = parsed.front.id;
    const number = /^TG-(\d+)$/.exec(id ?? '')?.[1];
    if (!number) {
      console.error(`# 건너뜀 — 평평한 번호가 아니다: ${name}`);
      continue;
    }

    items.push({
      number: Number(number),
      kind: KINDS[parsed.front.type] ?? 'TASK',
      // 걷어낸 것은 근거를 잃은 것이지 끝난 것이 아니다.
      state: archived ? 'CANCELED' : (STATES[parsed.front.status] ?? 'BACKLOG'),
      title: parsed.front.title ?? name.replace(/\.md$/, ''),
      body: parsed.body,
      parent: parsed.front.parent_task_id || null,
      ordinal: Number(parsed.front.ordinal ?? 0) || Number(number) * 1000,
      createdAt: parsed.front.created_date ?? null,
      updatedAt: parsed.front.updated_date ?? parsed.front.created_date ?? null,
    });
  }
}

items.sort((a, b) => a.number - b.number);

if (items.length === 0) {
  console.error('# 옮길 항목이 없다');
  process.exit(1);
}

// --- 내기 ------------------------------------------------------------------------------------------
const quote = (text) => `'${String(text).replace(/'/g, "''")}'`;
const stamp = (raw) => (raw ? quote(`${raw.replace(' ', 'T')}:00Z`.replace(/:00:00Z$/, ':00Z')) : 'now()');

const lines = [];
lines.push(`-- backlog/ 의 ${items.length} 건을 옮긴다. scripts/import-backlog.mjs 가 냈다.`);
lines.push('begin;');
lines.push('');
lines.push('-- 소유자와 프로젝트를 잡는다. 프로젝트가 없으면 세우고, 있으면 그대로 쓴다.');
lines.push(`\\set owner_email ${quote(owner)}`);
lines.push('');
lines.push(`insert into projects (id, owner_id, name, key, next_number, created_at, updated_at)
select gen_random_uuid(), u.id, ${quote(projectName)}, ${quote(key)}, 1, now(), now()
from users u
where u.email_normalized = lower(:'owner_email')
on conflict (owner_id, key) do nothing;`);
lines.push('');

const anchor = `(select p.id from projects p join users u on u.id = p.owner_id
    where u.email_normalized = lower(:'owner_email') and p.key = ${quote(key)})`;

lines.push('-- 항목을 먼저 넣는다. 부모는 그 뒤에 잇는다 — 자식이 부모보다 앞 번호일 수 있다.');
for (const item of items) {
  const settled = item.state === 'COMPLETED' || item.state === 'CANCELED';
  lines.push(`insert into issues (
    id, project_id, number, kind, state, title, body, parent_id, ordinal, author_id, due_date, closed_at, created_at, updated_at)
select gen_random_uuid(), ${anchor}, ${item.number}, ${quote(item.kind)}, ${quote(item.state)},
    ${quote(item.title)}, ${quote(item.body)}, null, ${item.ordinal},
    (select u.id from users u where u.email_normalized = lower(:'owner_email')),
    null, ${settled ? stamp(item.updatedAt) : 'null'}, ${stamp(item.createdAt)}, ${stamp(item.updatedAt)}
on conflict (project_id, number) do update set
    kind = excluded.kind, state = excluded.state, title = excluded.title, body = excluded.body,
    ordinal = excluded.ordinal, closed_at = excluded.closed_at, updated_at = excluded.updated_at;`);
}

lines.push('');
lines.push('-- 계층. 번호로 잇는다 — 원본의 parent_task_id 가 번호이기 때문이다.');
for (const item of items.filter((each) => each.parent)) {
  const parentNumber = /^TG-(\d+)$/.exec(item.parent)?.[1];
  if (!parentNumber) {
    lines.push(`-- 건너뜀 — 부모가 평평한 번호가 아니다: TG-${item.number} -> ${item.parent}`);
    continue;
  }
  lines.push(`update issues child set parent_id = parent.id
from issues parent
where child.project_id = ${anchor} and child.number = ${item.number}
  and parent.project_id = child.project_id and parent.number = ${Number(parentNumber)};`);
}

lines.push('');
lines.push('-- 다음 번호를 옮긴 것의 뒤로 민다. 지운 것의 번호를 다시 쓰지 않기 위해서다.');
lines.push(`update projects set next_number = greatest(next_number, ${Math.max(...items.map((each) => each.number)) + 1})
where id = ${anchor};`);

lines.push('');
lines.push('-- 대조. 옮긴 수와 계층이 원본과 같은지 본다.');
lines.push(`select count(*) as 옮긴_항목, count(parent_id) as 부모가_있는_것 from issues where project_id = ${anchor};`);
lines.push(`-- 원본: 항목 ${items.length} · 부모가 있는 것 ${items.filter((each) => each.parent).length}`);

lines.push('');
lines.push('commit;');

console.log(lines.join('\n'));
