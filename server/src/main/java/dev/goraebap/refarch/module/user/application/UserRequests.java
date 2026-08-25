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

    public static final int PASSWORD_MIN = 8;

    public static final int PASSWORD_MAX = 72;

    public record Signup(
            @NotBlank(message = Email.REQUIRED) @Size(max = Email.MAX) String email,

            @NotBlank(message = "비밀번호를 입력해 주세요") @Size(min = PASSWORD_MIN, max = PASSWORD_MAX, message = "비밀번호는 8자 이상 72자 이하입니다") String password,

            @Schema(types = {"string", "null"}) @Size(max = Nickname.MAX) String nickname) {}

    public record Login(
            @NotBlank(message = Email.REQUIRED) @Size(max = Email.MAX) String email,

            @NotBlank(message = "비밀번호를 입력해 주세요") @Size(max = PASSWORD_MAX) String password) {}

    public record ChangeNickname(
            @NotBlank(message = Nickname.REQUIRED) @Size(max = Nickname.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String nickname) {}

    public record PresignProfileImage(
            @NotBlank @Size(max = 255) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String fileName,

            @NotBlank @Size(max = 100) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String contentType,

            @NotNull @Positive @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Long size) {}

    public record ConfirmProfileImage(
            @NotBlank @Size(max = 400) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String objectKey) {}
}
