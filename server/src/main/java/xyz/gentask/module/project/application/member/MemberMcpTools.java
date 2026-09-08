package xyz.gentask.module.project.application.member;

import io.modelcontextprotocol.common.McpTransportContext;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpTool.McpAnnotations;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;
import xyz.gentask.shared.mcp.McpResults;

@Component
@RequiredArgsConstructor
public class MemberMcpTools {
    private final McpResults results;
    private final MemberService members;

    @McpTool(
            name = "list_project_members",
            description = "프로젝트 멤버와 역할을 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listProjectMembers(
            McpTransportContext context, @McpToolParam(description = "프로젝트 NanoID", required = true) String projectId) {
        return results.call(() -> {
            return members.list(results.userId(context), projectId);
        });
    }

    @McpTool(
            name = "change_project_member_role",
            description = "프로젝트 멤버 역할을 editor 또는 viewer로 바꾼다. 소유자만 가능하다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult changeProjectMemberRole(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID", required = true) String projectId,
            @McpToolParam(description = "memberId", required = true) String memberId,
            @McpToolParam(description = "role", required = true) String role) {
        return results.call(() -> {
            var r = results.validate(new MemberController.ChangeMemberRole(role));
            members.changeRole(results.userId(context), projectId, UUID.fromString(memberId), r.role());
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "remove_project_member",
            description = "프로젝트에서 멤버를 제외한다. 소유자만 가능하다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult removeProjectMember(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID", required = true) String projectId,
            @McpToolParam(description = "memberId", required = true) String memberId) {
        return results.call(() -> {
            members.remove(results.userId(context), projectId, UUID.fromString(memberId));
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "list_project_invitations",
            description = "프로젝트 초대 링크 목록을 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult listProjectInvitations(
            McpTransportContext context, @McpToolParam(description = "프로젝트 NanoID", required = true) String projectId) {
        return results.call(() -> {
            return members.invitations(results.userId(context), projectId);
        });
    }

    @McpTool(
            name = "create_project_invitation",
            description = "초대 링크를 생성한다. 이메일은 발송하지 않는다. role은 editor 또는 viewer, days는 1~30일이다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult createProjectInvitation(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID", required = true) String projectId,
            @McpToolParam(description = "label", required = true) String label,
            @McpToolParam(description = "role", required = true) String role,
            @McpToolParam(description = "days", required = true) int days) {
        return results.call(() -> {
            var r = results.validate(new MemberController.CreateInvitation(label, role, days));
            return members.create(results.userId(context), projectId, r.label(), r.role(), r.days());
        });
    }

    @McpTool(
            name = "revoke_project_invitation",
            description = "초대 링크를 폐기한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = true, openWorldHint = false))
    public CallToolResult revokeProjectInvitation(
            McpTransportContext context,
            @McpToolParam(description = "프로젝트 NanoID", required = true) String projectId,
            @McpToolParam(description = "invitationId", required = true) String invitationId) {
        return results.call(() -> {
            members.revoke(results.userId(context), projectId, invitationId);
            return Map.of("saved", true);
        });
    }

    @McpTool(
            name = "preview_project_invitation",
            description = "초대 링크의 프로젝트와 유효성을 조회한다.",
            annotations = @McpAnnotations(readOnlyHint = true, destructiveHint = false, openWorldHint = false))
    public CallToolResult previewProjectInvitation(
            McpTransportContext context,
            @McpToolParam(description = "invitationToken", required = true) String invitationToken) {
        return results.call(() -> {
            return members.preview(invitationToken);
        });
    }

    @McpTool(
            name = "accept_project_invitation",
            description = "인증된 사용자 계정으로 초대를 수락한다.",
            annotations = @McpAnnotations(readOnlyHint = false, destructiveHint = false, openWorldHint = false))
    public CallToolResult acceptProjectInvitation(
            McpTransportContext context,
            @McpToolParam(description = "invitationToken", required = true) String invitationToken) {
        return results.call(() -> {
            return members.accept(results.userId(context), invitationToken);
        });
    }
}
