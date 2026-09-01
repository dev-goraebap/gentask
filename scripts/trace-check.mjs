#!/usr/bin/env node
// 인수 조건과 테스트 이름의 대응을 대조하고 어느 층이 덮는지 보고한다.
// 키의 규약은 결정-0007 이, 층의 규약은 결정-0008 이 갖는다.
//   끊긴 참조 — 없는 인수 조건을 가리키는 접두어. 오류이며 종료 코드 1.
//   미검증    — 그 인수 조건을 덮는 층이 하나도 없다. 진행 상태이며 목록만 낸다.
//   Story 는 E2E 열이 채워졌을 때 닫는다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
// 번호는 평평하다. 계층은 프런트매터의 parent_task_id 가 갖는다 (결정-0007).
const KEY = /(TG-\d{3})((?:\s+#\d+)(?:,\s*#\d+)*)/g;

const SOURCES = [
  ['E2E', join(ROOT, 'clients', 'apps', 'web', 'e2e'), (n) => n.endsWith('.spec.ts')],
  ['BE', join(ROOT, 'server', 'src', 'test'), (n) => n.endsWith('.java')],
  ['FE', join(ROOT, 'clients', 'apps', 'web', 'src'), (n) => n.endsWith('.spec.ts')],
  // CLI 축의 시험. 브라우저도 서버도 아닌 자리에서 명령이 API 를 바르게 부르는지를 본다.
  ['CLI', join(ROOT, 'clients', 'apps', 'cli', 'src'), (n) => n.endsWith('.spec.ts')],
];

// cleanup 이 오래 닫힌 항목을 completed/ 로 옮기므로 두 자리를 함께 읽는다.
const ITEMS = [join(ROOT, 'backlog', 'tasks'), join(ROOT, 'backlog', 'completed')];

// 줄바꿈이 CRLF 로 섞여 들어와도 대조가 깨지지 않게 읽는 자리에서 고른다.
// 어긋난 파일 하나가 인수 조건을 조용히 빠뜨리는 것보다 여기서 흡수하는 편이 안전하다.
const read = (file) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

function walk(dir, matches, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === 'build' || name === '.git') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, matches, out);
    else if (matches(name)) out.push(full);
  }
  return out;
}

const criteria = [];
for (const dir of ITEMS) {
  for (const file of walk(dir, (n) => n.endsWith('.md'))) {
    const body = read(file);
    const id = /^id:\s*(TG-[\d.]+)\s*$/m.exec(body)?.[1];
    if (!id) continue;
    // 인수 조건은 도구가 심는 마커 안에만 있다. 절 제목에 기대지 않는다.
    const block = /<!-- AC:BEGIN -->\n([\s\S]*?)<!-- AC:END -->/.exec(body)?.[1];
    if (!block) continue;
    for (const line of block.split('\n')) {
      const m = /^- \[[ x]\] #(\d+) (.+)$/.exec(line);
      if (!m) continue;
      const text = m[2].trim();
      // 결번은 번호를 비워 두기 위한 자리이며 검증 대상이 아니다. 규약은 AGENTS.md 의 번호 불변.
      if (text === '(결번)') continue;
      // [서버] 는 브라우저로 도달할 수 없음을 뜻하며 E2E 열을 면제한다. 이 저장소의 표기이며
      // ISO/IEC/IEEE 29148 의 검증 방법 속성과는 축이 다르다. 규약은 결정-0008 이 갖는다.
      const serverOnly = text.startsWith('[서버]');
      criteria.push({ key: `${id} #${m[1]}`, text: text.replace(/^\[서버\]\s*/, ''), serverOnly });
    }
  }
}

criteria.sort((a, b) =>
  a.key.localeCompare(b.key, 'en', { numeric: true, sensitivity: 'base' }),
);

const referenced = new Map();
for (const [layer, dir, matches] of SOURCES) {
  for (const file of walk(dir, matches)) {
    const body = read(file);
    for (const m of body.matchAll(KEY)) {
      for (const ac of m[2].matchAll(/#(\d+)/g)) {
        const key = `${m[1]} #${ac[1]}`;
        if (!referenced.has(key)) referenced.set(key, { layers: new Set(), file: relative(ROOT, file) });
        referenced.get(key).layers.add(layer);
      }
    }
  }
}

const known = new Set(criteria.map((c) => c.key));
const dangling = [...referenced].filter(([key]) => !known.has(key));
const layersOf = (key) => referenced.get(key)?.layers ?? new Set();
const uncovered = criteria.filter((c) => layersOf(c.key).size === 0);
const openStories = criteria.filter((c) => !c.serverOnly && !layersOf(c.key).has('E2E'));

for (const [key, hit] of dangling) console.error(`끊긴 참조  ${key}  ${hit.file}`);

for (const c of criteria) {
  const layers = layersOf(c.key);
  const mark = (name) => `${name} ${layers.has(name) ? '✓' : '-'}`;
  const covered = layers.size > 0;
  const state = !covered ? '미검증' : c.serverOnly ? '닫힘[서버]' : layers.has('E2E') ? '닫힘' : '열림';
  console.log(
    `${c.key.padEnd(14)} ${c.serverOnly ? 'E2E 면제' : mark('E2E')}  ${mark('BE')}  ${mark('FE')}  ${mark('CLI')}   ${state.padEnd(10)} ${c.text.slice(0, 36)}`,
  );
}

console.log(
  `\n인수 조건 ${criteria.length}건 — 덮임 ${criteria.length - uncovered.length}, ` +
    `미검증 ${uncovered.length}, E2E 미도달 ${openStories.length}, 끊긴 참조 ${dangling.length}`,
);
process.exit(dangling.length ? 1 : 0);
