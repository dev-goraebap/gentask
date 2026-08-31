# gentask

[gentask](https://gentask.xyz) 의 작업을 명령줄에서 다룹니다. 사람도 쓰고 에이전트도 씁니다.

```bash
npx gentask list
```

## 자격

계정 화면에서 에이전트 토큰을 발급한 뒤 저장합니다.

```bash
gentask auth login          # 붙여 넣습니다
gentask auth login < t.txt  # 파이프로도 받습니다
```

토큰은 `~/.config/gentask/config.json` 에 소유자만 읽을 수 있게 둡니다. `GENTASK_TOKEN` 으로 넘기면 저장된 것보다 그것이 먼저입니다.

**토큰을 인자로 받는 옵션은 없습니다.** 명령줄에 실린 자격은 셸 이력과 프로세스 목록에 남습니다.

## 명령

| 명령 | 하는 일 |
| :--- | :--- |
| `list [--all] [--json]` | 작업을 봅니다. 기본은 미완료만입니다 |
| `show <id> [--json]` | 하나를 펼칩니다 |
| `add <제목> [--due YYYY-MM-DD]` | 작업을 만듭니다. 만든 것의 식별자를 냅니다 |
| `edit <id> [--title] [--note] [--due] [--remind]` | 넘긴 것만 바꿉니다. 비우려면 빈 문자열을 넘깁니다 |
| `done <id> [--undo]` | 완료하거나 되돌립니다 |
| `star <id> [--off]` | 중요 표시를 켜거나 끕니다 |
| `today <id> [--off]` | 나의 하루에 담거나 뺍니다 |
| `rm <id>` | 지웁니다 |
| `auth login \| status \| logout` | 자격을 다룹니다 |

식별자는 앞 몇 자만 적어도 됩니다. 그것으로 하나가 가려지지 않으면 후보를 보여 주고 멈춥니다.

## 출구

사람이 읽는 것을 기본으로 내고 `--json` 이 기계가 읽는 것을 냅니다. 사람에게 하는 말은 표준오류로, 기계가 읽는 것은 표준출력으로 갑니다.

```bash
gentask list --json | jq '.[] | select(.important) | .title'
gentask add "장 보기" --due 2026-09-01   # 식별자만 낸다
```

## 에이전트에게

이 도구는 `Bash` 를 가진 에이전트가 그대로 부릅니다. 별도 설정이 필요 없습니다.

```
gentask --help          어떤 명령이 있는지
gentask list --json     지금 무엇이 있는지
```

## 다른 자리

`GENTASK_BASE_URL` 이 부를 자리를 바꿉니다. 로컬 서버를 볼 때 씁니다.

```bash
GENTASK_BASE_URL=http://localhost:8080 gentask list
```

## 규격

명령의 경계와 자격의 규약은 [결정-0013](https://github.com/dev-goraebap/gentask/blob/main/docs/architecture/decisions/0013-agent-cli.md)이, 흐름은 유스케이스 서술서 `AGT-001` 이 갖습니다.
