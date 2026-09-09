export function mcpSetup(client: 'codex' | 'claude', url: string) {
  const hostname = new URL(url).hostname;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
  const name = local ? 'gentask-local' : hostname === 'qa.gentask.xyz' ? 'gentask-qa' : 'gentask';
  const variable = name.toUpperCase().replaceAll('-', '_') + '_API_TOKEN';
  const command = client === 'codex'
    ? `codex mcp add ${name} --url ${url} --bearer-token-env-var ${variable}`
    : `claude mcp add --transport http --scope user --header 'Authorization: Bearer \${${variable}}' -- ${name} ${url}`;
  const scope = client === 'codex' ? '사용자 설정 ~/.codex/config.toml (CODEX_HOME을 지정했다면 해당 경로)' : '사용자 범위 --scope user (~/.claude.json)';
  const prompt = `${client === 'codex' ? 'Codex' : 'Claude Code'}에서 Gentask MCP를 모든 프로젝트에서 사용할 수 있도록 사용자 전역으로 연결해주세요.

서버 이름: ${name}
서버 주소: ${url}
전송 방식: Streamable HTTP
인증: Authorization: Bearer <API 토큰>
토큰 환경변수: ${variable}
설정 범위: ${scope}

1. 운영체제, 클라이언트 버전, 실제 사용자 설정 경로를 확인해주세요. 다른 MCP 설정은 보존하고, 같은 이름의 서버가 있으면 주소와 인증 방식을 비교해 중복 없이 처리해주세요. 다른 주소를 덮어써야 한다면 먼저 알려주세요.
2. 토큰은 Gentask의 내 정보 → MCP 연결에서 제가 직접 발급합니다. 채팅으로 토큰을 요청하거나 로그에 출력하지 말고, 제 OS에 맞는 비표시 입력 방법으로 사용자 환경변수에 저장하도록 안내해주세요. 저장소 파일에는 토큰을 기록하지 마세요.
3. 아래 공식 CLI 명령을 참고해 전역 등록해주세요. PowerShell 또는 Bash에서 작은따옴표 안의 환경변수 참조를 그대로 전달해야 합니다. 다른 셸에서는 그 셸에 맞게 처리해주세요.
${command}
4. 환경변수가 터미널뿐 아니라 제가 사용하는 데스크톱 앱 또는 IDE에도 전달되는지 확인해주세요. 필요하면 앱을 완전히 종료하고 다시 실행하도록 안내해주세요. 환경변수 값 자체는 출력하지 마세요.
5. 클라이언트가 새 설정을 읽도록 재연결한 뒤 도구 목록 조회와 list_projects로 인증을 확인해주세요. 검증 과정에서 메모·문서·작업을 생성하거나 변경하지 마세요.
6. 연결 결과와 제가 직접 해야 하는 단계만 간단히 알려주세요.`;
  return { name, variable, command, prompt, scope };
}
