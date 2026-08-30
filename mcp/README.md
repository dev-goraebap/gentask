# todogen MCP 서버

에이전트가 todogen 의 작업을 다루게 하는 자리입니다. 요구사항은 [AGT-001](<../docs/spec/agent/AGT-001(에이전트로 작업 다루기).md>), 전송과 자격의 규격은 [결정-0013](../docs/architecture/decisions/0013-mcp-local-stdio-server.md)이 갖습니다.

이 서버는 **사용자의 기계에서 돕니다.** 클라이언트가 이 프로세스를 띄우고 표준입출력으로 말하며, 이 서버가 `api.todogen.app` 을 부릅니다. 우리 서버에 배포되는 것이 아닙니다.

## 세우기

```bash
npm install
npm run api:generate   # 서버 명세에서 타입을 만든다
npm run build
```

`src/generated/` 는 추적되지 않으므로 처음 받았을 때 `api:generate` 를 먼저 돌립니다.

## 붙이기

todogen 의 계정 화면에서 에이전트 토큰을 발급한 뒤, 쓰는 도구의 MCP 설정에 아래를 더합니다. 토큰은 그 자리에만 있고 이 서버는 어디에도 저장하지 않습니다.

```json
{
  "mcpServers": {
    "todogen": {
      "command": "node",
      "args": ["<이 저장소>/mcp/dist/index.js"],
      "env": { "TODOGEN_TOKEN": "<발급한 토큰>" }
    }
  }
}
```

| 환경변수 | 무엇 |
| :--- | :--- |
| `TODOGEN_TOKEN` | 에이전트 토큰. 없으면 붙기 전에 멈춥니다 |
| `TODOGEN_BASE_URL` | 부를 자리. 생략하면 `https://api.todogen.app` 이며 로컬을 볼 때 바꿉니다 |

## 도구

작업 API 의 자리를 그대로 옮깁니다. 스스로 판정하거나 저장하는 것은 없고 규칙은 모두 서버가 갖습니다.

`list_tasks` · `get_task` · `add_task` · `edit_task` · `set_task_completed` · `set_task_important` · `set_task_my_day` · `delete_task`

`edit_task` 만 API 를 두 번 부릅니다. 서버의 편집이 부분 갱신이 아니라 네 값을 그대로 받으므로, 넘기지 않은 값을 지금 값으로 채웁니다 — 그러지 않으면 제목만 고치려다 메모와 기한이 지워집니다. 비우려면 `null` 을 넘깁니다.

## 검증

```bash
npm run check   # 시험 + 빌드
```

**클라이언트가 프로세스를 띄우고 표준입출력으로 말하는 대목은 이 검증이 덮지 못합니다.** 도구가 API 를 바르게 부르는지까지가 검사의 범위이며, 실제로 붙는 것은 직접 확인해야 합니다. 결정-0008 과 결정-0013 이 그 자리를 적어 두었습니다.
