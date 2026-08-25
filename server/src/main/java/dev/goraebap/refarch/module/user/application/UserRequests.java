package dev.goraebap.refarch.module.user.application;

import dev.goraebap.refarch.module.user.domain.Email;
import dev.goraebap.refarch.module.user.domain.user.Nickname;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public final class UserRequests {

    private UserRequests() {}

    /** 비밀번호 상한이 72 인 이유는 bcrypt 가 그 이상을 무시하기 때문이다. 조용히 자르지 않고 거부한다. */
    public static final int PASSWORD_MIN = 8;

    public static final int PASSWORD_MAX = 72;

    /** TK-005 A1. 별명을 적지 않으면 이메일 앞부분이 된다. */
    public record Signup(
            @NotBlank(message = Email.REQUIRED) @Size(max = Email.MAX) String email,

            @NotBlank(message = "비밀번호를 입력해 주세요") @Size(min = PASSWORD_MIN, max = PASSWORD_MAX, message = "비밀번호는 8자 이상 72자 이하입니다") String password,

            @Schema(types = {"string", "null"}) @Size(max = Nickname.MAX) String nickname) {}

    /** TK-005 기본 흐름. */
    public record Login(
            @NotBlank(message = Email.REQUIRED) @Size(max = Email.MAX) String email,

            @NotBlank(message = "비밀번호를 입력해 주세요") @Size(max = PASSWORD_MAX) String password) {}

    /** TK-006 기본 흐름. */
    public record ChangeNickname(
            @NotBlank(message = Nickname.REQUIRED) @Size(max = Nickname.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String nickname) {}

    /** TK-006 A1. 크기를 미리 받아 올리기 전에 거절한다. 강제는 확정 시점의 실측이 한다. */
    public record PresignProfileImage(
            @NotBlank @Size(max = 255) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String fileName,

            @NotBlank @Size(max = 100) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String contentType,

            @NotNull @Positive @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Long size) {}

    /** TK-006 A1. presign 이 준 키를 그대로 돌려보낸다. */
    public record ConfirmProfileImage(
            @NotBlank @Size(max = 400) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String objectKey) {}
}
