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
 * 관리자 API 경로의 ADMIN 역할 인가 인터셉터다.
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
