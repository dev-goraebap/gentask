package xyz.gentask.module.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import xyz.gentask.AuthTestSupport;
import xyz.gentask.FakeMailConfiguration;
import xyz.gentask.FakeStorageConfiguration;
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

/**
 * 관리자 API 접근 제어 및 사용자 목록 조회를 검증한다.
 *
 * 초기 관리자 계정 설정을 테스트용 이메일로 지정하고 해당 계정으로 가입하여 관리자 권한을 획득한다.
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
    @DisplayName("관리자 사용자 목록 조회 시 가입일 내림차순으로 반환한다")
    void 관리자가_목록을_열면_최근_가입_순으로_온다() throws Exception {
        Cookie admin = 관리자로_가입한다();
        가입한다("older");
        가입한다("newer");

        mockMvc.perform(get("/api/v1/admin/users").cookie(admin).param("size", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.total").isNumber())
                // 초기 관리자 계정은 최초 가입자이므로 목록 마지막에 위치한다.
                .andExpect(jsonPath("$.items[0].email").value(org.hamcrest.Matchers.containsString("newer")));
    }

    @Test
    @DisplayName("검색어 입력 시 이메일 또는 닉네임과 일치하는 사용자를 필터링한다")
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
    @DisplayName("관리자 권한이 없는 사용자의 관리자 API 접근을 거부한다")
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
