// .agents/skills(정본) → .claude/skills(Claude 어댑터) 동기화
// Claude Code가 개방 표준 위치(.agents/skills)를 직접 읽지 못하는 동안만 필요한 동등화 장치.
// 근거: docs/결정기록/결정-0006-에이전트-자산-개방-표준.md
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, '.agents', 'skills');
const dst = join(root, '.claude', 'skills');

if (!existsSync(src)) {
  console.error('정본(.agents/skills)이 없습니다. 저장소 루트에서 실행했는지 확인하세요.');
  process.exit(1);
}

rmSync(dst, { recursive: true, force: true });
cpSync(src, dst, { recursive: true });
console.log(`동기화 완료: ${readdirSync(dst).length}개 스킬 → .claude/skills`);
