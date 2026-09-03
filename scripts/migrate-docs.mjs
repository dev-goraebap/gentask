#!/usr/bin/env node
// docs/ 마크다운 문서를 트래커로 마이그레이션한다.
//
// 디렉터리는 폴더가 되고 마크다운은 문서가 된다.
// 제목은 파일명이 아닌 본문 첫 번째 레벨 1 헤딩(#)에서 추출한다.
//
// 마이그레이션 수행은 gentask CLI를 통해 실행한다.
//
//   node scripts/migrate-docs.mjs --dry-run          # 마이그레이션 대상 미리보기
//   node scripts/migrate-docs.mjs                    # 마이그레이션 실행
//   node scripts/migrate-docs.mjs --verify           # 원본 마크다운과 트래커 내용 대조 검증
//
// 대상 프로젝트는 `gentask project use` 설정을, 대상 서버는 GENTASK_BASE_URL 환경 변수를 따른다.

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const CLI = join(ROOT, 'clients', 'apps', 'cli', 'dist', 'index.js');

// 폴더 이름을 디렉터리 이름 그대로 쓴다. 다르게 부르고 싶으면 여기에 한 줄을 더한다.
// 이름은 나중에 `gentask doc folder rename` 으로 바꿀 수 있으므로 되돌리기가 싸다.
const NAMES = {
  // 'architecture': '아키텍처',
  // 'architecture/decisions': '결정 기록',
};

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const verify = args.has('--verify');

function gentask(argv, input) {
  return execFileSync(process.execPath, [CLI, ...argv], {
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'inherit'],
  }).trim();
}

/** 본문 첫 번째 `#` 줄. 없으면 파일 이름을 쓴다. */
function titleOf(body, fileName) {
  const heading = body.match(/^#[ \t]+(.+)$/m);
  return heading ? heading[1].trim() : fileName.replace(/\.md$/, '');
}

/** docs/ 아래를 훑어 디렉터리와 마크다운을 얕은 것부터 낸다. */
function walk(dir, out = { dirs: [], files: [] }) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.dirs.push(full);
      walk(full, out);
    } else if (name.endsWith('.md')) {
      out.files.push(full);
    }
  }
  return out;
}

const { dirs, files } = walk(DOCS);
const relOf = (p) => relative(DOCS, p).split(sep).join('/');

if (verify) {
  const remote = JSON.parse(gentask(['doc', 'list', '--json']));
  const folders = JSON.parse(gentask(['doc', 'folder', 'list', '--json']));
  const wantTitles = files
    .map((f) => titleOf(readFileSync(f, 'utf8'), f.split(sep).pop()))
    .sort();
  const gotTitles = remote.map((d) => d.title).sort();

  const missing = wantTitles.filter((t) => !gotTitles.includes(t));
  const extra = gotTitles.filter((t) => !wantTitles.includes(t));

  console.log(`폴더  원본 ${dirs.length} · 옮긴 것 ${folders.length ?? folders.items?.length}`);
  console.log(`문서  원본 ${files.length} · 옮긴 것 ${remote.length}`);
  if (missing.length) console.log(`빠진 것 ${missing.length}\n  ${missing.join('\n  ')}`);
  if (extra.length) console.log(`더 있는 것 ${extra.length}\n  ${extra.join('\n  ')}`);
  if (!missing.length && !extra.length) console.log('어긋난 것 없음');
  process.exitCode = missing.length || extra.length ? 1 : 0;
} else {
  if (!dryRun) {
    const already = JSON.parse(gentask(['doc', 'list', '--json']));
    if (already.length > 0) {
      console.error(`이미 문서 ${already.length} 개가 있습니다. 빈 프로젝트에만 옮깁니다.`);
      process.exit(1);
    }
  }

  // 얕은 것부터 세워야 부모가 이미 서 있다.
  const folderIds = new Map();
  for (const dir of dirs) {
    const rel = relOf(dir);
    const name = NAMES[rel] ?? dir.split(sep).pop();
    const parentRel = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : null;
    const parentId = parentRel ? folderIds.get(parentRel) : null;

    if (dryRun) {
      console.log(`폴더  ${rel}  →  ${name}${parentId ? ` (부모 ${parentRel})` : ''}`);
      folderIds.set(rel, `dry-${rel}`);
      continue;
    }
    const argv = ['doc', 'folder', 'add', name, '--json'];
    if (parentId) argv.push('--parent', parentId);
    folderIds.set(rel, JSON.parse(gentask(argv)).id);
  }

  for (const file of files) {
    const rel = relOf(file);
    const body = readFileSync(file, 'utf8');
    const title = titleOf(body, file.split(sep).pop());
    const dirRel = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : null;
    const folderId = dirRel ? folderIds.get(dirRel) : null;

    if (dryRun) {
      console.log(`문서  ${rel}  →  ${title}${dirRel ? `  [${dirRel}]` : ''}`);
      continue;
    }
    const argv = ['doc', 'add', title, '--body-file', '-', '--json'];
    if (folderId) argv.push('--folder', folderId);
    gentask(argv, body);
    console.log(`옮김  ${rel}`);
  }

  console.log(`\n폴더 ${dirs.length} · 문서 ${files.length}${dryRun ? ' (돌려만 봄)' : ''}`);
}
