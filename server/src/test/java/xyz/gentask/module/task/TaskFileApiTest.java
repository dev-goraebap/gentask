package xyz.gentask.module.task;

import static java.util.Objects.requireNonNull;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
import xyz.gentask.FakeStorageConfiguration;
import xyz.gentask.FakeStorageConfiguration.FakeObjectStorage;
import xyz.gentask.TestcontainersConfiguration;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, FakeMailConfiguration.class, FakeStorageConfiguration.class})
@Transactional
class TaskFileApiTest {

    private static final long TEN_MEGABYTES = 10L * 1024 * 1024;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingMailSender mail;

    @Autowired
    private FakeObjectStorage fakeStorage;

    private Cookie session;
    private String taskId;

    @BeforeEach
    void 로그인하고_작업을_만든다() throws Exception {
        session = AuthTestSupport.가입한다(mockMvc, mail, "files-" + UUID.randomUUID() + "@example.com");
        String location = requireNonNull(mockMvc.perform(post("/api/v1/tasks")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"자료 모으기\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andReturn()
                .getResponse()
                .getHeader("Location"));
        taskId = location.substring(location.lastIndexOf("/") + 1);
    }

    @Test
    @DisplayName("파일 첨부 완료 시 파일명, 크기, 다운로드 URL을 응답에 포함한다")
    void 붙이면_목록에_이름과_크기와_받을_주소가_있다() throws Exception {
        String objectKey = 파일을_붙인다("자료.pdf", "application/pdf", 2048);

        mockMvc.perform(get("/api/v1/tasks/{taskId}/files", taskId).cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fileName").value("자료.pdf"))
                .andExpect(jsonPath("$[0].size").value(2048))
                .andExpect(jsonPath("$[0].url").isNotEmpty());

        Assertions.assertThat(fakeStorage.contains(objectKey)).isTrue();
    }

    @Test
    @DisplayName("최대 첨부 가능 개수(5개)를 초과하면 첨부를 거부한다")
    void 여섯_번째_파일은_붙지_못한다() throws Exception {
        for (int index = 0; index < 5; index++) {
            파일을_붙인다("파일" + index + ".txt", "text/plain", 10);
        }

        // 사전 URL 발급 시점에는 대상 작업이 지정되지 않으므로, 첨부 개수 제한 검증은 첨부 확정 시점에 수행한다.
        String objectKey = 자리를_받는다("여섯.txt", "text/plain", 10);
        fakeStorage.put(objectKey, 10);

        mockMvc.perform(post("/api/v1/tasks/{taskId}/files", taskId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"objectKey\":\"" + objectKey
                                + "\",\"fileName\":\"여섯.txt\",\"contentType\":\"text/plain\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FILE_LIMIT_EXCEEDED"));
    }

    @Test
    @DisplayName("10MB를 초과하는 파일은 사전 업로드 URL 발급을 거부한다")
    void 십MB_를_넘는_파일은_자리를_받지_못한다() throws Exception {
        mockMvc.perform(post("/api/v1/attachments/presign")
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slot\":\"TASK_FILES\",\"fileName\":\"큰것.zip\","
                                + "\"contentType\":\"application/zip\",\"size\":" + (TEN_MEGABYTES + 1) + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FILE_TOO_LARGE"));
    }

    @Test
    @DisplayName("클라이언트 전달 크기가 아닌 스토리지 실측 크기로 최대 용량을 검증한다")
    void 말한_크기가_아니라_보관소의_실측이_강제한다() throws Exception {
        String objectKey = 자리를_받는다("속임.zip", "application/zip", 1024);
        fakeStorage.put(objectKey, TEN_MEGABYTES + 1);

        mockMvc.perform(post("/api/v1/tasks/{taskId}/files", taskId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"objectKey\":\"" + objectKey
                                + "\",\"fileName\":\"속임.zip\",\"contentType\":\"application/zip\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FILE_TOO_LARGE"));

        Assertions.assertThat(fakeStorage.contains(objectKey)).isFalse();
    }

    @Test
    @DisplayName("스토리지에 실제 업로드되지 않은 객체 키는 첨부 확정을 거부한다")
    void 올리지_않은_키는_확정되지_않는다() throws Exception {
        String objectKey = 자리를_받는다("유령.txt", "text/plain", 10);

        mockMvc.perform(post("/api/v1/tasks/{taskId}/files", taskId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"objectKey\":\"" + objectKey
                                + "\",\"fileName\":\"유령.txt\",\"contentType\":\"text/plain\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FILE_NOT_UPLOADED"));
    }

    @Test
    @DisplayName("타 사용자의 작업에는 파일 첨부를 거부한다")
    void 남의_작업에는_파일을_붙일_수_없다() throws Exception {
        Cookie other = AuthTestSupport.가입한다(mockMvc, mail, "other-" + UUID.randomUUID() + "@example.com");

        // 사전 URL 발급은 로그인 사용자 누구나 가능하지만, 타인의 작업에 첨부 확정하는 시점에 권한을 검증한다.
        String objectKey = 자리를_받는다(other, "침입.txt", "text/plain", 10);
        fakeStorage.put(objectKey, 10);

        mockMvc.perform(post("/api/v1/tasks/{taskId}/files", taskId)
                        .cookie(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"objectKey\":\"" + objectKey
                                + "\",\"fileName\":\"침입.txt\",\"contentType\":\"text/plain\"}"))
                .andExpect(status().isNotFound());
    }

    private String 자리를_받는다(String fileName, String contentType, long size) throws Exception {
        return 자리를_받는다(session, fileName, contentType, size);
    }

    private String 자리를_받는다(Cookie who, String fileName, String contentType, long size) throws Exception {
        String body = mockMvc.perform(post("/api/v1/attachments/presign")
                        .cookie(who)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slot\":\"TASK_FILES\",\"fileName\":\"" + fileName + "\",\"contentType\":\""
                                + contentType + "\",\"size\":" + size + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(body, "$.objectKey");
    }

    private String 파일을_붙인다(String fileName, String contentType, long size) throws Exception {
        String objectKey = 자리를_받는다(fileName, contentType, size);
        fakeStorage.put(objectKey, size);
        mockMvc.perform(post("/api/v1/tasks/{taskId}/files", taskId)
                        .cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"objectKey\":\"" + objectKey + "\",\"fileName\":\"" + fileName
                                + "\",\"contentType\":\"" + contentType + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileName").value(fileName));
        return objectKey;
    }
}
