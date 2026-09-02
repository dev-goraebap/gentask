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

## 작업 아이템과 프로젝트

작업(투두)과 다른 자리입니다. 트래커의 백로그를 다루며 Epic · Story · Task · Bug 가 한 목록에 있습니다.

| 명령 | 하는 일 |
| :--- | :--- |
| `issue list [--all] [--state …] [--kind …] [--json]` | 백로그를 봅니다. 기본은 닫히지 않은 것만입니다 |
| `issue show <키> [--json]` | 하나를 펼칩니다. 본문과 인수 조건이 함께 옵니다 |
| `issue add <제목> [--kind …] [--body …] [--parent 키]` | 세웁니다. 번호는 서버가 매깁니다 |
| `issue edit <키> [--title] [--kind] [--body] [--parent]` | 넘긴 것만 바꿉니다. `--parent ""` 는 최상위로 올립니다 |
| `issue state <키> <상태>` | 상태를 옮깁니다 |
| `issue rm <키> [--yes]` | 지웁니다 |
| `issue export [--out 파일]` | 본문과 인수 조건까지 전부를 JSON 으로 내립니다 |
| `project list` | 내 프로젝트와 그 식별자를 봅니다 |
| `project use <식별자>` | 이 자리의 프로젝트를 정합니다 |

**작업 아이템의 이름과 프로젝트의 식별자는 다릅니다.** 이름(`GT-43`)은 프로젝트가 정한 접두어와 번호이고, 명령줄과 주소가 받는 것은 프로젝트의 식별자입니다. 접두어는 다른 프로젝트와 겹칠 수 있으므로 그것으로는 프로젝트가 가려지지 않습니다.

```bash
gentask project list                 # 식별자를 먼저 본다
gentask project use V1StGXR8_Z5j
gentask issue list
gentask issue show GT-43
```

**`project use` 는 지금 디렉터리에 매여 저장됩니다.** 저장소마다 다른 프로젝트를 가리킬 수 있고, 하위 디렉터리에서 불러도 가장 가까운 자리의 것을 씁니다. 한 번만 다른 것을 보려면 `GENTASK_PROJECT` 로 넘깁니다.

**지우기는 되돌릴 수 없습니다.** `--yes` 가 없으면 무엇이 지워지는지 보이고 멈춥니다.

```bash
gentask issue rm GT-43         # 지울 것만 보이고 멈춘다
gentask issue rm GT-43 --yes   # 지운다
```

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
