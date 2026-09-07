package xyz.gentask.module.user.infrastructure.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.json.JsonMapper;
import xyz.gentask.shared.error.BusinessException;
import xyz.gentask.shared.mcp.McpConfiguration;

@Component
public class McpAuthenticationFilter extends OncePerRequestFilter {
    private final AuthInterceptor authentication;
    private final JsonMapper mapper;
    private final List<String> allowedOrigins;

    public McpAuthenticationFilter(
            AuthInterceptor authentication,
            JsonMapper mapper,
            @Value("${app.mcp.allowed-origins:}") List<String> allowedOrigins) {
        this.authentication = authentication;
        this.mapper = mapper;
        this.allowedOrigins = List.copyOf(allowedOrigins);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !McpConfiguration.ENDPOINT.equals(request.getServletPath());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String origin = request.getHeader("Origin");
        if (origin != null && !allowedOrigins.contains(origin)) {
            reject(response, 403, "MCP_ORIGIN_NOT_ALLOWED", "허용되지 않은 Origin입니다");
            return;
        }
        String authorization = request.getHeader("Authorization");
        if (authorization == null
                || !authorization.startsWith("Bearer ")
                || authorization.substring(7).isBlank()) {
            reject(response, 401, "UNAUTHENTICATED", "에이전트 토큰이 필요합니다");
            return;
        }
        try {
            authentication.preHandle(request, response, this);
        } catch (BusinessException exception) {
            reject(
                    response,
                    exception.errorCode().status().value(),
                    exception.errorCode().code(),
                    exception.getMessage());
            return;
        }
        chain.doFilter(request, response);
    }

    private void reject(HttpServletResponse response, int status, String code, String detail) throws IOException {
        response.setStatus(status);
        response.setContentType("application/problem+json");
        response.setCharacterEncoding("UTF-8");
        if (status == 401) response.setHeader("WWW-Authenticate", "Bearer realm=\"gentask-mcp\"");
        response.getWriter().write(mapper.writeValueAsString(Map.of("status", status, "code", code, "detail", detail)));
    }
}
