package dev.goraebap.devkit.auth.application.shared;

/**
 * 요청 클라이언트의 표시 정보. 기기 목록·개별 로그아웃의 표시 근거일 뿐 인증 판단에 쓰지 않는다 —
 * 둘 다 클라이언트가 통제하는 값이다 (설계/데이터베이스.md §2.2).
 */
public record ClientInfo(String ipAddress, String userAgent) {

    private static final int MAX_USER_AGENT = 512;
    private static final int MAX_IP = 45;

    /** 스키마의 길이 제약에 맞춰 자른다. 초과가 오류일 이유는 없다 — 표시 정보다. */
    public static ClientInfo of(String ipAddress, String userAgent) {
        return new ClientInfo(truncate(ipAddress, MAX_IP), truncate(userAgent, MAX_USER_AGENT));
    }

    private static String truncate(String value, int max) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
