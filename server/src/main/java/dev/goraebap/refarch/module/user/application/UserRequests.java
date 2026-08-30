package dev.goraebap.refarch.module.user.application;

import dev.goraebap.refarch.module.user.domain.Email;
import dev.goraebap.refarch.module.user.domain.Password;
import dev.goraebap.refarch.module.user.domain.user.Nickname;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class UserRequests {

    private UserRequests() {}

    public static final int PASSWORD_MIN = Password.MIN;

    public static final int PASSWORD_MAX = Password.MAX;

    /** 코드의 자릿수는 설정이 갖는다. 여기서는 길이만 막고 판정은 해시 대조가 한다. */
    private static final int CODE_MAX = 16;

    private static final String CODE_REQUIRED = "코드를 입력해 주세요";

    public record Signup(
            @NotBlank(message = Email.REQUIRED) @Size(max = Email.MAX) String email,

            @NotBlank(message = Password.REQUIRED) @Size(min = PASSWORD_MIN, max = PASSWORD_MAX, message = Password.LENGTH) String password,

            @Schema(types = {"string", "null"}) @Size(max = Nickname.MAX) String nickname) {}

    public record ConfirmSignup(
            @NotBlank(message = Email.REQUIRED) @Size(max = Email.MAX) String email,

            @NotBlank(message = CODE_REQUIRED) @Size(max = CODE_MAX) String code) {}

    public record ResendCode(
            @NotBlank(message = Email.REQUIRED) @Size(max = Email.MAX) String email) {}

    public record RequestPasswordReset(
            @NotBlank(message = Email.REQUIRED) @Size(max = Email.MAX) String email) {}

    public record ConfirmPasswordReset(
            @NotBlank(message = Email.REQUIRED) @Size(max = Email.MAX) String email,

            @NotBlank(message = CODE_REQUIRED) @Size(max = CODE_MAX) String code,

            @NotBlank(message = Password.REQUIRED) @Size(min = PASSWORD_MIN, max = PASSWORD_MAX, message = Password.LENGTH) String newPassword) {}

    public record ChangePassword(
            @NotBlank(message = Password.REQUIRED) @Size(max = PASSWORD_MAX) String currentPassword,

            @NotBlank(message = Password.REQUIRED) @Size(min = PASSWORD_MIN, max = PASSWORD_MAX, message = Password.LENGTH) String newPassword) {}

    public record Login(
            @NotBlank(message = Email.REQUIRED) @Size(max = Email.MAX) String email,

            @NotBlank(message = Password.REQUIRED) @Size(max = PASSWORD_MAX) String password) {}

    public record ChangeNickname(
            @NotBlank(message = Nickname.REQUIRED) @Size(max = Nickname.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String nickname) {}

    public record ConfirmProfileImage(
            @NotBlank @Size(max = 400) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String objectKey) {}
}
