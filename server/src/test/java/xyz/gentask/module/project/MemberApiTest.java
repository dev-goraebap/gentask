package xyz.gentask.module.project;

import static java.util.Objects.requireNonNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.AuthTestSupport;
import xyz.gentask.FakeMailConfiguration;
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class})
@Transactional
class MemberApiTest {
    @Autowired
    private MockMvc mvc;

    @Autowired
    private RecordingMailSender mail;

    @Autowired
    private org.jooq.DSLContext dsl;

    @Test
    void 초대_수락과_역할_변경_제외가_접근권한에_반영된다() throws Exception {
        Cookie owner = user();
        Cookie viewer = user();
        Cookie outsider = user();
        String project = project(owner);
        String viewerId = JsonPath.read(
                mvc.perform(get("/api/v1/me").cookie(viewer))
                        .andReturn()
                        .getResponse()
                        .getContentAsString(),
                "$.id");
        String ownerId = JsonPath.read(
                mvc.perform(get("/api/v1/me").cookie(owner))
                        .andReturn()
                        .getResponse()
                        .getContentAsString(),
                "$.id");
        String invitation = invite(owner, project, "viewer");
        String token = JsonPath.read(invitation, "$.token");
        String invitationId = JsonPath.read(invitation, "$.id");
        mvc.perform(get("/api/v1/invitations/" + token + "/preview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectName").value("협업"));
        mvc.perform(post("/api/v1/invitations/" + token + "/accept")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/projects/" + project + "/members").cookie(viewer))
                .andExpect(status().isNotFound());
        for (int i = 0; i < 2; i++)
            mvc.perform(post("/api/v1/invitations/" + token + "/accept").cookie(viewer))
                    .andExpect(status().isOk());
        mvc.perform(get("/api/v1/projects/" + project + "/members").cookie(viewer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/v1/projects").cookie(viewer))
                .andExpect(jsonPath("$[?(@.id == '" + project + "')]").isNotEmpty());
        mvc.perform(get("/api/v1/projects/" + project + "/invitations").cookie(owner))
                .andExpect(jsonPath("$[0].uses").value(1));
        mvc.perform(get("/api/v1/projects/" + project + "/invitations").cookie(viewer))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/projects/" + project + "/artifacts")
                        .cookie(viewer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"금지\",\"body\":\"본문\"}"))
                .andExpect(status().isForbidden());
        String doc = requireNonNull(mvc.perform(post("/api/v1/projects/" + project + "/artifacts")
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"공유\",\"body\":\"본문\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        mvc.perform(get(doc).cookie(viewer)).andExpect(status().isOk());
        mvc.perform(get(doc).cookie(outsider)).andExpect(status().isNotFound());
        mvc.perform(patch("/api/v1/projects/" + project + "/members/" + viewerId)
                        .cookie(viewer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"editor\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/projects/" + project + "/members/" + viewerId)
                        .cookie(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"editor\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/invitations/" + token + "/accept").cookie(viewer))
                .andExpect(jsonPath("$.role").value("editor"));
        mvc.perform(patch(doc)
                        .cookie(viewer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"수정\",\"body\":\"편집자 수정\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/v1/projects/" + project + "/members/" + ownerId)
                        .cookie(owner))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/projects/" + project + "/members/" + viewerId)
                        .cookie(owner))
                .andExpect(status().isNoContent());
        mvc.perform(get(doc).cookie(viewer)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/projects/" + project + "/invitations/" + invitationId)
                        .cookie(owner))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/invitations/" + token + "/accept").cookie(viewer))
                .andExpect(status().isGone());
    }

    @Test
    void 만료된_초대와_다른_프로젝트의_관리요청은_차단한다() throws Exception {
        Cookie owner = user();
        Cookie other = user();
        String first = project(owner);
        String second = project(other);
        String invitation = invite(owner, first, "editor");
        String token = JsonPath.read(invitation, "$.token");
        String id = JsonPath.read(invitation, "$.id");
        mvc.perform(delete("/api/v1/projects/" + first + "/invitations/" + id).cookie(other))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/projects/" + second + "/invitations/" + id).cookie(other))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/invitations/" + token + "/preview")).andExpect(status().isOk());
        var invites = xyz.gentask.jooq.Tables.PROJECT_INVITATIONS;
        dsl.update(invites)
                .set(invites.EXPIRES_AT, Instant.EPOCH)
                .where(invites.ID.eq(id))
                .execute();
        mvc.perform(get("/api/v1/invitations/" + token + "/preview")).andExpect(status().isGone());
        mvc.perform(post("/api/v1/invitations/" + token + "/accept").cookie(other))
                .andExpect(status().isGone());
    }

    private Cookie user() throws Exception {
        return AuthTestSupport.가입한다(mvc, mail, "member-" + UUID.randomUUID() + "@example.com");
    }

    private String project(Cookie cookie) throws Exception {
        String url = requireNonNull(mvc.perform(post("/api/v1/projects")
                        .cookie(cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"협업\",\"key\":\"TEAM\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        return url.substring(url.lastIndexOf('/') + 1);
    }

    private String invite(Cookie cookie, String project, String role) throws Exception {
        return mvc.perform(post("/api/v1/projects/" + project + "/invitations")
                        .cookie(cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"label\":\"팀 초대\",\"role\":\"" + role + "\",\"days\":7}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }
}
