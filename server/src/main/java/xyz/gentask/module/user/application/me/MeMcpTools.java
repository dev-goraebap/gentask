package xyz.gentask.module.user.application.me;

import io.modelcontextprotocol.common.McpTransportContext;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpTool.McpAnnotations;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;
import xyz.gentask.shared.mcp.McpResults;

@Component
@RequiredArgsConstructor
public class MeMcpTools {
    private final McpResults results;
    private final MeService me;

    @McpTool(
            name = "get_my_profile",
            description = "인증된 사용자의 프로필을 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult getMyProfile(McpTransportContext context) {
        return results.call(() -> {
            return me.me(results.userId(context));
        });
    }

    @McpTool(
            name = "update_my_nickname",
            description = "자신의 닉네임을 변경한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult updateMyNickname(
            McpTransportContext context, @McpToolParam(description = "nickname", required = true) String nickname) {
        return results.call(() -> {
            var r = results.validate(new xyz.gentask.module.user.application.UserRequests.ChangeNickname(nickname));
            me.changeNickname(results.userId(context), r.nickname());
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "set_profile_image",
            description = "업로드한 파일을 자신의 프로필 이미지로 지정한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult setProfileImage(
            McpTransportContext context, @McpToolParam(description = "objectKey", required = true) String objectKey) {
        return results.call(() -> {
            me.confirmProfileImage(results.userId(context), objectKey);
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "delete_profile_image",
            description = "자신의 프로필 이미지를 제거한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult deleteProfileImage(McpTransportContext context) {
        return results.call(() -> {
            me.clearProfileImage(results.userId(context));
            return Map.of("saved", true);
        });
    }
}
