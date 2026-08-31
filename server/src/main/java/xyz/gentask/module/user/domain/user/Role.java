package xyz.gentask.module.user.domain.user;

/**
 * 이 사용자가 무엇을 할 수 있는가.
 *
 * <p>둘로만 가른다. 지금 가르는 것이 "관리 화면에 들어갈 수 있는가" 하나뿐이며, 자원마다 다른 권한을
 * 주어야 할 필요가 아직 없다. 가를 것이 늘면 역할과 권한을 분리한다.
 */
public enum Role {
    /** 자기 것만 다룬다. */
    USER,

    /** 자기 것에 더해 플랫폼 전체를 본다. */
    ADMIN;

    public boolean isAdmin() {
        return this == ADMIN;
    }
}
