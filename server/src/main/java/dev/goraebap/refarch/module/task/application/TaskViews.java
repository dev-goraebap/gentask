package dev.goraebap.refarch.module.task.application;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public final class TaskViews {

    private TaskViews() {}

    /** 지역 시각의 형식이다. 초를 내지 않는다. 사용자가 고를 수 있는 단위가 분까지다. */
    static final String LOCAL_DATE_TIME = "yyyy-MM-dd'T'HH:mm";

    /**
     * 미리 알림은 사용자가 고른 "그 날 그 시각" 이라 시간대를 붙이지 않는다.
     *
     * 아홉 모두 required 이고 정하지 않을 수 있는 넷이 null 을 허용한다. 적지 않으면 명세가
     * 전부 선택 필드라고 말하고, 그 명세에서 생성된 클라이언트 타입은 키가 없을 수도 있다고
     * 믿는다. 실제 응답은 키를 항상 담고 값만 null 이다.
     *
     * nullable 대신 types 로 적는 이유는 OpenAPI 3.1 이 nullable 을 없애고 타입 유니온으로
     * 바꿨기 때문이다. springdoc 2.8 은 nullable 을 그 형태로 옮기지 않고 버린다.
     */
    @Schema(name = "TaskView")
    public record TaskView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            UUID id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String note,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "date")
            LocalDate dueDate,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "date-time",
                    example = "2026-08-30T09:00")
            @JsonFormat(pattern = LOCAL_DATE_TIME)
            LocalDateTime remindAt,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            boolean important,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "date")
            LocalDate myDayOn,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "date-time")
            Instant completedAt,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Instant createdAt) {}
}
