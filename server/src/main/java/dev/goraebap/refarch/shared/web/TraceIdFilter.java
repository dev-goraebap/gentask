package dev.goraebap.refarch.shared.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 요청 하나에 추적 식별자를 붙인다.
 *
 * <p>로그와 응답을 잇는 값이다. 사용자가 받은 응답의 식별자로 그 요청의 로그를 찾을 수 있어야
 * 장애 문의가 재현 시도로 이어지지 않는다.
 *
 * <p><b>식별자 용도로 쓰지 않는다.</b> 요청마다 새로 만들며 무엇도 이 값으로 조회하지 않는다.
 */
@Component
public class TraceIdFilter extends OncePerRequestFilter {

    public static final String MDC_KEY = "traceId";

    private static final String HEADER = "X-Trace-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String traceId = UUID.randomUUID().toString();
        MDC.put(MDC_KEY, traceId);
        response.setHeader(HEADER, traceId);
        try {
            chain.doFilter(request, response);
        } finally {
            // 스레드가 재사용되므로 지운다. 남기면 다음 요청의 로그에 남의 식별자가 붙는다.
            MDC.remove(MDC_KEY);
        }
    }
}
