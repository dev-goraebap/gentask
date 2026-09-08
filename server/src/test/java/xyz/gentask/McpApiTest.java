package xyz.gentask;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "app.mcp.allowed-origins=http://localhost:4401")
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class})
class McpApiTest {
    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private xyz.gentask.shared.storage.ObjectStorage storage;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

    @Autowired
    private JsonMapper mapper;

    @LocalServerPort
    private int port;

    private Cookie session;
    private String token;
    private String projectId;

    @BeforeEach
    void 준비한다() throws Exception {
        session = AuthTestSupport.가입한다(mockMvc, mail, "mcp-" + UUID.randomUUID() + "@example.com");
        token = 토큰(session);
        projectId = mapper.readTree(mockMvc.perform(get("/api/v1/projects").cookie(session))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString())
                .get(0)
                .get("id")
                .asText();
    }

    @Test
    void 초기화와_도구_목록은_세션을_발급하지_않는다() throws Exception {
        var initialized = 요청(
                token,
                "initialize",
                Map.of(
                        "protocolVersion",
                        "2025-11-25",
                        "capabilities",
                        Map.of(),
                        "clientInfo",
                        Map.of("name", "test", "version", "1")));
        assertThat(initialized.statusCode()).isEqualTo(200);
        assertThat(initialized.headers().firstValue("Mcp-Session-Id")).isEmpty();
        assertThat(initialized.headers().firstValue("Set-Cookie")).isEmpty();
        assertThat(mapper.readTree(initialized.body())
                        .path("result")
                        .path("protocolVersion")
                        .asText())
                .isEqualTo("2025-11-25");
        var response = 요청(token, "tools/list", Map.of());
        JsonNode tools = mapper.readTree(response.body()).path("result").path("tools");
        assertThat(tools.size()).isEqualTo(48);
        for (JsonNode tool : tools) {
            assertThat(tool.path("inputSchema").path("properties").has("context"))
                    .isFalse();
            assertThat(tool.path("inputSchema").path("properties").has("userId"))
                    .isFalse();
        }
    }

    @Test
    void 인증은_모든_요청에서_검사하고_쿠키로_대체하지_않는다() throws Exception {
        assertThat(요청(null, "tools/list", Map.of()).statusCode()).isEqualTo(401);
        assertThat(요청("invalid", "tools/list", Map.of()).statusCode()).isEqualTo(401);
        try (HttpClient client = HttpClient.newHttpClient()) {
            var response = client.send(
                    빌더("tools/list", Map.of())
                            .header("Cookie", session.getName() + "=" + session.getValue())
                            .build(),
                    HttpResponse.BodyHandlers.ofString());
            assertThat(response.statusCode()).isEqualTo(401);
        }
        assertThat(요청(token, "tools/list", Map.of()).statusCode()).isEqualTo(200);
        mockMvc.perform(delete("/api/v1/me/api-token").cookie(session)).andExpect(status().isNoContent());
        assertThat(요청(token, "tools/list", Map.of()).statusCode()).isEqualTo(401);
    }

    @Test
    void 허용되지_않은_오리진을_차단한다() throws Exception {
        try (HttpClient client = HttpClient.newHttpClient()) {
            for (String origin : new String[] {"https://untrusted.example", "null", "http://localhost:4401"}) {
                var response = client.send(
                        빌더("tools/list", Map.of())
                                .header("Authorization", "Bearer " + token)
                                .header("Origin", origin)
                                .build(),
                        HttpResponse.BodyHandlers.ofString());
                assertThat(response.statusCode()).isEqualTo(origin.equals("http://localhost:4401") ? 200 : 403);
            }
        }
    }

    @Test
    void 생성과_수정은_REST와_동일한_본문과_개정을_사용한다() throws Exception {
        String folderId = 데이터(호출(token, "create_artifact_folder", Map.of("projectId", projectId, "name", "발견")))
                .path("id")
                .asText();
        String artifactId = 데이터(호출(
                        token,
                        "create_artifact",
                        Map.of("projectId", projectId, "folderId", folderId, "title", "초안", "body", "# 첫 본문")))
                .path("id")
                .asText();
        var saved = 호출(
                token,
                "update_artifact",
                Map.of(
                        "projectId",
                        projectId,
                        "artifactId",
                        artifactId,
                        "title",
                        "React 지침",
                        "body",
                        "# 변경한 본문",
                        "comment",
                        "React 기준으로 수정한다"));
        assertThat(saved.path("isError").asBoolean()).isFalse();
        var detail = mapper.readTree(
                mockMvc.perform(get("/api/v1/projects/{projectId}/artifacts/{id}", projectId, artifactId)
                                .cookie(session))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString());
        assertThat(detail.path("body").asText()).isEqualTo("# 변경한 본문");
        assertThat(detail.path("versionNo").asInt()).isEqualTo(2);
        assertThat(detail.path("summary").path("folderId").asText()).isEqualTo(folderId);
        assertThat(데이터(호출(token, "get_artifact", Map.of("projectId", projectId, "artifactId", artifactId))))
                .isEqualTo(detail);
        var history =
                데이터(호출(token, "list_artifact_versions", Map.of("projectId", projectId, "artifactId", artifactId)));
        assertThat(history.path("total").asInt()).isEqualTo(2);
        assertThat(history.path("items").get(0).path("comment").asText()).isEqualTo("React 기준으로 수정한다");
        assertThat(데이터(호출(
                                token,
                                "get_artifact_version",
                                Map.of("projectId", projectId, "artifactId", artifactId, "versionNo", "1")))
                        .path("body")
                        .asText())
                .isEqualTo("# 첫 본문");
        assertThat(데이터(호출(token, "list_artifact_folders", Map.of("projectId", projectId)))
                        .size())
                .isEqualTo(1);
        assertThat(데이터(호출(token, "list_artifacts", Map.of("projectId", projectId)))
                        .size())
                .isEqualTo(1);
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(
                                "/api/v1/projects/{projectId}/artifacts/{id}/versions/2/comments",
                                projectId,
                                artifactId)
                        .cookie(session)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"body\":\"제목 검토\",\"blockStart\":0,\"blockEnd\":8}"))
                .andExpect(status().isCreated());
        var comments = 데이터(호출(
                token,
                "list_artifact_comments",
                Map.of("projectId", projectId, "artifactId", artifactId, "versionNo", 2)));
        assertThat(comments.size()).isEqualTo(1);
        assertThat(comments.get(0).path("blockSource").asText()).isEqualTo("# 변경한 본문");
        assertThat(comments.get(0).path("body").asText()).isEqualTo("제목 검토");
        assertThat(데이터(호출(
                                token,
                                "list_artifact_comments",
                                Map.of("projectId", projectId, "artifactId", artifactId, "versionNo", 1)))
                        .size())
                .isZero();
    }

    @Test
    void 타인의_프로젝트를_읽거나_수정할_수_없다() throws Exception {
        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");
        String otherToken = 토큰(other);
        String artifactId = 데이터(호출(
                        token, "create_artifact", Map.of("projectId", projectId, "title", "원본", "body", "원본")))
                .path("id")
                .asText();
        for (String name : new String[] {
            "list_artifacts",
            "get_artifact",
            "list_artifact_folders",
            "create_artifact_folder",
            "create_artifact",
            "update_artifact",
            "list_artifact_versions",
            "get_artifact_version"
        }) {
            var result = 호출(
                    otherToken,
                    name,
                    Map.of(
                            "projectId",
                            projectId,
                            "artifactId",
                            artifactId,
                            "title",
                            "침범",
                            "body",
                            "침범",
                            "name",
                            "침범",
                            "versionNo",
                            "1"));
            assertThat(result.path("isError").asBoolean()).as(name).isTrue();
            assertThat(내용(result).path("code").asText()).isEqualTo("PROJECT_NOT_FOUND");
        }
        assertThat(데이터(호출(token, "get_artifact", Map.of("projectId", projectId, "artifactId", artifactId)))
                        .path("body")
                        .asText())
                .isEqualTo("원본");
    }

    @Test
    void 병렬_요청에서_사용자_컨텍스트가_섞이지_않는다() throws Exception {
        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "parallel-" + UUID.randomUUID() + "@example.com");
        String otherToken = 토큰(other);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var mine = executor.submit(() -> 데이터(호출(token, "list_projects", Map.of())));
            var theirs = executor.submit(() -> 데이터(호출(otherToken, "list_projects", Map.of())));
            assertThat(mine.get().get(0).path("id").asText()).isEqualTo(projectId);
            assertThat(theirs.get().get(0).path("id").asText()).isNotEqualTo(projectId);
        }
    }

    @Test
    void 잘못된_입력은_도구_실패로_반환하고_저장하지_않는다() throws Exception {
        var result = 호출(token, "create_artifact", Map.of("projectId", projectId, "title", " ", "body", "본문"));
        assertThat(result.path("isError").asBoolean()).isTrue();
        assertThat(내용(result).path("code").asText()).isEqualTo("COMMON_INVALID_REQUEST");
        assertThat(데이터(호출(token, "list_artifacts", Map.of("projectId", projectId)))
                        .isEmpty())
                .isTrue();
    }

    @Test
    void 개인_아티팩트와_작업을_연결하고_다른_계정은_접근하지_못한다() throws Exception {
        String folder = 데이터(호출(token, "create_artifact_folder", Map.of("name", "개인")))
                .path("id")
                .asText();
        String artifact = 데이터(호출(token, "create_artifact", Map.of("title", "문서", "body", "본문", "folderId", folder)))
                .path("id")
                .asText();
        String task = 데이터(호출(token, "create_task", Map.of("title", "개인 작업")))
                .path("id")
                .asText();
        데이터(호출(token, "link_task_artifact", Map.of("taskId", task, "artifactId", artifact)));
        assertThat(데이터(호출(token, "list_task_artifacts", Map.of("taskId", task))).size())
                .isEqualTo(1);
        데이터(호출(token, "update_task", Map.of("taskId", task, "title", "변경", "note", "설명", "dueDate", "2026-10-01")));
        데이터(호출(token, "change_task_state", Map.of("taskId", task, "state", "IN_PROGRESS")));
        assertThat(데이터(호출(token, "get_task", Map.of("taskId", task)))
                        .path("state")
                        .asText())
                .isEqualTo("IN_PROGRESS");
        데이터(호출(token, "set_task_importance", Map.of("taskId", task, "important", true)));
        데이터(호출(token, "set_task_my_day", Map.of("taskId", task, "inMyDay", true)));
        var other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");
        String otherToken = 토큰(other);
        assertThat(호출(otherToken, "get_task", Map.of("taskId", task))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(호출(otherToken, "get_artifact", Map.of("artifactId", artifact))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(호출(token, "get_artifact", Map.of("projectId", projectId, "artifactId", artifact))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        데이터(호출(token, "rename_artifact_folder", Map.of("folderId", folder, "name", "이름 변경")));
        데이터(호출(token, "delete_artifact_folder", Map.of("folderId", folder)));
        assertThat(데이터(호출(token, "get_artifact", Map.of("artifactId", artifact)))
                        .path("summary")
                        .path("folderId")
                        .isNull())
                .isTrue();
        데이터(호출(token, "unlink_task_artifact", Map.of("taskId", task, "artifactId", artifact)));
        데이터(호출(token, "delete_task", Map.of("taskId", task)));
        assertThat(호출(token, "get_task", Map.of("taskId", task)).path("isError").asBoolean())
                .isTrue();
    }

    @Test
    void 코멘트_삭제는_작성자만_가능하고_복원은_새_버전을_만든다() throws Exception {
        String artifact = 데이터(호출(token, "create_artifact", Map.of("projectId", projectId, "title", "문서", "body", "본문")))
                .path("id")
                .asText();
        String comment = 데이터(호출(
                        token,
                        "create_artifact_comment",
                        Map.of(
                                "projectId",
                                projectId,
                                "artifactId",
                                artifact,
                                "versionNo",
                                1,
                                "body",
                                "의견",
                                "blockStart",
                                0,
                                "blockEnd",
                                2)))
                .path("id")
                .asText();
        var other = AuthTestSupport.가입한다(mockMvc, mail, "editor-" + UUID.randomUUID() + "@example.com");
        String otherToken = 토큰(other);
        String invitation = 데이터(호출(
                        token,
                        "create_project_invitation",
                        Map.of("projectId", projectId, "label", "편집자", "role", "editor", "days", 1)))
                .path("token")
                .asText();
        데이터(호출(otherToken, "accept_project_invitation", Map.of("invitationToken", invitation)));
        assertThat(호출(
                                otherToken,
                                "delete_artifact_comment",
                                Map.of(
                                        "projectId",
                                        projectId,
                                        "artifactId",
                                        artifact,
                                        "versionNo",
                                        1,
                                        "commentId",
                                        comment))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        데이터(호출(
                token,
                "delete_artifact_comment",
                Map.of("projectId", projectId, "artifactId", artifact, "versionNo", 1, "commentId", comment)));
        데이터(호출(
                token,
                "update_artifact",
                Map.of("projectId", projectId, "artifactId", artifact, "title", "변경", "body", "새 본문")));
        데이터(호출(
                token,
                "revert_artifact_version",
                Map.of("projectId", projectId, "artifactId", artifact, "versionNo", "1")));
        assertThat(데이터(호출(token, "get_artifact", Map.of("projectId", projectId, "artifactId", artifact)))
                        .path("body")
                        .asText())
                .isEqualTo("본문");
        assertThat(데이터(호출(
                                token,
                                "get_artifact_version",
                                Map.of("projectId", projectId, "artifactId", artifact, "versionNo", "3")))
                        .path("body")
                        .asText())
                .isEqualTo("본문");
    }

    @Test
    void 초대와_멤버_권한을_작업에도_적용한다() throws Exception {
        String project = 데이터(호출(token, "create_project", Map.of("name", "MCP 프로젝트", "key", "MCP")))
                .path("id")
                .asText();
        데이터(호출(token, "update_project", Map.of("projectId", project, "name", "변경된 프로젝트")));
        assertThat(데이터(호출(token, "get_project", Map.of("projectId", project)))
                        .path("name")
                        .asText())
                .isEqualTo("변경된 프로젝트");
        var invite = 데이터(호출(
                token,
                "create_project_invitation",
                Map.of("projectId", project, "label", "뷰어", "role", "viewer", "days", 1)));
        String invitation = invite.path("token").asText();
        데이터(호출(token, "preview_project_invitation", Map.of("invitationToken", invitation)));
        var other = AuthTestSupport.가입한다(mockMvc, mail, "viewer-" + UUID.randomUUID() + "@example.com");
        String otherToken = 토큰(other);
        데이터(호출(otherToken, "accept_project_invitation", Map.of("invitationToken", invitation)));
        String member =
                데이터(호출(otherToken, "get_my_profile", Map.of())).path("id").asText();
        assertThat(호출(otherToken, "create_task", Map.of("projectId", project, "title", "거절"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(호출(
                                otherToken,
                                "create_project_invitation",
                                Map.of("projectId", project, "label", "거절", "role", "editor", "days", 1))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        데이터(호출(
                token,
                "change_project_member_role",
                Map.of("projectId", project, "memberId", member, "role", "editor")));
        String task = 데이터(호출(otherToken, "create_task", Map.of("projectId", project, "title", "허용")))
                .path("id")
                .asText();
        데이터(호출(token, "assign_task", Map.of("taskId", task, "assigneeId", member)));
        assertThat(데이터(호출(otherToken, "list_tasks", Map.of())).toString()).contains(task);
        데이터(호출(
                token,
                "revoke_project_invitation",
                Map.of("projectId", project, "invitationId", invite.path("id").asText())));
        assertThat(호출(token, "preview_project_invitation", Map.of("invitationToken", invitation))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        데이터(호출(token, "remove_project_member", Map.of("projectId", project, "memberId", member)));
        assertThat(호출(otherToken, "get_task", Map.of("taskId", task))
                        .path("isError")
                        .asBoolean())
                .isTrue();
    }

    @Test
    void 잘못된_작업_날짜와_파일_메타데이터를_거절한다() throws Exception {
        assertThat(호출(token, "create_task", Map.of("title", "작업", "dueDate", "wrong"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(호출(
                                token,
                                "prepare_file_upload",
                                Map.of(
                                        "slot",
                                        "TASK_FILES",
                                        "fileName",
                                        "file.txt",
                                        "contentType",
                                        "text/plain",
                                        "size",
                                        -1))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        String task =
                데이터(호출(token, "create_task", Map.of("title", "작업"))).path("id").asText();
        assertThat(호출(token, "change_task_state", Map.of("taskId", task, "state", "INVALID"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(호출(
                                token,
                                "attach_task_file",
                                Map.of(
                                        "taskId",
                                        task,
                                        "objectKey",
                                        "foreign/file",
                                        "fileName",
                                        "file.txt",
                                        "contentType",
                                        "text/plain"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        assertThat(데이터(호출(token, "list_task_files", Map.of("taskId", task))).isEmpty())
                .isTrue();
    }

    @Test
    void 발급한_파일만_첨부하고_삭제하면_목록에서_제외한다() throws Exception {
        org.mockito.Mockito.when(storage.presignPut(
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.any()))
                .thenReturn("https://storage.example/upload");
        org.mockito.Mockito.when(storage.presignGet(
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.any()))
                .thenReturn("https://storage.example/download");
        org.mockito.Mockito.when(storage.sizeOf(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(java.util.Optional.of(12L));
        String task = 데이터(호출(token, "create_task", Map.of("title", "첨부 확인")))
                .path("id")
                .asText();
        String key = 데이터(호출(
                        token,
                        "prepare_file_upload",
                        Map.of("slot", "TASK_FILES", "fileName", "file.txt", "contentType", "text/plain", "size", 12)))
                .path("objectKey")
                .asText();
        var other = AuthTestSupport.가입한다(mockMvc, mail, "upload-" + UUID.randomUUID() + "@example.com");
        String otherToken = 토큰(other);
        String otherTask = 데이터(호출(otherToken, "create_task", Map.of("title", "다른 계정")))
                .path("id")
                .asText();
        assertThat(호출(
                                otherToken,
                                "attach_task_file",
                                Map.of(
                                        "taskId",
                                        otherTask,
                                        "objectKey",
                                        key,
                                        "fileName",
                                        "file.txt",
                                        "contentType",
                                        "text/plain"))
                        .path("isError")
                        .asBoolean())
                .isTrue();
        String file = 데이터(호출(
                        token,
                        "attach_task_file",
                        Map.of("taskId", task, "objectKey", key, "fileName", "file.txt", "contentType", "text/plain")))
                .path("id")
                .asText();
        assertThat(데이터(호출(token, "list_task_files", Map.of("taskId", task))).size())
                .isEqualTo(1);
        데이터(호출(token, "delete_task_file", Map.of("taskId", task, "taskFileId", file)));
        assertThat(데이터(호출(token, "list_task_files", Map.of("taskId", task))).isEmpty())
                .isTrue();
        데이터(호출(token, "update_my_nickname", Map.of("nickname", "새 닉네임")));
        assertThat(데이터(호출(token, "get_my_profile", Map.of())).path("nickname").asText())
                .isEqualTo("새 닉네임");
        String image = 데이터(호출(
                        token,
                        "prepare_file_upload",
                        Map.of(
                                "slot",
                                "USER_PROFILE_IMAGE",
                                "fileName",
                                "avatar.png",
                                "contentType",
                                "image/png",
                                "size",
                                12)))
                .path("objectKey")
                .asText();
        데이터(호출(token, "set_profile_image", Map.of("objectKey", image)));
        데이터(호출(token, "delete_profile_image", Map.of()));
        assertThat(데이터(호출(token, "get_my_profile", Map.of()))
                        .path("profileImageUrl")
                        .isNull())
                .isTrue();
    }

    private String 토큰(Cookie cookie) throws Exception {
        return mapper.readTree(mockMvc.perform(post("/api/v1/me/api-token").cookie(cookie))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString())
                .get("token")
                .asText();
    }

    private HttpRequest.Builder 빌더(String method, Map<String, ?> params) {
        return HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/mcp"))
                .timeout(Duration.ofSeconds(15))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json, text/event-stream")
                .header("MCP-Protocol-Version", "2025-11-25")
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(Map.of(
                        "jsonrpc", "2.0", "id", UUID.randomUUID().toString(), "method", method, "params", params))));
    }

    private HttpResponse<String> 요청(String credential, String method, Map<String, ?> params) throws Exception {
        var request = 빌더(method, params);
        if (credential != null) request.header("Authorization", "Bearer " + credential);
        try (HttpClient client = HttpClient.newHttpClient()) {
            return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
        }
    }

    private JsonNode 호출(String credential, String name, Map<String, ?> arguments) throws Exception {
        var response = 요청(credential, "tools/call", Map.of("name", name, "arguments", arguments));
        assertThat(response.statusCode()).isEqualTo(200);
        var body = mapper.readTree(response.body());
        assertThat(body.has("error")).as(response.body()).isFalse();
        return body.path("result");
    }

    private JsonNode 내용(JsonNode result) {
        return mapper.readTree(result.path("content").get(0).path("text").asText());
    }

    private JsonNode 데이터(JsonNode result) {
        assertThat(result.path("isError").asBoolean()).as(result.toString()).isFalse();
        return 내용(result).path("data");
    }
}
