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
 * 모든 실패를 RFC 9457 로 옮기고 code 와 traceId 를 얹는다.
 *
 * DomainRuleViolation 의 문장만 사용자에게 그대로 나가고, 나머지 예외의 문장은 덮는다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    /** 입력 검증 실패의 필드별 항목. 값은 담지 않는다. */
    public record InvalidField(String field, String message) {}

    @ExceptionHandler(BusinessException.class)
    ProblemDetail handleBusiness(BusinessException businessException, HttpServletRequest httpServletRequest) {
        return toProblemDetail(businessException.errorCode(), businessException.getMessage(), httpServletRequest);
    }

    @ExceptionHandler(DomainRuleViolation.class)
    ProblemDetail handleDomainRule(DomainRuleViolation domainRuleViolation, HttpServletRequest httpServletRequest) {
        return toProblemDetail(
                CommonErrorCode.COMMON_INVALID_REQUEST, domainRuleViolation.getMessage(), httpServletRequest);
    }

    /** 우리가 던지지 않은 인자 예외. 내부 사정이 새어 나가지 않게 문장을 덮는다. */
    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail handleIllegalArgument(
            IllegalArgumentException illegalArgumentException, HttpServletRequest httpServletRequest) {
        return toProblemDetail(
                CommonErrorCode.COMMON_INVALID_REQUEST,
                CommonErrorCode.COMMON_INVALID_REQUEST.message(),
                httpServletRequest);
    }

    /** 유일성 제약이 막은 동시 생성. 어떤 제약이 걸렸는지는 응답에 싣지 않는다. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail handleConflict(
            DataIntegrityViolationException dataIntegrityViolationException, HttpServletRequest httpServletRequest) {
        log.warn("유일성 제약 충돌 (traceId={})", MDC.get(TraceIdFilter.MDC_KEY), dataIntegrityViolationException);
        return toProblemDetail(CommonErrorCode.COMMON_CONFLICT, "요청이 다른 작업과 충돌했습니다. 다시 시도해 주세요", httpServletRequest);
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail handleUnexpected(Exception exception, HttpServletRequest httpServletRequest) {
        log.error("처리되지 않은 예외 (traceId={})", MDC.get(TraceIdFilter.MDC_KEY), exception);
        return toProblemDetail(
                CommonErrorCode.COMMON_INTERNAL_ERROR, "일시적인 오류입니다. 잠시 후 다시 시도해 주세요", httpServletRequest);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        List<InvalidField> invalidFields = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> new InvalidField(fieldError.getField(), messageOf(fieldError)))
                .toList();

        ProblemDetail problemDetail =
                ProblemDetail.forStatusAndDetail(status, CommonErrorCode.COMMON_INVALID_REQUEST.message());
        problemDetail.setProperty("errors", invalidFields);
        return handleExceptionInternal(ex, problemDetail, headers, status, request);
    }

    /** 표준 예외 응답에도 code 와 traceId 를 얹는다. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        ResponseEntity<Object> responseEntity = super.handleExceptionInternal(ex, body, headers, statusCode, request);
        if (responseEntity != null && responseEntity.getBody() instanceof ProblemDetail problemDetail) {
            ErrorCode fallbackErrorCode = statusCode.is5xxServerError()
                    ? CommonErrorCode.COMMON_INTERNAL_ERROR
                    : CommonErrorCode.COMMON_INVALID_REQUEST;
            Map<String, Object> properties = problemDetail.getProperties();
            if (properties == null || !properties.containsKey("code")) {
                problemDetail.setProperty("code", fallbackErrorCode.code());
            }
            problemDetail.setProperty("traceId", MDC.get(TraceIdFilter.MDC_KEY));
        }
        return responseEntity;
    }

    private static ProblemDetail toProblemDetail(
            ErrorCode errorCode, String detail, HttpServletRequest httpServletRequest) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(errorCode.status(), detail);
        problemDetail.setInstance(URI.create(httpServletRequest.getRequestURI()));
        problemDetail.setProperty("code", errorCode.code());
        problemDetail.setProperty("traceId", MDC.get(TraceIdFilter.MDC_KEY));
        return problemDetail;
    }

    /** 애노테이션에 문구를 적지 않았으면 Bean Validation 기본 문구가 온다. */
    private static String messageOf(FieldError fieldError) {
        return fieldError.getDefaultMessage() == null
                ? CommonErrorCode.COMMON_INVALID_REQUEST.message()
                : fieldError.getDefaultMessage();
    }
}
