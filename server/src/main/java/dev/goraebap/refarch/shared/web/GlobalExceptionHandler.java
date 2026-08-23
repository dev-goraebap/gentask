package dev.goraebap.refarch.shared.web;

import dev.goraebap.refarch.shared.error.BusinessException;
import dev.goraebap.refarch.shared.error.CommonErrorCode;
import dev.goraebap.refarch.shared.error.DomainRuleViolation;
import dev.goraebap.refarch.shared.error.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * 모든 실패를 RFC 9457({@code application/problem+json}) 단일 형식으로 옮긴다.
 *
 * <p>{@link ResponseEntityExceptionHandler} 를 상속해 Spring MVC 표준 예외(404 · 405 · 본문 해석
 * 실패)의 상태 코드를 보존하고, 모든 응답에 {@code code} 와 {@code traceId} 를 얹는다.
 *
 * <p><b>우리가 던진 것과 남이 던진 것을 타입으로 가른다.</b> {@link DomainRuleViolation} 의 문장은
 * 사용자가 읽을 것이므로 그대로 내보내고, 우리가 던지지 않은 {@code IllegalArgumentException} 은
 * 라이브러리 내부 사정이 새어 나가지 않게 덮는다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    /** 입력 검증 실패의 필드별 항목. 값이 아니라 이름과 우리가 쓴 문구만 담는다. */
    public record InvalidField(String field, String message) {}

    @ExceptionHandler(BusinessException.class)
    ProblemDetail handleBusiness(BusinessException e, HttpServletRequest request) {
        return problem(e.errorCode(), e.getMessage(), request);
    }

    /** 도메인이 쓴 문장을 그대로 내보낸다. 코드는 공통값이므로 클라이언트가 분기하지 않는다. */
    @ExceptionHandler(DomainRuleViolation.class)
    ProblemDetail handleDomainRule(DomainRuleViolation e, HttpServletRequest request) {
        return problem(CommonErrorCode.COMMON_INVALID_REQUEST, e.getMessage(), request);
    }

    /**
     * 우리가 던지지 않은 인자 예외. 라이브러리 내부에서 올라온 것일 수 있으므로 문장을 덮는다.
     * 우리 도메인은 {@link DomainRuleViolation} 을 쓰며 그쪽만 문장이 보존된다.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail handleIllegalArgument(IllegalArgumentException e, HttpServletRequest request) {
        return problem(
                CommonErrorCode.COMMON_INVALID_REQUEST, CommonErrorCode.COMMON_INVALID_REQUEST.message(), request);
    }

    /**
     * 유일성 제약이 막은 동시 생성. 서비스의 사전 확인을 두 요청이 같은 순간에 통과하면 최종
     * 방어선은 제약뿐이다. 그것이 정상 동작인데도 500 으로 나가면 진짜 장애와 구분되지 않는다.
     *
     * <p>어떤 제약이 걸렸는지는 응답에 싣지 않는다 — 제약 이름이 곧 스키마 정보다.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail handleConflict(DataIntegrityViolationException e, HttpServletRequest request) {
        log.warn("유일성 제약 충돌 (traceId={})", MDC.get(TraceIdFilter.MDC_KEY), e);
        return problem(CommonErrorCode.COMMON_CONFLICT, "요청이 다른 작업과 충돌했습니다. 다시 시도해 주세요", request);
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail handleUnexpected(Exception e, HttpServletRequest request) {
        log.error("처리되지 않은 예외 (traceId={})", MDC.get(TraceIdFilter.MDC_KEY), e);
        return problem(CommonErrorCode.COMMON_INTERNAL_ERROR, "일시적인 오류입니다. 잠시 후 다시 시도해 주세요", request);
    }

    /**
     * 입력 검증 실패는 필드 목록을 구조로 준다. 이름을 문자열 하나로 이어 붙이면 클라이언트가
     * 그것을 파싱해야 하고, 서버가 문구를 조금만 바꿔도 깨진다.
     */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        List<InvalidField> fields = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> new InvalidField(error.getField(), messageOf(error)))
                .toList();

        ProblemDetail body = ProblemDetail.forStatusAndDetail(status, CommonErrorCode.COMMON_INVALID_REQUEST.message());
        body.setProperty("errors", fields);
        return handleExceptionInternal(ex, body, headers, status, request);
    }

    /** 표준 예외 응답에도 {@code code} 와 {@code traceId} 를 얹는다. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        ResponseEntity<Object> response = super.handleExceptionInternal(ex, body, headers, statusCode, request);
        if (response != null && response.getBody() instanceof ProblemDetail problem) {
            ErrorCode fallback = statusCode.is5xxServerError()
                    ? CommonErrorCode.COMMON_INTERNAL_ERROR
                    : CommonErrorCode.COMMON_INVALID_REQUEST;
            Map<String, Object> properties = problem.getProperties();
            if (properties == null || !properties.containsKey("code")) {
                problem.setProperty("code", fallback.code());
            }
            problem.setProperty("traceId", MDC.get(TraceIdFilter.MDC_KEY));
        }
        return response;
    }

    private static ProblemDetail problem(ErrorCode code, String detail, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(code.status(), detail);
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("code", code.code());
        problem.setProperty("traceId", MDC.get(TraceIdFilter.MDC_KEY));
        return problem;
    }

    /** 애노테이션에 문구를 적지 않았으면 Bean Validation 기본 문구가 온다. */
    private static String messageOf(FieldError error) {
        return error.getDefaultMessage() == null
                ? CommonErrorCode.COMMON_INVALID_REQUEST.message()
                : error.getDefaultMessage();
    }
}
