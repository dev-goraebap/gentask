package xyz.gentask.shared.mcp;

import io.modelcontextprotocol.common.McpTransportContext;
import io.modelcontextprotocol.json.jackson3.JacksonMcpJsonMapper;
import java.util.Map;
import java.util.UUID;
import org.springframework.ai.mcp.server.webmvc.transport.WebMvcStatelessServerTransport;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.json.JsonMapper;
import xyz.gentask.shared.web.CurrentUser;

@Configuration
@ConditionalOnProperty(name = "spring.ai.mcp.server.enabled", havingValue = "true", matchIfMissing = true)
public class McpConfiguration {
    public static final String ENDPOINT = "/api/mcp";

    @Bean
    WebMvcStatelessServerTransport webMvcStatelessServerTransport(@Qualifier("mcpServerJsonMapper") JsonMapper mapper) {
        return WebMvcStatelessServerTransport.builder()
                .jsonMapper(new JacksonMcpJsonMapper(mapper))
                .messageEndpoint(ENDPOINT)
                .contextExtractor(request -> {
                    Object userId = request.servletRequest().getAttribute(CurrentUser.ATTRIBUTE);
                    if (!(userId instanceof UUID)) {
                        throw new IllegalStateException("MCP 인증 컨텍스트가 없습니다");
                    }
                    return McpTransportContext.create(Map.of(CurrentUser.ATTRIBUTE, userId));
                })
                .build();
    }
}
