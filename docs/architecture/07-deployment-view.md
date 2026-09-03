# 7. 배포 뷰 (Deployment View)

투두젠 시스템의 물리적·논리적 인프라 배치 구조와 배포 절차를 정의한다. 단일 개인 서버 환경에서 API는 Docker 컨테이너로 구동하고 프론트엔드는 빌드 산출물을 nginx가 정적으로 제공하며, 공용 서버 인프라 관례를 준수하는 범위 내에서 애플리케이션의 배포 명세를 기술한다.

```mermaid
flowchart LR
    dev["로컬 개발 머신"]
    browser["브라우저"]
    agent["로컬 에이전트"]
    r2[("Cloudflare R2")]

    subgraph host["개인 서버"]
        release["WEB_ROOT/releases/타임스탬프<br/>정적 산출물"]
        current["current<br/>심볼릭 링크"]
        staging["APP_DIR<br/>app.jar · .env"]
        nginx["nginx<br/>TLS 종단 · 정적 제공 · 리버스 프록시"]
        api["gentask-api:8080<br/>API"]
        db[("my-postgres<br/>gentask")]
    end

    dev -- "scp · 정적 산출물" --> release
    dev -- "scp · jar" --> staging
    current -. "ln -sfn" .-> release
    staging -- "docker compose build" --> api
    browser -- "HTTPS · gentask.xyz" --> nginx
    agent -- "HTTPS · api.gentask.xyz" --> nginx
    nginx -- "정적 파일" --> current
    nginx -- "/api/ · api.gentask.xyz" --> api
    api -- "JDBC" --> db
    api -- "S3 API · presigned URL 발급" --> r2
    browser <-- "HTTPS · 파일 바이트" --> r2
```

## 7.1 인프라 구성 및 배치

시스템을 구성하는 주요 요소의 호스트 내 배치 경로 및 역할은 다음과 같다.

- **API 컨테이너** — `$APP_DIR` 하위의 `api/`(JAR + Dockerfile), `docker-compose.yml`, `.env`
- **프론트엔드 정적 자산** — `$WEB_ROOT` 하위의 릴리스별 디렉터리 `releases/<타임스탬프>/` 및 활성 버전을 가리키는 심볼릭 링크 `current`. nginx 컨테이너에 해당 디렉터리를 `/srv/gentask/web` 경로로 읽기 전용 마운트한다. 호스트와 컨테이너 양쪽에서 정상 참조되도록 `current`는 **상대 경로 심볼릭 링크**로 생성한다.
- **리버스 프록시** — `~/nginx/nginx.conf`의 `gentask.xyz`, `api.gentask.xyz` 서버 블록. 정적 자산 서빙과 API 리버스 프록시를 수행하며, API 요청은 Docker 내부 네트워크(`my-network`)의 컨테이너 식별자로 전달한다.
- **SSL/TLS 인증서** — Certbot standalone 방식으로 발급하여 `~/nginx/certs/gentask-app-*.pem`으로 복사한다. 갱신은 `~/nginx/renew-certs.sh` 스크립트를 통해 관리한다.
- **데이터베이스** — 호스트 서버 공용 `my-postgres` 인스턴스의 `gentask` 데이터베이스 (전용 사용자 롤 `gentask`).
- **파일 스토리지** — Cloudflare R2 버킷 `gentask`. 접속 자격 증명은 서버 호스트의 `.env` 파일에만 정의한다.

프론트엔드는 서버 실행 프로세스를 두지 않는다. 서버 사이드 렌더링(SSR) 대상 경로가 없으므로 요청 시점에 동적 HTML을 생성하는 Node.js 프로세스가 불필요하다.

호스트 서버의 Docker 패키지가 snap 방식으로 설치되어 있어, 홈 디렉터리 외부 경로(`/srv` 등)를 바인드 마운트할 경우 컨테이너 기동이 `read-only file system` 오류로 실패하므로 정적 자산의 배포 디렉터리는 홈 디렉터리 하위로 제한된다.

## 7.2 도메인 및 라우팅

인바운드 트래픽은 nginx를 통해 도메인 및 경로 단위로 분기한다.

- **`gentask.xyz`**: `/api/` 경로 요청은 `gentask-api:8080`(API 컨테이너)으로 전달하고, 나머지 요청은 정적 자산으로 응답한다. 화면과 API가 동일한 출처(Same-Origin)를 공유하므로 세션 쿠키 기반 인증이 유지된다(로컬 개발 프록시와 동일한 구조).
- **`api.gentask.xyz`**: 외부 클라이언트(로컬 에이전트 등)의 요청을 `gentask-api:8080`으로 직접 라우팅한다. 브라우저 외부 환경에서 Bearer 토큰을 통한 인증 요청을 처리한다.

정적 리소스 응답은 2단계 진입점을 사용한다. 프리렌더링된 경로는 고유 `index.html`을 서빙하고, `RenderMode.Client`로 지정된 나머지 경로는 **`index.csr.html`**로 폴백 라우팅된다. 프리렌더링된 `index.html`은 애플리케이션 셸이 아닌 `<meta http-equiv="refresh">` 리다이렉트 문서이므로, 일반적인 `try_files $uri /index.html` 규칙을 적용하면 모든 경로에서 무한 리다이렉트 루프가 발생한다.

```nginx
    # gentask.xyz - HTTP to HTTPS redirect
    server {
        listen 80;
        server_name gentask.xyz api.gentask.xyz;
        return 301 https://$host$request_uri;
    }

    # gentask.xyz - HTTPS. Static frontend; only /api/ goes to the backend.
    # Same origin for page and API, so the session cookie (SameSite=Lax) holds.
    server {
        listen 443 ssl;
        server_name gentask.xyz;

        ssl_certificate /etc/nginx/certs/gentask-app-fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/gentask-app-privkey.pem;

        # Must match before the static fallback. No trailing slash on proxy_pass:
        # controllers own the /api/v1 prefix.
        location /api/ {
            proxy_pass http://gentask-api:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffering off;
            proxy_http_version 1.1;
        }

        # current is a symlink. Deploy = swap the link, rollback = swap it back.
        root /srv/gentask/web/current;
        index index.html index.csr.html;

        # Hashed filenames only. 404 instead of falling through to the CSR shell.
        location ~* \.(?:js|css|woff2?|ttf|eot|png|jpe?g|gif|svg|ico|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
            try_files $uri =404;
        }

        # Prerendered routes serve their own index.html; Client routes fall back to
        # the CSR shell. index.html is a meta-refresh stub, not the app shell.
        location / {
            try_files $uri $uri/ /index.csr.html;
        }
    }
```

## 7.3 배포 절차

애플리케이션 빌드 및 테스트 검증은 로컬 환경에서 완료하고 생성된 산출물만을 서버로 전송한다. 서버 환경에서의 직접 빌드로 인한 산출물 불일치 가능성을 방지하고 검증된 아티팩트의 동일성을 보장한다.

프론트엔드와 백엔드 API는 서로 다른 배포 갱신 방식을 적용한다. 프론트엔드는 신규 릴리스 디렉터리를 업로드한 후 `current` 심볼릭 링크를 원자적으로 교체하며, API는 Docker 이미지를 재빌드하여 컨테이너를 재생성한다.

접속 대상과 서버 내 경로는 하드코딩하지 않고 변수로 추상화한다. 실제 접속 정보는 버전 관리에서 제외되는 `.deploy.env` 파일에 정의하며, 배포 스크립트는 이 설정을 로드하여 실행한다.

| 변수 | 역할 |
| :--- | :--- |
| `DEPLOY_USER` · `DEPLOY_HOST` · `DEPLOY_PORT` | SSH 접속 대상 계정, 호스트, 포트 |
| `WEB_ROOT` | 프론트엔드 릴리스 디렉터리 및 `current` 링크의 상위 경로 |
| `APP_DIR` | API 컨테이너 배포 경로 (홈 디렉터리 기준 상대 경로) |

```bash
./scripts/deploy.sh            # 프론트엔드 및 백엔드 동시 배포
./scripts/deploy-web.sh        # 프론트엔드 단독 배포
./scripts/deploy-api.sh        # 백엔드 API 단독 배포
./scripts/rollback-web.sh      # 인자 없이 실행 시 서버 릴리스 목록 출력
```

스크립트는 산출물을 전송하기 전에 배포 사전 조건을 검증하며, 단 하나라도 불충족할 경우 작업을 즉시 중단한다. 검증 항목 및 기준은 [결정-0002](./decisions/0002-shared-contributing.md)에 기술되어 있다.

배포된 커밋 해시는 릴리스 디렉터리의 `RELEASE_SHA` 파일에 기록되어, 배포 아티팩트의 소스 커밋 추적 경로를 제공한다.

프론트엔드 롤백은 `current` 심볼릭 링크를 직전 릴리스 디렉터리로 재지정하여 즉시 완료되며, nginx 재기동은 불필요하다. 반면 백엔드 API는 컨테이너 교체 방식이므로 이전 커밋 산출물을 재배포하여 롤백을 수행한다.

## 7.4 환경 설정 및 운영 제약

- **환경 변수 격리 (`.env`)**: 데이터베이스 자격 증명, `AUTH_SECRET`, R2 API 키 등 민감 정보는 서버 호스트 내부의 `.env` 파일로만 관리하며 Git 저장소에 커밋하지 않는다. 환경 변수 명칭은 `server/src/main/resources/application.properties`에 정의된 속성 키와 일치해야 한다.
- **스토리지 CORS 설정**: 클라이언트 브라우저가 Presigned URL로 직접 파일을 업로드한 후 Uppy 라이브러리가 정합성 검증을 위해 응답의 `ETag` 헤더를 참조하므로, Cloudflare R2 버킷의 CORS 정책은 `https://gentask.xyz` 출처에 대한 `GET`, `PUT` 메서드 허용과 더불어 **`ExposeHeaders`에 `etag`를 반드시 포함해야 한다**. 해당 헤더가 노출되지 않으면 업로드 완료 처리가 실패한다. 개발 환경은 로컬 컨테이너의 MinIO를 사용하며, 관련 배치 구조는 [결정-0014](./decisions/0014-backend-development-backing-services.md)에 기술되어 있다.

```json
[
  {
    "AllowedOrigins": ["https://gentask.xyz"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```
