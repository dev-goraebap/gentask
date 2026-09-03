package xyz.gentask.module.user;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

/**
 * 사용자 한 사람을 가리키는 최소한의 정보. 공개 언어(Published Language)이며 내부 애그리거트를 대신해
 * 모듈 밖으로 나간다.
 *
 * 역할과 가입 시각을 담지 않는다. 다른 모듈이 그것으로 무엇을 판정하게 두면 권한 규칙이 user 밖으로
 * 새기 때문이다.
 */
@Schema(name = "UserBrief")
public record UserBrief(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) UUID id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String email,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String nickname) {}
