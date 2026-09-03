# 백엔드 01. 개발 환경

백엔드 애플리케이션의 빌드 구성과 로컬 실행 절차, 정적 분석 분담 체계 및 규칙이 강제되는 지점을 정의한다.

본 문서는 규칙이 빌드 및 정적 분석 도구에서 강제되는 지점과 실행 환경 요건을 명시한다.

## 1. 구성 파일

설정값을 문서에 중복 기술하지 않고 구성 파일을 단일 진실 공급원(Single Source of Truth)으로 참조한다. 문서는 규칙과 판정 기준을 정의하고, 구성 파일은 해당 규칙의 구체적인 실행 형태를 관리한다.

| 파일 | 역할 |
| :--- | :--- |
| `build.gradle` | 의존성, 코드 생성, 정적 분석 및 빌드 태스크 설정 |
| `settings.gradle` | 프로젝트 명칭 및 플러그인 저장소 설정 |
| `gradle/gradle-daemon-jvm.properties` | Gradle 데몬 실행 JVM 버전 지정 |
| `compose.yaml` | 개발용 PostgreSQL과 MinIO 컨테이너 정의 |
| `src/main/resources/application.properties` | 설정의 골격. 환경별 가변 값은 `${VAR}` 자리표시자로 선언하고 기본값을 두지 않는다 |
| `lombok.config` | [Lombok](https://projectlombok.org/features/configuration) 접근자 스타일 지정 및 금지 기능 설정 |
| `config/checkstyle/` | [Checkstyle](https://checkstyle.org/) 코딩 컨벤션 규칙 및 예외 목록 |
| `config/spotbugs/` | [SpotBugs](https://spotbugs.github.io/) 결함 탐지 오탐 제외 필터 목록 |

## 2. JVM

컴파일 대상은 Java 21이며, **Gradle 데몬 실행 JVM 역시 21 이상이어야 한다.**

`build.gradle`의 `toolchain` 설정은 소스 컴파일에만 적용되며, 플러그인은 Gradle 데몬 JVM에서 로드된다. [jOOQ](https://www.jooq.org/) 코드 생성 플러그인이 JVM 21을 요구하므로 데몬 JVM 버전이 충족되지 않으면 빌드 구성(Configuration) 단계에서 실패한다. `gradle/gradle-daemon-jvm.properties`에 데몬 JVM 버전을 고정하여 관리하며, 로컬 환경에 적합한 JDK가 없는 경우 Gradle 도구체인 자동 프로비저닝(Auto-provisioning)을 통해 필요한 버전을 내려받는다.

## 3. 로컬 실행

저장소를 체크아웃한 후 `server/.env` 파일을 생성하고 `application.properties`에 `${VAR}`로 선언된 환경 변수 키를 설정한다. 이 파일은 버전 관리에서 제외되며, 필수 변수가 누락되면 애플리케이션 기동이 실패한다.

**개발용 데이터베이스와 파일 스토리지는 로컬 컨테이너로 구동한다.** `compose.yaml`이 PostgreSQL과 MinIO를 정의하고 `spring-boot-docker-compose`가 애플리케이션 기동 시 함께 실행한다. 컨테이너와 데이터는 작업자마다 독립적이다. 상세 배경은 [결정-0014](../decisions/0014-backend-development-backing-services.md)에 기술되어 있다.

```bash
./gradlew bootRun
```

**Docker 데몬이 실행 중이어야 한다.** 컨테이너를 기동하지 못하면 데이터베이스 연결에 실패하여 애플리케이션이 기동하지 않는다.

브랜치를 전환하여 Flyway 체크섬이 어긋나면 개발 데이터베이스를 재생성하고 시드 스크립트로 테스트 데이터를 복원한다.

모든 접속 정보는 `server/.env` 파일에서 단일 관리한다. 애플리케이션은 `spring.config.import`를 통해 환경 변수를 로드하며, 배포 환경에서는 동일한 키를 컨테이너 환경 변수로 주입한다.

**`application.properties`에는 자격 증명의 기본값을 선언하지 않는다.** 기본값을 설정하면 배포 환경에서 환경 변수 주입이 누락되어도 로컬 설정으로 비정상 기동되며, 해당 오류가 로그에 즉각 드러나지 않기 때문이다. 필수 설정값 누락을 배포 시점에 즉시 검출할 수 있도록 한다. 기본값은 세션 수명, 인증 코드 자릿수 등 비민감성 정책 설정에 한하여 적용한다.

**개발용 컨테이너는 로컬 루프백에만 바인딩한다.** 외부 네트워크에서 접근할 수 없으며, 노출 포트는 `compose.yaml`과 `.env`에 정의한다.

## 4. 빌드가 하는 일

```bash
./gradlew build
```

| 단계 | 하는 일 | 실패 조건 |
| :--- | :--- | :--- |
| **`jooqCodegen`** | 마이그레이션 SQL 파일로부터 jOOQ 테이블 클래스를 생성한다 | SQL 구문 파싱에 실패할 때 |
| **`compileJava`** | 생성된 jOOQ 코드를 소스 경로에 포함하여 Java 컴파일을 수행한다 | 존재하지 않는 테이블·컬럼 참조 또는 타입 불일치 시 |
| **`spotlessCheck`** | 코드 포맷팅 규격 준수 여부를 검사한다 | 포맷팅 규격과 불일치할 때 (`./gradlew spotlessApply`로 교정) |
| **`checkstyleMain`** | 명명 규칙 및 금지 패턴 위반 여부를 검사한다 | Checkstyle 규칙 위반이 1건 이상 검출될 때 |
| **`spotbugsMain`** | 컴파일된 바이트코드에서 잠재 결함 패턴을 탐지한다 | 제외 필터 목록에 등록되지 않은 결함 패턴이 검출될 때 |
| **`test`** | 단위 테스트, 통합 테스트, ArchUnit 아키텍처 규칙을 실행한다 | 테스트 단언 실패 또는 아키텍처 규칙 위반 시 |

**코드 생성(`jooqCodegen`)은 Java 컴파일(`compileJava`)보다 먼저 실행된다.** 데이터베이스 스키마와 애플리케이션 코드 간의 불일치를 런타임이 아닌 빌드 시점에 즉시 검출하도록 태스크 의존성을 강제한다.

## 5. 정적 분석의 분담

정적 분석 도구별 검증 책임을 **중복 없이 분리**하여 관리한다.

| 도구 | 맡는 것 | 성격 |
| :--- | :--- | :--- |
| **Spotless** | 코드 포맷팅 (들여쓰기, 줄바꿈, 미사용 임포트 제거 등) | 자동 교정 수행 (`spotlessApply`) |
| **Checkstyle** | 명명 규칙 및 금지 패턴 검사 | 소스 코드 정적 분석 (위반 시 빌드 차단) |
| **SpotBugs** | 잠재 결함 패턴 탐지 | 바이트코드 정적 분석 (위반 시 빌드 차단) |
| **[ArchUnit](https://www.archunit.org/)** | 패키지 의존성 및 아키텍처 계층 구조 규칙 검증 | 단위 테스트 단계에서 실행 |

**Checkstyle에는 포맷팅 검증 규칙을 포함하지 않는다.** 포맷팅은 Spotless를 통한 자동 교정으로 일원화하여 도구 간 규칙 충돌(자동 교정과 검증 실패의 상충)을 방지한다.

**자동 생성 코드는 4개 도구 모두에서 검사 대상에서 제외한다.** 수동 수정이 불가능한 생성 코드에 의한 오탐과 불필요한 빌드 차단을 방지하기 위함이다.

정당한 예외는 각 도구의 억제 목록(Checkstyle 서프레션, SpotBugs 제외 필터)에 등록하여 관리한다.

## 6. 테스트 실행 요건

**통합 테스트 실행에는 Docker 환경이 필수이다.** [Testcontainers](https://testcontainers.com/)를 통해 실제 PostgreSQL 컨테이너를 구동하고 Flyway 마이그레이션을 적용하여 검증한다. 로컬에 Docker 환경이 갖춰지지 않은 경우 통합 테스트만 실패하며, 단위 테스트 및 ArchUnit 아키텍처 검증은 정상 실행된다.

**테스트용 컨테이너는 개발용 컨테이너와 분리하여 실행한다.** 테스트마다 일회용 컨테이너를 생성하고 종료 시 폐기하므로 개발 데이터가 테스트 결과에 영향을 주지 않는다.

**개발 · 테스트 · 운영의 데이터베이스 메이저 버전을 일치시킨다.** 엔진 버전 차이로 인해 한쪽에서 성공한 마이그레이션이 다른 쪽에서 예기치 않게 실패하는 문제를 방지하기 위함이다. `compose.yaml`과 테스트 컨테이너의 이미지 태그를 운영 인스턴스의 버전에 맞춘다.

## 7. API 명세의 생성

프론트엔드가 소비하는 TypeScript 인터페이스 타입은 백엔드가 제공하는 OpenAPI 명세로부터 생성된다. 명세는 [`springdoc-openapi`](https://springdoc.org/)가 애플리케이션 런타임에 제공하며, 클라이언트 코드 생성 절차와 산출물 관리 규격은 [프론트엔드 01. 개발 환경](./frontend-01-dev-environment.md)에 기술되어 있다.

백엔드 엔드포인트 또는 요청/응답 DTO를 변경한 경우, OpenAPI 명세를 기반으로 프론트엔드 타입 생성을 재실행하여 두 컴포넌트 간의 인터페이스 정합성을 유지해야 한다.
