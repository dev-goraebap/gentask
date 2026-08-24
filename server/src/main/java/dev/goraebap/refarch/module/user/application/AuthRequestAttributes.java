package dev.goraebap.refarch.module.user.application;

/** 인증 인터셉터가 채우고 이 모듈이 읽는 요청 속성. 사용자 식별자는 공용 {@code CurrentUser.ATTRIBUTE} 가 갖는다. */
public final class AuthRequestAttributes {

    /** 쿠키 경로로 인증된 요청의 세션 식별자다. Bearer(에이전트 토큰) 경로에는 없다. */
    public static final String SESSION_ID = "dev.goraebap.refarch.sessionId";

    private AuthRequestAttributes() {}
}
