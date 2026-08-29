package dev.goraebap.refarch.module.user.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public final class AdminRequests {

    private AdminRequests() {}

    /**
     * 역할을 문자열로 받는다.
     *
     * <p>도메인의 열거를 그대로 쓰지 않는 것은 컨트롤러가 도메인을 참조하지 않기 때문이며, 값의 해석은
     * 서비스가 맡는다.
     */
    public record ChangeRole(
            @NotBlank @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    allowableValues = {"USER", "ADMIN"})
            String role) {}
}
