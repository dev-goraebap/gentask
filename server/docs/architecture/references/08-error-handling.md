# 08. 예외 · 에러 코드

본 문서는 실패를 표현하고 바깥으로 내보내는 방식, 그리고 기록 범위를 정의합니다.

## 1. 세 겹의 그물

같은 요청이 세 지점에서 막힐 수 있고, 각 지점이 지키는 범위가 다릅니다.

```text
요청 ─▶ [DTO]          형식이 틀렸다        → 필드 목록, 코드는 공통값
         │ 통과
         ▼
       [application]   지금 상태가 아니다   → 모듈 에러 코드
         │ 통과
         ▼
       [domain]        애초에 만들 수 없다  → 문장, 코드는 공통값
         │ 통과
         ▼
       저장
```

| | DTO 검증 | 도메인 검증 |
| :--- | :--- | :--- |
| **묻는 것** | 이 **요청**이 형식에 맞는가 | 이 **객체**가 존재할 수 있는가 |
| **판정 시점** | 컨트롤러 진입 전 | 객체 생성 순간 |
| **지키는 범위** | HTTP 요청 경로 | 모든 생성 경로 |
| **필드 정보** | 있습니다 | 없습니다 |

**두 검증이 겹치는 것은 중복이 아닙니다.** DTO 검증은 HTTP 요청 하나를 지키고, 도메인 검증은 그 타입을 만드는 모든 경로를 지킵니다. 배치 처리나 자동 생성처럼 컨트롤러를 거치지 않는 경로가 생기면 도메인 검증만 남습니다. 반대로 DTO 검증을 지우면 필드 단위 오류 표시가 사라지고 트랜잭션을 연 뒤에야 400 이 나갑니다.

검증의 근거가 되는 값과 문구는 값 객체가 소유하고 DTO 가 참조합니다([04. 계층](04-layers.md) 3절). **검증은 두 번 실행되지만 고칠 자리는 한 곳입니다.**

## 2. 예외

비즈니스 실패는 **항상 예외로 던집니다.** 컨트롤러가 `ResponseEntity` 를 직접 조립하지 않으며 `@RestControllerAdvice` 전역 핸들러가 [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) 응답으로 변환합니다.

| 던지는 것 | 뜻 | 응답 | 문장의 성격 |
| :--- | :--- | :--- | :--- |
| `BusinessException` | 지금 상태가 이 요청을 허용하지 않는다 | 코드가 정한 상태 | 사용자 문장 |
| `DomainRuleViolation` | 들어온 값이 규칙에 맞지 않는다 | 400 | **사용자 문장** |
| `IllegalStateException` | 여기 도달하면 안 되는데 도달했다 | 500 | 개발자 문장, 로그만 |

### `DomainRuleViolation` 을 따로 두는 이유

도메인이 `IllegalArgumentException` 을 던지면 핸들러가 **우리가 던진 것과 라이브러리가 던진 것을 구분할 수 없습니다.** 구분하지 못하면 안전한 쪽으로 전부 덮어써야 하고, 그러면 도메인이 쓴 문구가 매번 버려집니다.

전용 타입을 두면 구분이 타입 하나로 끝납니다.

```java
// shared/error — HTTP 도 프레임워크도 모르는 순수 예외
public class DomainRuleViolation extends RuntimeException {
    public DomainRuleViolation(String message) { super(message); }
}
```

```java
@ExceptionHandler(DomainRuleViolation.class)          // 우리 것 → 문장을 살린다
@ExceptionHandler(IllegalArgumentException.class)     // 남의 것 → 덮어쓴다
```

**이 타입으로 던진 문장은 응답의 `detail` 에 그대로 실립니다.** 사용자가 읽을 문장이어야 하며 내부 정보(테이블명·식별자·스택 정보)를 담지 않습니다.

## 3. 에러 코드

`code` 는 클라이언트가 분기에 쓰는 계약입니다. 문구는 바뀔 수 있지만 코드는 고정입니다.

### 인터페이스

```java
public interface ErrorCode {

    HttpStatus status();
    String message();
    String name();                       // enum 이 제공합니다

    default String code() { return name(); }
    default BusinessException raise() { return new BusinessException(this, message()); }
    default BusinessException raise(String detail) { return new BusinessException(this, detail); }
}
```

`code()` 를 default 로 두는 이유는 enum 이 이미 `name()` 을 갖고 있기 때문이며, **`raise()` 를 두는 이유는 문자열을 두 번 쓰지 않기 위해서입니다.** 코드와 문구를 함께 선언해 놓고 던질 때 문구를 다시 적으면 같은 문장이 두 곳에 존재하게 됩니다.

### 모듈 열거형

```java
@Getter
@RequiredArgsConstructor
public enum TaskErrorCode implements ErrorCode {

    TASK_NOT_FOUND(HttpStatus.NOT_FOUND, "작업을 찾을 수 없습니다"),
    TASK_ALREADY_DONE(HttpStatus.CONFLICT, "이미 완료한 작업입니다");

    private final HttpStatus status;
    private final String message;
}
```

**선언이 상수 목록과 필드 둘로 끝납니다.** 계약이 요구하는 `status()` 와 `message()` 는 생성된 접근자가 그대로 만족합니다 — `lombok.config` 가 접근자를 필드명 그대로 만들기 때문입니다([03. 명명 규칙](03-naming.md) 5절).

```java
throw TASK_NOT_FOUND.raise();
throw TASK_NOT_FOUND.raise("기한이 지난 작업입니다");   // 맥락이 필요할 때만
```

코드 문자열은 `<모듈>_<사유>` 의 SCREAMING_SNAKE_CASE 입니다. **접두사 등록부는 열거형 집합 자체이며 문서로 따로 두지 않습니다.** 두 벌이 되면 한쪽이 낡습니다.

**모듈 열거형에는 그 모듈 고유의 사유만 담습니다.** 잘못된 요청·충돌·서버 오류는 `shared/error` 에 한 벌만 두고 모듈이 늘어도 복제하지 않습니다.

### `title` 을 두지 않습니다

RFC 9457 의 `title` 은 *"문제 유형에 대한 요약이며 발생마다 바뀌지 않는 값"* 입니다. 사람이 읽을 문장은 `detail` 의 것이고, 클라이언트가 분기에 쓰는 것은 `code` 입니다. 열거형에 사람이 읽을 문장을 `title` 로 두면 `detail` 과 겹쳐 **같은 문장이 응답에 두 번 실립니다.** 상태 코드의 일반명을 프레임워크가 채우도록 둡니다.

### 열거 가능성을 만들지 않습니다

사유를 구분하되 그 구분이 존재 여부를 알려 주는 신호가 되지 않게 합니다. 대상이 없는 경우와 접근 권한이 없는 경우를 다른 코드로 나누면, 그 차이가 곧 "그 식별자의 자원이 존재한다"는 정보가 됩니다. 둘을 같은 코드로 응답합니다.

## 4. 응답의 형태

```json
{
  "status": 400,
  "detail": "제목을 입력해 주세요",
  "code": "COMMON_INVALID_REQUEST",
  "traceId": "...",
  "errors": [
    { "field": "title", "message": "제목을 입력해 주세요" }
  ]
}
```

**DTO 검증 실패는 `errors` 배열로 구조를 유지합니다.** 필드 이름을 문자열 하나로 이어 붙이면 클라이언트가 그것을 파싱해야 하고, 서버가 문구를 조금만 바꿔도 깨집니다.

**필드의 이름과 메시지는 싣고 입력 값은 싣지 않습니다.** 메시지는 우리가 애노테이션에 쓴 문구이지 사용자가 보낸 값이 아닙니다. 값을 실으면 민감한 입력이 에러 응답으로 되반사됩니다.

## 5. 문구의 소유권

**서버는 코드와 문장을 함께 보내고, 클라이언트는 코드를 우선 씁니다.**

```ts
const text = MESSAGES[problem.code] ?? problem.detail;
```

코드가 안정적인 계약이므로 서버는 문구를 자유롭게 고칠 수 있고, 클라이언트는 화면 맥락에 맞는 문구를 쓰되 모르는 코드가 와도 화면이 비지 않습니다([Postman](https://blog.postman.com/best-practices-for-api-error-handling/), [CodeOpinion](https://codeopinion.com/your-api-errors-suck-heres-how-to-fix-them/)).

도메인 위반은 코드가 공통값 하나이므로 분기할 대상이 없고, 결과적으로 `detail` 이 그대로 표시됩니다. **도메인 문구를 사용자 문장으로 쓰는 규칙(2절)의 근거가 여기 있습니다.**

## 6. 로깅

| 구분 | 준수 지침 (Do) | 금지 지침 (Don't) |
| :--- | :--- | :--- |
| **요청 추적** | MDC 의 `traceId` 와 응답 헤더로 상관관계를 잇습니다 | 추적 식별자를 키나 식별자 용도로 씁니다 |
| **기록 대상** | 식별자만 기록합니다 | 비밀·토큰·개인정보 원문을 기록합니다 |
| **기록 수준** | 500 계열만 `error`, 예상된 실패는 기록하지 않습니다 | 모든 예외를 스택과 함께 남깁니다 |

예상된 실패(`BusinessException` · `DomainRuleViolation`)를 `error` 로 남기지 않습니다. 정상적으로 처리된 흐름이 오류 로그를 채우면 진짜 장애가 그 안에 묻힙니다.

## 7. 필터 단계의 실패

전역 핸들러는 컨트롤러 진입 이전, 즉 필터 단계의 실패를 잡지 못합니다. 필터에서 실패를 내보내야 하면 **RFC 9457 본문을 직접 쓰는 전용 컴포넌트를 경유합니다.** 그러지 않으면 컨테이너 기본 오류 페이지가 나가 형식이 갈리고, 클라이언트가 그 경로만 다르게 처리하게 됩니다.
