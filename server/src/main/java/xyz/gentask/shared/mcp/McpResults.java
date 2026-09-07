package xyz.gentask.shared.mcp;

import io.modelcontextprotocol.common.McpTransportContext;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import jakarta.validation.Validator;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;
import xyz.gentask.shared.error.BusinessException;
import xyz.gentask.shared.error.DomainRuleViolation;
import xyz.gentask.shared.web.CurrentUser;

@Component
@RequiredArgsConstructor
@Slf4j
public class McpResults {
    private final JsonMapper mapper;
    private final Validator validator;

    public UUID userId(McpTransportContext context) {
        if (context.get(CurrentUser.ATTRIBUTE) instanceof UUID id) return id;
        throw new IllegalStateException("MCP 인증 컨텍스트가 없습니다");
    }

    public <T> T validate(T request) {
        var violations = validator.validate(request);
        if (!violations.isEmpty()) {
            String detail = violations.stream()
                    .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                    .sorted()
                    .reduce((left, right) -> left + "; " + right)
                    .orElseThrow();
            throw new DomainRuleViolation(detail);
        }
        return request;
    }

    public CallToolResult call(Supplier<?> action) {
        try {
            return CallToolResult.builder()
                    .addTextContent(mapper.writeValueAsString(Map.of("data", action.get())))
                    .isError(false)
                    .build();
        } catch (BusinessException exception) {
            return error(exception.errorCode().code(), exception.getMessage());
        } catch (DomainRuleViolation | IllegalArgumentException exception) {
            return error("COMMON_INVALID_REQUEST", exception.getMessage());
        } catch (DataIntegrityViolationException exception) {
            return error("COMMON_CONFLICT", "다른 변경과 충돌했습니다. 최신 내용을 다시 조회하세요");
        } catch (RuntimeException exception) {
            log.error("MCP 도구 실행 실패", exception);
            return error("COMMON_INTERNAL_ERROR", "일시적인 오류입니다. 잠시 후 다시 시도하세요");
        }
    }

    private CallToolResult error(String code, String detail) {
        return CallToolResult.builder()
                .addTextContent(mapper.writeValueAsString(Map.of("code", code, "detail", detail)))
                .isError(true)
                .build();
    }
}
