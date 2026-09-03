package xyz.gentask.module.user.domain.user;

/**
 * 시스템 사용자 권한 역할 열거형이다.
 */
public enum Role {
    /** 일반 사용자 권한이다. */
    USER,

    /** 플랫폼 관리자 권한이다. */
    ADMIN;

    public boolean isAdmin() {
        return this == ADMIN;
    }
}
