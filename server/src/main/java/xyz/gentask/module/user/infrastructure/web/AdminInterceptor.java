package xyz.gentask.module.user.infrastructure.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import xyz.gentask.module.user.application.UserErrorCode;
import xyz.gentask.module.user.domain.user.User;
import xyz.gentask.module.user.domain.user.UserRepository;
import xyz.gentask.shared.web.CurrentUser;

/**
 * 관리자 경로의 문지기.
 *
 * <p>AuthInterceptor 가 먼저 신원을 세우고 이 자리가 역할을 본다. 둘을 하나로 합치지 않는 것은
 * 인증과 인가가 다른 이유로 실패하고 다른 응답을 내야 하기 때문이다 — 로그인하지 않은 것은 401 이고
 * 권한이 없는 것은 403 이다.
 *
 * <p>역할을 세션에 담지 않고 매번 읽는다. 관리자 경로는 호출이 드물고, 담아 두면 권한을 내린 뒤에도
 * 그 세션이 살아 있는 동안 들어올 수 있다.
 */
@Component
@RequiredArgsConstructor
public class AdminInterceptor implements HandlerInterceptor {

    private final UserRepository userRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Object userId = request.getAttribute(CurrentUser.ATTRIBUTE);
        if (!(userId instanceof UUID identifier)) {
            throw UserErrorCode.UNAUTHENTICATED.raise();
        }
        User user = userRepository.findById(identifier).orElseThrow(UserErrorCode.UNAUTHENTICATED::raise);
        if (!user.role().isAdmin()) {
            throw UserErrorCode.FORBIDDEN.raise();
        }
        return true;
    }
}
