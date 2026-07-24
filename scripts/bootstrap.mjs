// 파생 프로젝트 부트스트랩: 키트를 복제한 직후 1회 실행한다.
// 사용법:
//   node scripts/bootstrap.mjs --name "새프로젝트" [--kit-version v0.1] [--features auth,mail,file,noti,prof]
//
// 하는 일:
//   1. AGENTS.md 정체성 절을 파생 선언으로 교체 (키트 출처·버전 기록)
//   2. CHANGELOG.md 초기화
//   3. docs/계획.md 를 새 프로젝트용 골격으로 리셋
//   4. --features 에 없는 기능의 요구사항 상태를 일괄 '폐기'로 변경 (문서는 삭제하지 않는다)
//   5. README 제목 교체 + 파생 출처 표기
//   6. 남은 수동 단계(GitHub 마일스톤·라벨 등) 안내 출력
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---- 인자 파싱 ----
const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const name = arg('name', null);
const kitVersion = arg('kit-version', '(버전 미기록)');
const features = arg('features', 'auth,mail,file,noti,prof').split(',').map((s) => s.trim());

if (!name) {
  console.error('사용법: node scripts/bootstrap.mjs --name "새프로젝트" [--kit-version v0.1] [--features auth,mail,file,noti,prof]');
  process.exit(1);
}

const FEATURE_FILES = {
  auth: 'docs/요구사항/인증.md',
  mail: 'docs/요구사항/이메일.md',
  file: 'docs/요구사항/파일업로드.md',
  noti: 'docs/요구사항/알림.md',
  prof: 'docs/요구사항/프로필.md',
};

function edit(path, fn) {
  const p = join(root, path);
  if (!existsSync(p)) {
    console.warn(`건너뜀(없음): ${path}`);
    return;
  }
  writeFileSync(p, fn(readFileSync(p, 'utf-8')));
  console.log(`갱신: ${path}`);
}

// 1. AGENTS.md 정체성 교체
edit('AGENTS.md', (t) =>
  t.replace(
    /- \*\*이 저장소는 개발 키트\(원본\)이다\.\*\*[^\n]*\r?\n(\s*<!--[\s\S]*?-->\r?\n)?/,
    `- **이 저장소는 웹앱 개발키트 ${kitVersion}에서 파생된 프로젝트이다.** 키트의 프로세스 체계를 그대로 상속한다.\n`,
  ),
);

// 2. CHANGELOG 초기화
edit('CHANGELOG.md', () =>
  [
    '# 변경 이력',
    '',
    '형식: [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) · 베이스라인(태그) 단위로 절을 만든다.',
    '분류: Added(추가) / Changed(변경) / Fixed(수정) / Removed(제거)',
    '',
    '## [미출시]',
    '',
    '### Added',
    '',
    `- 웹앱 개발키트 ${kitVersion}에서 프로젝트 시작`,
    '',
  ].join('\n'),
);

// 3. 계획.md 골격 리셋
edit('docs/계획.md', () =>
  [
    '# 계획',
    '',
    '프로젝트의 목표·범위·마일스톤을 정의한다. 계획이 어긋나면 이 문서를 수정하고 커밋한다.',
    '',
    '## 목표',
    '',
    '(이 프로젝트의 목표를 쓴다)',
    '',
    '## 범위 / 비범위',
    '',
    '**범위**: (키트에서 가져온 기능 + 이 프로젝트 고유 기능)',
    '',
    '**비범위**: (하지 않을 것)',
    '',
    '## 마일스톤',
    '',
    '일정은 약속하지 않는다. 순서와 완료 조건으로 정의한다.',
    '',
    '| # | 이름 | 내용 | 완료 조건 |',
    '|---|---|---|---|',
    '| M0 | (첫 마일스톤) | | |',
    '',
  ].join('\n'),
);

// 4. 제외된 기능의 요구사항 상태를 폐기로
for (const [key, path] of Object.entries(FEATURE_FILES)) {
  if (!features.includes(key)) {
    edit(path, (t) => t.replaceAll('| 제안 |', '| 폐기 |').replaceAll('| 확정 |', '| 폐기 |').replaceAll('| 구현됨 |', '| 폐기 |'));
  }
}

// 5. README 제목 교체 + 출처 표기
edit('README.md', (t) => {
  const body = t.replace(/^# .+$/m, `# ${name}`);
  const provenance = `\n> 이 프로젝트는 [웹앱 개발키트](https://github.com/dev-goraebap/webapp-devkit) ${kitVersion}에서 파생되었다.\n`;
  return body.replace(/^(# .+)$/m, `$1\n${provenance}`);
});

// 6. 남은 수동 단계 안내
console.log(`
부트스트랩 완료: ${name}

남은 수동 단계:
  1. git 원격 확인 및 첫 커밋:  git add -A && git commit -m "chore: 키트 부트스트랩 (${kitVersion})"
  2. GitHub 마일스톤 생성:      gh api repos/{owner}/{repo}/milestones -f title="M0 ..."
  3. 저장소 squash 전용 설정:   gh api -X PATCH repos/{owner}/{repo} -f allow_merge_commit=false -f allow_rebase_merge=false
  4. docs/계획.md 목표·마일스톤 작성 (사람 승인)
  5. 폐기 처리된 요구사항의 코드가 불필요하면 별도 이슈로 제거 작업 등록
`);
