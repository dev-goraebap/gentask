package dev.goraebap.devkit.common.web;

import dev.goraebap.devkit.common.BusinessException;
import dev.goraebap.devkit.common.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
 * 모든 에러를 RFC 7807({@code application/problem+json}) 단일 형식으로 변환한다 (설계/서버.md §1.3).
 *
 * <p>{@link ResponseEntityExceptionHandler}를 상속해 Spring MVC 표준 예외(404·405·본문 해석 실패
 * 등)의 상태 코드를 보존하고, 모든 응답에 {@code code}·{@code traceId}를 얹는다.
 *
 * <p>검증 실패 응답에는 필드 <b>이름</b>만 싣고 입력 <b>값</b>은 싣지 않는다 — 비밀번호 같은 민감
 * 값이 에러 응답으로 반사되는 것을 막는다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    ProblemDetail handleBusiness(BusinessException e, HttpServletRequest request) {
        ErrorCode code = e.errorCode();
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.valueOf(code.status()), e.getMessage());
        problem.setTitle(code.title());
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("code", code.code());
        problem.setProperty("traceId", MDC.get(TraceIdFilter.MDC_KEY));
        return problem;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail handleIllegalArgument(IllegalArgumentException e, HttpServletRequest request) {
        return commonProblem(CommonErrorCode.COMMON_INVALID_REQUEST, "요청 값이 올바르지 않습니다", request.getRequestURI());
    }

    /**
     * DB 유일성 제약이 막은 동시 생성 (보안 검토 F4).
     *
     * <p>서비스가 사전 확인으로 대부분을 걸러내지만, 같은 자원을 만들려는 두 요청이 <b>같은 순간</b>에
     * 확인을 통과하면 최종 방어선은 제약뿐이다. 그것이 정상 동작인데도 500으로 나가면 진짜 장애와
     * 구분되지 않아 로그가 오염된다. 충돌은 충돌로 알린다.
     *
     * <p>어떤 제약이 걸렸는지는 응답에 싣지 않는다 — 제약 이름이 곧 스키마 정보다.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail handleConflict(DataIntegrityViolationException e, HttpServletRequest request) {
        log.warn("유일성 제약 충돌 (traceId={})", MDC.get(TraceIdFilter.MDC_KEY), e);
        return commonProblem(CommonErrorCode.COMMON_CONFLICT, "요청이 다른 작업과 충돌했습니다. 다시 시도해 주세요", request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail handleUnexpected(Exception e, HttpServletRequest request) {
        log.error("처리되지 않은 예외 (traceId={})", MDC.get(TraceIdFilter.MDC_KEY), e);
        return commonProblem(
                CommonErrorCode.COMMON_INTERNAL_ERROR, "일시적인 오류입니다. 잠시 후 다시 시도해 주세요", request.getRequestURI());
    }

    /** 검증 실패 — 필드 이름만 노출한다. */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String fields = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getField)
                .distinct()
                .sorted()
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, "잘못된 필드: " + fields);
        return handleExceptionInternal(ex, problem, headers, status, request);
    }

    /** 표준 예외 응답에도 {@code code}·{@code traceId}를 얹는다. */
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

    private ProblemDetail commonProblem(CommonErrorCode code, String detail, String instance) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.valueOf(code.status()), detail);
        problem.setTitle(code.title());
        problem.setInstance(URI.create(instance));
        problem.setProperty("code", code.code());
        problem.setProperty("traceId", MDC.get(TraceIdFilter.MDC_KEY));
        return problem;
    }
}
