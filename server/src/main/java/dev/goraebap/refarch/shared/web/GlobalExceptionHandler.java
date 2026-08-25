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

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

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

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail handleIllegalArgument(
            IllegalArgumentException illegalArgumentException, HttpServletRequest httpServletRequest) {
        return toProblemDetail(
                CommonErrorCode.COMMON_INVALID_REQUEST,
                CommonErrorCode.COMMON_INVALID_REQUEST.message(),
                httpServletRequest);
    }

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

    private static String messageOf(FieldError fieldError) {
        return fieldError.getDefaultMessage() == null
                ? CommonErrorCode.COMMON_INVALID_REQUEST.message()
                : fieldError.getDefaultMessage();
    }
}
