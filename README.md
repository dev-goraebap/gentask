# 웹앱 개발키트

새 웹앱 프로젝트를 시작할 때 복제해서 바로 쓰는 개발 키트.
일반 웹앱에 공통으로 필요한 기능과, 1인 + AI 에이전트 체제를 위한 프로세스 자산을 함께 제공한다.

## 제공 기능 (요구사항 문서 기준)

| 영역 | 내용 | 명세 |
|---|---|---|
| 인증 | 이메일/비밀번호, 구글·카카오·네이버 소셜, 이메일 키 통합, 4테이블 구조 | [docs/요구사항/인증.md](docs/요구사항/인증.md) |
| 이메일 | 트랜잭션 이메일 발송 | [docs/요구사항/이메일.md](docs/요구사항/이메일.md) |
| 파일 업로드 | R2 presigned URL, Active Storage식 구조, 이미지 변환·지배적 색상 | [docs/요구사항/파일업로드.md](docs/요구사항/파일업로드.md) |
| 알림 | VAPID 웹 푸시, 알림 설정 | [docs/요구사항/알림.md](docs/요구사항/알림.md) |
| 프로필 | 닉네임·이미지·비밀번호 변경, 소셜 연동 관리 | [docs/요구사항/프로필.md](docs/요구사항/프로필.md) |

진행 상태는 [docs/계획.md](docs/계획.md)의 마일스톤 참조.

## 스택

- `web/` — Angular 22, Tailwind CSS
- `server/` — Spring Boot 4.1, Java 21, jOOQ, PostgreSQL

## 프로세스

이 저장소는 SP인증(SW프로세스 품질인증) 2등급 기준을 1인 + AI 에이전트 체제로 테일러링해 운영한다.
규칙의 원본은 [AGENTS.md](AGENTS.md)(법전)이며, 에이전트는 매 세션 이 문서를 로드한다.
근거와 커버리지 맵은 [docs/참고/](docs/참고/) 참조.

## 키트에서 새 프로젝트 시작하기

### 방법 A — gh CLI (권장)

이 저장소는 GitHub Template Repository로 설정되어 있어, 한 줄로 히스토리 없이 깨끗하게 시작할 수 있다:

```bash
gh repo create 새프로젝트 --template dev-goraebap/webapp-devkit --private --clone
```

### 방법 B — 순수 git

git 자체에는 템플릿 기능이 없으므로, 클론 후 히스토리를 버리고 새로 시작한다.
새 원격 저장소는 GitHub 웹에서 미리 만들어 둔다 (빈 저장소, README 생성 안 함):

```bash
git clone --depth 1 git@github.com:dev-goraebap/webapp-devkit.git 새프로젝트
cd 새프로젝트
rm -rf .git                      # 키트의 히스토리 제거
git init -b main
git add -A
git commit -m "웹앱 개발키트에서 시작"
git remote add origin git@github.com:<계정>/새프로젝트.git
git push -u origin main
```

### 공통 후속 작업 — 부트스트랩 스크립트

```bash
node scripts/bootstrap.mjs --name "새프로젝트" --kit-version v0.1 --features auth,prof
```

스크립트가 하는 일: AGENTS.md 정체성 절을 파생 선언으로 교체(키트 버전 기록),
CHANGELOG·계획.md 초기화, `--features`에 없는 기능의 요구사항 상태를 일괄 `폐기`로
변경(문서는 삭제하지 않고 기록 유지), README 제목·출처 표기. 남은 수동 단계(GitHub
마일스톤·squash 설정 등)는 실행 후 안내가 출력된다.

기능 키: `auth`(인증) `mail`(이메일) `file`(파일업로드) `noti`(알림) `prof`(프로필)
