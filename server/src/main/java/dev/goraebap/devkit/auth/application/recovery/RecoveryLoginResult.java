package dev.goraebap.devkit.auth.application.recovery;

import dev.goraebap.devkit.auth.application.session.IssuedSession;
import java.util.UUID;

/**
 * 복구 로그인 결과 (AUTH-08).
 *
 * <p>{@code hasPassword}는 화면이 "비밀번호를 설정하세요" 안내를 띄울지 판단하는 근거다 —
 * 복구로 들어온 사용자는 대개 인증 수단을 잃은 상태이므로, 새 수단을 추가하도록 이끌어야 한다.
 */
public record RecoveryLoginResult(UUID userId, IssuedSession session, boolean hasPassword) {}
