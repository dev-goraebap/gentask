#!/usr/bin/env node
// 인수 조건과 테스트 이름의 대응을 대조하고 어느 층이 덮는지 보고한다.
// 키의 규약은 결정-0007 이, 층의 규약은 결정-0008 이 갖는다.
//   끊긴 참조 — 없는 인수 조건을 가리키는 접두어. 오류이며 종료 코드 1.
//   미검증    — 그 인수 조건을 덮는 층이 하나도 없다. 진행 상태이며 목록만 낸다.
//   취소      — 항목이 CANCELED 다. 요구가 아니므로 세지 않고 목록에만 남긴다.
//   Story 는 E2E 열이 채워졌을 때 닫는다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
/*
 * 테스트 이름에 박힌 접두어를 읽는다.
 *
 * <p>접두어를 문자로 박지 않는다. 박아 두면 그 프로젝트 하나만 대조되고 다른 프로젝트의 접두어를
 * 단 테스트는 조용히 세지 않는다. 자릿수도 고정하지 않는다 — 이름은 `GT-43` 이고 `GT-043` 이
 * 아니며, 옛 표기로 적힌 것도 같은 것으로 읽어야 한 번에 갈아엎지 않는다.
 *
 * <p>번호는 평평하다. 계층은 항목의 부모가 갖는다(결정-0007).
 */
const KEY = /\b([A-Z][A-Z0-9]{0,9}-\d+)((?:\s+#\d+)(?:,\s*#\d+)*)/g;

/** 자릿수를 채운 옛 표기와 지금 표기를 같은 것으로 본다. */
function canonical(key) {
  return key.replace(/-0*(\d+)$/, '-$1');
}

const SOURCES = [
  ['E2E', join(ROOT, 'clients', 'apps', 'web', 'e2e'), (n) => n.endsWith('.spec.ts')],
  ['BE', join(ROOT, 'server', 'src', 'test'), (n) => n.endsWith('.java')],
  ['FE', join(ROOT, 'clients', 'apps', 'web', 'src'), (n) => n.endsWith('.spec.ts')],
  // CLI 축의 시험. 브라우저도 서버도 아닌 자리에서 명령이 API 를 바르게 부르는지를 본다.
  ['CLI', join(ROOT, 'clients', 'apps', 'cli', 'src'), (n) => n.endsWith('.spec.ts')],
];

/*
 * 인수 조건의 원본은 트래커다. 저장소의 backlog/ 마크다운은 걷었다.
 *
 * 이 검사가 API 를 직접 부르지 않는 것은 지금까지 오프라인으로 돌던 성질을 지키기 위해서다 —
 * 서버와 토큰이 있어야 도는 검사는 홈서버가 잠깐 안 뜨면 함께 멈춘다. 대신 CLI 가 내린 것을 읽고,
 * 그것이 없으면 무엇을 해야 하는지 알린다.
 */
const EXPORT = join(ROOT, '.backlog.json');

const EXPORT_MISSING = [
  `백로그를 내린 것이 없습니다: ${relative(ROOT, EXPORT)}`,
  '',
  '  npm run backlog:export --prefix clients/apps/cli',
  '',
  '을 실행한 뒤 다시 검사하세요. 원본은 트래커이며 이 파일은 그 사본입니다.',
].join('\n');

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

let exported;
try {
  exported = JSON.parse(read(EXPORT));
} catch {
  console.error(EXPORT_MISSING);
  process.exit(1);
}

const criteria = [];
for (const issue of exported.issues) {
  /*
   * 취소된 항목은 근거를 잃어 더 이상 유효하지 않은 것이다(결정-0007). 그 인수 조건이 테스트를
   * 요구하면 지워진 요구가 계속 미검증으로 남고, 진짜 빈 자리가 그 속에 묻힌다.
   *
   * <p>목록에서 빼지 않고 세는 데서만 뺀다. 빼 버리면 그것을 가리키던 접두어가 없는 인수 조건을
   * 가리키는 것이 되어 끊긴 참조로 잡히는데, 그것은 오류가 아니라 취소되기 전에 쓴 테스트다.
   */
  const canceled = issue.state === 'CANCELED';
  // 경계를 표시하지 않는다. `#n` 이 붙은 체크 항목 자체가 인수 조건이다. 화면의 편집기가 HTML
  // 주석을 담을 자리를 갖지 않아, 마커로 가르면 저장하는 순간 인수 조건이 사라진다.
  for (const criterion of issue.criteria) {
    // 결번은 번호를 비워 두기 위한 자리이며 검증 대상이 아니다. 규약은 AGENTS.md 의 번호 불변.
    if (criterion.retired) continue;
    // [서버] 는 브라우저로 도달할 수 없음을 뜻하며 E2E 열을 면제한다. 이 저장소의 표기이며
    // ISO/IEC/IEEE 29148 의 검증 방법 속성과는 축이 다르다. 규약은 결정-0008 이 갖는다.
    const serverOnly = criterion.sentence.startsWith('[서버]');
    criteria.push({
      key: `${canonical(issue.key)} #${criterion.number}`,
      text: criterion.sentence.replace(/^\[서버\]\s*/, ''),
      serverOnly,
      canceled,
    });
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
        const key = `${canonical(m[1])} #${ac[1]}`;
        if (!referenced.has(key)) referenced.set(key, { layers: new Set(), file: relative(ROOT, file) });
        referenced.get(key).layers.add(layer);
      }
    }
  }
}

const known = new Set(criteria.map((c) => c.key));
const dangling = [...referenced].filter(([key]) => !known.has(key));
const layersOf = (key) => referenced.get(key)?.layers ?? new Set();
const uncovered = criteria.filter((c) => !c.canceled && layersOf(c.key).size === 0);
const openStories = criteria.filter(
  (c) => !c.canceled && !c.serverOnly && !layersOf(c.key).has('E2E'),
);

for (const [key, hit] of dangling) console.error(`끊긴 참조  ${key}  ${hit.file}`);

for (const c of criteria) {
  const layers = layersOf(c.key);
  const mark = (name) => `${name} ${layers.has(name) ? '✓' : '-'}`;
  const covered = layers.size > 0;
  const state = c.canceled
    ? '취소'
    : !covered
      ? '미검증'
      : c.serverOnly
        ? '닫힘[서버]'
        : layers.has('E2E')
          ? '닫힘'
          : '열림';
  console.log(
    `${c.key.padEnd(14)} ${c.serverOnly ? 'E2E 면제' : mark('E2E')}  ${mark('BE')}  ${mark('FE')}  ${mark('CLI')}   ${state.padEnd(10)} ${c.text.slice(0, 36)}`,
  );
}

// 취소된 것을 센 자리에 함께 두면 덮인 수가 실제보다 커진다. 세는 모수에서 먼저 뺀다.
const canceledCount = criteria.filter((c) => c.canceled).length;
const live = criteria.length - canceledCount;

console.log(
  `\n인수 조건 ${criteria.length}건 — 취소 ${canceledCount} 을 뺀 ${live}건 가운데 ` +
    `덮임 ${live - uncovered.length}, 미검증 ${uncovered.length}, ` +
    `E2E 미도달 ${openStories.length}, 끊긴 참조 ${dangling.length}`,
);

process.exit(dangling.length ? 1 : 0);
