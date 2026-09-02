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

## 문서

프로젝트 아래에 선 문서를 다룹니다. 프로젝트는 `project use` 로 정해 둔 것을 씁니다.

| 명령 | 하는 일 |
| :--- | :--- |
| `doc list [--json]` | 프로젝트의 문서를 봅니다 |
| `doc show <식별자> [--rev 번호] [--json]` | 하나를 펼칩니다. 본문은 마크다운 원문 그대로 옵니다 |
| `doc add <제목> [--body …]` | 세웁니다. 세운 것의 식별자를 냅니다 |
| `doc edit <식별자> [--title] [--body] [--comment]` | 넘긴 것만 바꿉니다. `--comment` 는 왜 고쳤는지입니다 |
| `doc history <식별자> [--page 쪽] [--size 개수] [--json]` | 개정을 최근 것부터 봅니다 |
| `doc revert <식별자> <번호> [--yes] [--comment …]` | 그때의 본문을 새 개정으로 담습니다 |

**`show` 가 내는 본문은 마크다운 원문입니다.** 화면은 본문을 글자로만 그리지만 여기가 내는 것은 받은 그대로이며, 그것이 이 명령이 서 있는 이유입니다. 머리에 붙는 줄은 문서에 대한 것이고 본문은 그 아래에 손대지 않은 채로 갑니다.

**고치는 것은 개정을 쌓습니다.** 앞의 개정을 덮지 않으며, 담으려는 것이 앞의 것과 같으면 아무것도 쌓지 않습니다. 그래서 `--comment` 만 넘기는 것은 받지 않습니다 — 사유를 적었는데 아무 데도 남지 않기 때문입니다.

```bash
gentask doc list
gentask doc show 3f2a                          # 앞 몇 자만 적어도 됩니다
gentask doc show 3f2a | tail -n +7 > 개요.md    # 원문이 그대로 나옵니다
gentask doc add "아키텍처 개요" --body "$(cat 개요.md)"
gentask doc edit 3f2a --body "$(cat 개요.md)" --comment "빠진 절을 채운다"
```

### 개정

문서는 고칠 때마다 개정을 쌓습니다. `history` 가 지나온 것을 최근 것부터 보이고, `show --rev` 가 그때의 본문을 냅니다. 시점이 다를 뿐 나오는 것은 같은 마크다운 원문이므로 본문을 얻는 명령은 `show` 하나입니다.

```bash
gentask doc history 3f2a                 # 12  2026-09-03 10:30  고래밥  빠진 절을 채운다
gentask doc history 3f2a --page 1        # 한 쪽에 담기지 않으면 마지막 줄이 다음 쪽을 알립니다
gentask doc show 3f2a --rev 9            # 9 번 개정의 본문
```

**쪽은 감추지 않습니다.** 기본은 최근 20 건이고, 남은 것이 있으면 전체 수와 다음 쪽을 부르는 법이 함께 나옵니다. `--json` 은 서버가 준 `{items, total, page, size}` 를 그대로 냅니다.

**되돌리기는 앞으로 가는 것입니다.** 사이의 개정을 지우지 않고 그때의 본문을 담은 새 개정을 하나 더 쌓습니다. `--yes` 가 없으면 어느 시점으로 가는지만 보이고 멈춥니다.

```bash
gentask doc revert 3f2a 9                       # 돌아갈 곳만 보이고 멈춥니다
gentask doc revert 3f2a 9 --yes                 # 새 개정을 담습니다
gentask doc revert 3f2a 9 --yes --comment "고친 결과가 더 나쁘다"
```

`--comment` 를 적지 않으면 서버가 몇 번으로 되돌렸는지를 사유 자리에 스스로 적습니다. 고른 개정이 이미 지금 참인 것이면 아무것도 담지 않으며, 그것은 실패가 아닙니다.

지우기는 아직 없습니다. 서버에 그 자리가 서면 여기에 붙습니다.

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
