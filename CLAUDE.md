@./AGENTS.md

## Claude 전용 보정

Claude Code는 스킬 정본 위치(`.agents/skills/`)를 직접 읽지 못한다.
`.claude/skills`가 없거나 정본보다 오래되었으면 `node scripts/sync-agent-assets.mjs`를
실행해 동기화한 뒤 작업을 계속한다. 이 보정은 Claude에게만 해당하므로 법전(AGENTS.md)이
아니라 이 파일에 둔다.
