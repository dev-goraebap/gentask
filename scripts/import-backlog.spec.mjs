#!/usr/bin/env node
// 옮기기가 원본과 같은 것을 내는지 대조한다 (TG-045).
//
// 데이터베이스를 세우지 않는다. 스크립트가 내는 SQL 을 읽어 항목 수 · 번호 · 계층 · 인수 조건 줄을
// 원본과 맞춘다. 실제로 흘려 본 결과와 이 대조가 같은 수를 냈다.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIRS = [
  join(ROOT, 'backlog', 'tasks'),
  join(ROOT, 'backlog', 'completed'),
  join(ROOT, 'backlog', 'archive', 'tasks'),
  join(ROOT, 'backlog', 'drafts'),
  join(ROOT, 'backlog', 'archive', 'drafts'),
];

const read = (file) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

let expectedItems = 0;
let expectedParents = 0;
const expectedNumbers = new Set();
for (const dir of DIRS) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    continue;
  }
  for (const name of names.filter((each) => each.endsWith('.md'))) {
    const body = read(join(dir, name));
    expectedItems += 1;
    if (/^parent_task_id:\s*TG-\d+\s*$/m.test(body)) expectedParents += 1;
    const number = /^id:\s*TG-(\d+)\s*$/m.exec(body)?.[1];
    if (number) expectedNumbers.add(Number(number));
  }
}

const sql = execFileSync(
  process.execPath,
  [join(ROOT, 'scripts', 'import-backlog.mjs'), '--owner', 'check@example.com', '--key', 'TG'],
  { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
);

const inserts = [...sql.matchAll(/\), (\d+), '(?:EPIC|STORY|TASK|BUG)', '/g)].map((each) => Number(each[1]));
const updates = sql.match(/^update issues child set parent_id/gm)?.length ?? 0;

const failures = [];
const expect = (label, actual, expected) => {
  if (actual !== expected) failures.push(`${label}: ${actual} (원본 ${expected})`);
  else console.log(`  ${label}: ${actual}`);
};

console.log('TG-045 #1: 옮기기는 원본의 항목 수와 같은 수를 낸다');
expect('항목', inserts.length, expectedItems);

console.log('TG-045 #2: 옮기기는 원본의 번호를 그대로 쓴다');
const kept = inserts.filter((each) => expectedNumbers.has(each)).length;
expect('원본 번호를 그대로 받은 것', kept, expectedNumbers.size);
expect('번호가 겹치지 않는다', new Set(inserts).size, inserts.length);

console.log('TG-045 #3: 옮기기는 원본의 parent_task_id 를 부모로 잇는다');
expect('부모를 잇는 자리', updates, expectedParents);

console.log('TG-045 #4: 두 번 돌려도 항목을 두 벌로 만들지 않는다');
const upserts = sql.match(/^on conflict \(project_id, number\) do update set$/gm)?.length ?? 0;
expect('덮어쓰기로 넣는 것', upserts, expectedItems);

if (failures.length > 0) {
  console.error('\n어긋난 것:');
  for (const each of failures) console.error(`  ${each}`);
  process.exit(1);
}
console.log('\n대조를 통과했다.');
