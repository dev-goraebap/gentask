package dev.goraebap.refarch.module.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.goraebap.refarch.AuthTestSupport;
import dev.goraebap.refarch.FakeStorageConfiguration;
import dev.goraebap.refarch.TestcontainersConfiguration;
import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자 경로의 접근과 권한 변경.
 *
 * <p>첫 관리자를 설정값으로 정하므로 그 이메일을 시험이 고정하고 그것으로 가입해 관리자를 얻는다.
 */
@SpringBootTest(properties = "app.admin.email=" + AdminApiTest.ADMIN_EMAIL)
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeStorageConfiguration.class})
@Transactional
class AdminApiTest {

    static final String ADMIN_EMAIL = "admin-fixture@example.com";

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("TG-008.01 #1: 관리자가 목록을 열면 가입한 사용자가 최근 가입 순으로 온다")
    void 관리자가_목록을_열면_최근_가입_순으로_온다() throws Exception {
        Cookie admin = 관리자로_가입한다();
        가입한다("older");
        가입한다("newer");

        mockMvc.perform(get("/api/v1/admin/users").cookie(admin).param("size", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.total").isNumber())
                // 관리자 자신이 가장 먼저 가입했으므로 목록의 끝쪽에 있다
                .andExpect(jsonPath("$.items[0].email").value(org.hamcrest.Matchers.containsString("newer")));
    }

    @Test
    @DisplayName("TG-008.01 #2: 검색어를 넣으면 이메일과 별명에서 찾아 추린다")
    void 검색어를_넣으면_추린다() throws Exception {
        Cookie admin = 관리자로_가입한다();
        String unique = "needle" + UUID.randomUUID().toString().substring(0, 8);
        가입한다(unique);
        가입한다("haystack");

        mockMvc.perform(get("/api/v1/admin/users").cookie(admin).param("keyword", unique))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].email").value(org.hamcrest.Matchers.containsString(unique)));
    }

    @Test
    @DisplayName("TG-008.01 #3: 관리자로 올리면 그 사용자가 관리 경로에 들어간다")
    void 관리자로_올리면_관리_경로에_들어간다() throws Exception {
        Cookie admin = 관리자로_가입한다();
        Cookie member = 가입한다("promotable");
        mockMvc.perform(get("/api/v1/admin/users").cookie(member)).andExpect(status().isForbidden());

        String userId = 아이디를_찾는다(admin, "promotable");
        역할을_바꾼다(admin, userId, "ADMIN").andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/admin/users").cookie(member)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("TG-008.01 #4: 자기 자신의 권한을 내리려 하면 막는다")
    void 자기_자신의_권한은_내리지_못한다() throws Exception {
        Cookie admin = 관리자로_가입한다();
        String myId = 아이디를_찾는다(admin, "admin-fixture");

        역할을_바꾼다(admin, myId, "USER").andExpect(status().isConflict());

        mockMvc.perform(get("/api/v1/admin/users").cookie(admin)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("TG-008.01 #5: 관리자가 아니면 관리 경로를 거절한다")
    void 관리자가_아니면_거절한다() throws Exception {
        Cookie member = 가입한다("outsider");

        mockMvc.perform(get("/api/v1/admin/users").cookie(member)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/push/failures").cookie(member)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("[서버] 알 수 없는 역할을 보내면 거절한다")
    void 알_수_없는_역할은_거절한다() throws Exception {
        Cookie admin = 관리자로_가입한다();
        String userId = 아이디를_찾는다(admin, "victim");

        역할을_바꾼다(admin, userId, "SUPERUSER").andExpect(status().isBadRequest());
    }

    // --- 준비 --------------------------------------------------------------------------------------------------------

    private Cookie 관리자로_가입한다() throws Exception {
        return AuthTestSupport.가입한다(mockMvc, ADMIN_EMAIL);
    }

    private Cookie 가입한다(String mark) throws Exception {
        return AuthTestSupport.가입한다(mockMvc, mark + "-" + UUID.randomUUID() + "@example.com");
    }

    private ResultActions 역할을_바꾼다(Cookie session, String userId, String role) throws Exception {
        return mockMvc.perform(patch("/api/v1/admin/users/" + userId + "/role")
                .cookie(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"" + role + "\"}"));
    }

    /** 검색으로 한 사람을 찾아 그 식별자를 낸다. 없으면 새로 가입시켜 다시 찾는다. */
    private String 아이디를_찾는다(Cookie admin, String mark) throws Exception {
        String body = mockMvc.perform(get("/api/v1/admin/users").cookie(admin).param("keyword", mark))
                .andReturn()
                .getResponse()
                .getContentAsString();
        if (!body.contains("\"items\":[]")) {
            return 첫_아이디(body);
        }
        가입한다(mark);
        return 첫_아이디(mockMvc.perform(get("/api/v1/admin/users").cookie(admin).param("keyword", mark))
                .andReturn()
                .getResponse()
                .getContentAsString());
    }

    private static String 첫_아이디(String body) {
        int at = body.indexOf("\"id\":\"") + "\"id\":\"".length();
        return body.substring(at, body.indexOf('"', at));
    }
}
