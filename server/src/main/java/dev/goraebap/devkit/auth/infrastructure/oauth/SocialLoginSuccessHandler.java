package dev.goraebap.devkit.auth.infrastructure.oauth;

import dev.goraebap.devkit.auth.application.session.IssuedSession;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.application.shared.SessionCookieFactory;
import dev.goraebap.devkit.auth.application.sociallogin.SocialIdentity;
import dev.goraebap.devkit.auth.application.sociallogin.SocialLoginOutcome;
import dev.goraebap.devkit.auth.application.sociallogin.SocialLoginService;
import dev.goraebap.devkit.auth.application.sociallogin.SocialTicketCookieFactory;
import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

/**
 * 제공자 인증이 끝난 직후 (AUTH-02·03).
 *
 * <p>Spring Security가 인가 코드 교환과 사용자 정보 조회까지 마친 상태로 여기 도착한다. 우리는
 * <b>제공자 신원만 꺼내</b> 서비스에 넘기고, 결과에 따라 프론트로 되돌려보낸다.
 *
 * <p>제공자가 준 프로필에서 <b>이메일을 읽지 않는다</b> — 읽지 않는 것이 결정-0015의 요구다.
 * 신원 식별자만 쓴다.
 *
 * <p>리다이렉트로 돌려보내는 이유: 이 지점은 브라우저가 제공자에서 넘어오는 <b>탐색(navigation)</b>
 * 이라 JSON을 돌려줄 수 없다. 화면이 이어서 처리하도록 프론트 경로로 보낸다.
 *
 * <p><b>중간 표는 리다이렉트 URL이 아니라 쿠키로 실어 보낸다</b>(보안 검토 F1). 쿼리스트링에 실으면
 * 액세스 로그와 {@code Location} 헤더에 표가 남고, 그것을 주운 사람이 자기 이메일로 소유 증명을
 * 통과해 남의 제공자 신원을 선점할 수 있다 — 자세한 이유는 {@link SocialTicketCookieFactory}.
 */
@Slf4j
@RequiredArgsConstructor
public class SocialLoginSuccessHandler implements AuthenticationSuccessHandler {

    private final SocialLoginService socialLoginService;
    private final SessionCookieFactory cookieFactory;
    private final SocialTicketCookieFactory ticketCookieFactory;
    private final String redirectBase;
    private final Clock clock;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {
        if (!(authentication instanceof OAuth2AuthenticationToken token)) {
            response.sendRedirect(redirectBase + "/auth/error?reason=unsupported");
            return;
        }

        // 파생 프로젝트가 제공자 등록만 추가하고 enum 상수를 빠뜨리면 여기서 던진다. 이 지점은
        // @RestControllerAdvice 밖(서블릿 필터)이라 그대로 두면 컨테이너 기본 에러 페이지가 나온다 (F7)
        AuthProvider provider;
        try {
            provider = AuthProvider.fromValue(token.getAuthorizedClientRegistrationId());
        } catch (IllegalArgumentException e) {
            log.warn("등록되지 않은 제공자로 인증이 들어왔다 (registrationId={})", token.getAuthorizedClientRegistrationId());
            response.sendRedirect(redirectBase + "/auth/error?reason=unsupported");
            return;
        }

        OAuth2User principal = token.getPrincipal();
        if (principal == null || principal.getName() == null) {
            // 제공자가 신원 식별자를 주지 않았다 — 이 신원으로는 계정을 만들 수 없다
            log.warn("제공자 응답에 신원 식별자가 없다 (provider={})", provider.value());
            response.sendRedirect(redirectBase + "/auth/error");
            return;
        }
        SocialIdentity identity = new SocialIdentity(provider, principal.getName());

        SocialLoginOutcome outcome = socialLoginService.onProviderAuthenticated(
                identity, ClientInfo.of(request.getRemoteAddr(), request.getHeader("User-Agent")));

        IssuedSession session = outcome.session();
        if (outcome.status() == SocialLoginOutcome.Status.SIGNED_IN && session != null) {
            // 이미 아는 신원 — 세션 쿠키를 심고 돌려보낸다.
            // 여기 오는 세션은 방금 발급된 것이라 토큰이 반드시 있다. 토큰을 뺀 사본(withoutToken)은
            // 응답 본문용이며 이 경로로 오지 않는다 — 그래도 도달하면 그것이 곧 결함이므로 세운다.
            String sessionToken = Objects.requireNonNull(session.token(), "발급된 세션에는 토큰이 있어야 한다");
            response.addHeader(
                    HttpHeaders.SET_COOKIE,
                    cookieFactory
                            .issue(sessionToken, session.expiresAt(), clock.instant())
                            .toString());
            response.sendRedirect(redirectBase + "/auth/complete");
            return;
        }

        // 처음 보는 신원 — 이메일을 물어야 한다. 표는 쿠키로 심고 URL에는 남기지 않는다 (F1)
        String ticket = socialLoginService.issueTicket(identity);
        response.addHeader(
                HttpHeaders.SET_COOKIE, ticketCookieFactory.issue(ticket).toString());
        response.sendRedirect(redirectBase + "/auth/social/email");
    }
}
