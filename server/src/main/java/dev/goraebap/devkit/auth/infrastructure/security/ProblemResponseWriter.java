package dev.goraebap.devkit.auth.infrastructure.security;

import dev.goraebap.devkit.common.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * 필터 단계의 에러도 RFC 7807 형식으로 응답한다 (설계/서버.md §1.3) — 예외 핸들러는 컨트롤러
 * 이후만 담당하므로 보안 필터는 직접 쓴다.
 */
@Component
class ProblemResponseWriter {

    private final ObjectMapper objectMapper;

    ProblemResponseWriter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    void write(HttpServletRequest request, HttpServletResponse response, ErrorCode code, String detail)
            throws IOException {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.valueOf(code.status()), detail);
        problem.setTitle(code.title());
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("code", code.code());
        problem.setProperty("traceId", MDC.get("traceId"));

        response.setStatus(code.status());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(), problem);
    }
}
