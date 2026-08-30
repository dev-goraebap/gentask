package dev.goraebap.refarch.module.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.goraebap.refarch.AuthTestSupport;
import dev.goraebap.refarch.FakeMailConfiguration;
import dev.goraebap.refarch.FakeStorageConfiguration;
import dev.goraebap.refarch.TestcontainersConfiguration;
import dev.goraebap.refarch.shared.mail.E2eMailSupport.RecordingMailSender;
import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자 경로의 접근과 사용자 목록.
 *
 * <p>첫 관리자를 설정값으로 정하므로 그 이메일을 시험이 고정하고 그것으로 가입해 관리자를 얻는다.
 */
@SpringBootTest(properties = "app.admin.email=" + AdminApiTest.ADMIN_EMAIL)
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class, FakeStorageConfiguration.class})
@Transactional
class AdminApiTest {

    static final String ADMIN_EMAIL = "admin-fixture@example.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

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
    @DisplayName("TG-008.01 #5: 관리자가 아니면 관리 경로를 거절한다")
    void 관리자가_아니면_거절한다() throws Exception {
        Cookie member = 가입한다("outsider");

        mockMvc.perform(get("/api/v1/admin/users").cookie(member)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/push/failures").cookie(member)).andExpect(status().isForbidden());
    }

    // --- 준비 --------------------------------------------------------------------------------------------------------

    private Cookie 관리자로_가입한다() throws Exception {
        return AuthTestSupport.가입한다(mockMvc, mail, ADMIN_EMAIL);
    }

    private Cookie 가입한다(String mark) throws Exception {
        return AuthTestSupport.가입한다(mockMvc, mail, mark + "-" + UUID.randomUUID() + "@example.com");
    }
}
