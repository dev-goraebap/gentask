package dev.goraebap.devkit.auth.application.session;

import java.time.Instant;
import java.util.UUID;

/**
 * 기기 목록의 한 줄 (AUTH-06).
 *
 * <p>{@code ipAddress}·{@code userAgent}는 <b>표시 전용</b>이다. 둘 다 클라이언트가 통제하는 값이라
 * 인증 판단에 쓰지 않는다(설계/데이터베이스.md §2.2) — 사용자가 "이건 내가 아니다"를 알아보게
 * 돕는 단서일 뿐이다.
 *
 * <p>{@code current}는 지금 이 요청을 보낸 세션인지 표시한다. 사용자가 실수로 자기가 쓰는 기기를
 * 로그아웃시키지 않도록 화면이 구분해 보여줄 수 있다.
 */
public record UserSessionView(
        UUID id, String ipAddress, String userAgent, Instant lastUsedAt, Instant createdAt, boolean current) {}
