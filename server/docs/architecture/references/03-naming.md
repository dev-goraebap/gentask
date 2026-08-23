# 03. 명명 규칙

본 문서는 패키지와 클래스의 명명 규약을 정의합니다. **계층은 폴더가 아니라 이름으로 식별되는 구간이 있으므로, 이 규약은 배치 규칙의 일부입니다.**

## 1. 패키지

| 대상 | 규약 |
| :--- | :--- |
| **모듈** | 단수 소문자 한 단어 (`task` · `user` · `notification`) |
| **계층** | `contract` · `application` · `domain` · `infrastructure` 로 고정 |
| **세그먼트** | 복수형을 쓰지 않습니다 (`config` · `error` · `web`) |

모듈 이름을 복수로 쓰지 않습니다. 모듈은 애그리거트의 소유자이지 그것의 컬렉션이 아닙니다.

## 2. 클래스 접미사

`application` 패키지 안에는 프레젠테이션 계층과 애플리케이션 계층이 함께 있습니다. 둘을 가르는 것은 폴더가 아니라 **클래스의 역할이며, ArchUnit 이 이 이름으로 판정합니다.**

| 역할 | 식별 | 자리 |
| :--- | :--- | :--- |
| **컨트롤러** | `@RestController` + `Controller` 접미사 | `application` |
| **서비스** | `Service` 접미사 | `application` |
| **조회 서비스** | `QueryService` 접미사 | `application` |
| **조회 포트** | `Queries` 접미사 | `application` |
| **요청 DTO 묶음** | `Requests` 접미사 | `application` |
| **응답 DTO 묶음** | `Views` 접미사 | `application` |
| **에러 코드** | `ErrorCode` 접미사 | `application` |
| **저장소 인터페이스** | `Repository` 접미사 | `domain` |
| **포트 구현** | 기술 접두사 + 포트 이름 (`JooqTaskRepository`) | `infrastructure` |

**조회 포트의 이름을 `QueryRepository` 로 짓지 않습니다.** 저장소는 애그리거트를 다루는 계약이고 조회 포트는 화면 구조를 만드는 계약이라 지키는 것이 다릅니다([05. 조회와 명령](05-query-command.md) 3절). 이름이 겹치면 그 차이가 흐려집니다.

**포트의 이름은 제공하는 것으로 짓습니다.** `TaskQueries` 는 작업에 대한 조회를 제공하고, `AssigneeLookup` 은 담당자 찾기를 제공합니다. 구현 기술이나 저장 위치를 이름에 담지 않습니다.

## 3. DTO

요청과 응답 record 는 **모듈당 하나의 묶음 클래스 안에 중첩합니다.**

```java
public final class TaskRequests {

    private TaskRequests() {}

    public record CreateTask(
            @NotBlank(message = TaskTitle.REQUIRED)
            @Size(max = TaskTitle.MAX) String title) {}

    public record ChangeDueDate(LocalDate dueDate) {}
}
```

record 하나에 파일 하나를 두면 작은 타입이 폴더를 채우고, 그 폴더를 열어야 이 모듈이 무엇을 받는지 알 수 있습니다. 묶어 두면 **요청 목록 전체가 한 화면에 보입니다.**

묶음이 한 화면을 넘기면 그때 나눕니다. 나누는 단위는 피쳐이며 [02. 패키지 배치와 참조 규칙](02-package-structure.md) 2절의 승격 기준을 따릅니다.

**목록과 상세가 같은 형태를 쓰는 동안은 응답 record 를 나누지 않습니다.** 둘을 미리 나누면 필드 하나가 늘 때마다 두 곳을 고치게 됩니다. 상세에만 있는 필드가 생기는 시점에 나눕니다.

## 4. 에러 코드 문자열

`<모듈>_<사유>` 의 SCREAMING_SNAKE_CASE 입니다.

```java
TASK_NOT_FOUND
TASK_ALREADY_DONE
COMMON_INVALID_REQUEST
```

**하이픈은 요구사항 식별자, 언더스코어는 에러 코드로 구분을 강제합니다.** 유스케이스 ID 가 `TK-001` 이고 에러 코드가 `TASK_NOT_FOUND` 이므로, 저장소 전체 검색에서 두 종류가 섞이지 않습니다.

## 5. 메서드

| 대상 | 규약 |
| :--- | :--- |
| **도메인 생성 팩토리** | 업무 낱말 (`create` · `register`). `new` 를 공개하지 않습니다 |
| **도메인 재구성** | `restore` 로 고정. 저장소만 호출합니다 |
| **명령 메서드** | 동사로 시작하고 `void` 또는 식별자를 반환합니다 |
| **조회 메서드** | `find` 는 없을 수 있음을, `get` 은 없으면 실패함을 뜻합니다 |

접근자에 `get` 접두사를 붙이지 않습니다. 도메인 타입과 record 는 필드명을 그대로 메서드 이름으로 씁니다(`task.title()`). Lombok 의 `@Getter` 를 쓰는 열거형만 예외이며, 인터페이스가 요구하는 이름에 맞춥니다.

## 6. 테스트

테스트 클래스는 대상 클래스 이름 + `Test` 입니다. 검증 대상이 아니라 **성공 조건**을 이름으로 갖는 테스트가 따로 있으며, 그 규약과 슬라이스 ID 부여 규칙은 [프로세스 문서](../../../../docs/process.md)가 소유합니다.
