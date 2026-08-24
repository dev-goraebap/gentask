# 배포

개인 서버(goraebapserver) 한 대에 도커로 올린다. 서버의 관례를 따르며 여기서는 이 앱의 몫만 적는다.

## 자리

| 무엇 | 어디 |
| :--- | :--- |
| 앱 컨테이너 | `~/apps/todogen/` — `api/`(jar + Dockerfile) · `web/`(dist + Dockerfile) · `docker-compose.yml` · `.env` |
| 리버스 프록시 | `~/nginx/nginx.conf` 의 `todogen.app` · `api.todogen.app` 블록. 컨테이너 이름으로 프록시한다(`my-network`) |
| 인증서 | certbot standalone 발급 → `~/nginx/certs/todogen-app-*.pem` 복사. 갱신은 `~/nginx/renew-certs.sh` 가 갖는다 |
| 데이터베이스 | 서버 공용 `my-postgres` 의 `todogen` 데이터베이스(전용 롤 `todogen`) |
| 파일 보관소 | Cloudflare R2 버킷 `todogen`. 접속값은 서버의 `.env` 만 갖는다 |

## 호스트

- `todogen.app` → `todogen-web:4000`(SSR), 단 `/api/` 는 `todogen-api:8080` 으로. 화면과 API 가 같은 출처라 쿠키가 그대로 성립한다(개발 프록시와 같은 모양).
- `api.todogen.app` → `todogen-api:8080`. 브라우저 밖 클라이언트(에이전트의 Bearer 토큰) 용이다.

## 절차

빌드는 로컬에서 끝내고 산출물만 나른다. 서버에서 다시 빌드하면 검증을 지난 것과 다른 산출물이 뜬다.

```bash
# 1. 로컬 빌드
cd server && ./gradlew build          # 테스트 포함. build/libs/app.jar
cd web && npm run check               # 테스트 포함. dist/web

# 2. 산출물 운반 (레포는 나르지 않는다)
scp -P 23022 server/build/libs/app.jar server/Dockerfile  dev-goraebap@220.80.109.248:~/apps/todogen/api/
scp -P 23022 -r web/dist web/Dockerfile                    dev-goraebap@220.80.109.248:~/apps/todogen/web/

# 3. 서버에서 이미지 갱신
ssh -p 23022 dev-goraebap@220.80.109.248 \
  "cd ~/apps/todogen && docker compose build && docker compose up -d"
```

`.env`(자격증명 · AUTH_SECRET · R2 키)는 서버에만 있고 어디에도 커밋하지 않는다. 키 이름은
`server/src/main/resources/application.properties` 의 환경변수 자리와 같다.

SSR 컨테이너에는 `NG_ALLOWED_HOSTS=todogen.app` 이 필요하다. Angular SSR 의 SSRF 가드가
Host 헤더를 허용 목록과 대조하며, 없으면 모든 요청이 400 으로 끝난다. 서버의
`docker-compose.yml` 이 이 값을 갖는다.

R2 버킷의 CORS 는 `https://todogen.app` 의 GET · PUT 허용에 더해 **`ExposeHeaders` 에
`etag` 가 있어야 한다** — 브라우저가 presigned URL 로 직접 올리고, uppy 가 업로드 검증에
응답의 ETag 헤더를 읽는데 노출하지 않으면 100% 에서 멈춘다. 로컬 개발은 R2 가 아니라
compose 의 MinIO 를 쓴다(기본 설정으로 충분하다).

```json
[
  {
    "AllowedOrigins": ["https://todogen.app"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```
