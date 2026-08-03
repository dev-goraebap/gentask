package dev.goraebap.devkit.common.web;

import dev.goraebap.devkit.common.ErrorCode;

/** 특정 모듈에 속하지 않는 공통 에러 코드. */
enum CommonErrorCode implements ErrorCode {
    COMMON_INVALID_REQUEST(400, "요청이 올바르지 않습니다"),
    /** 같은 자원을 동시에 만들려는 요청이 겹쳤다 — DB 유일성 제약이 막은 경우. */
    COMMON_CONFLICT(409, "요청이 다른 작업과 충돌했습니다"),
    COMMON_INTERNAL_ERROR(500, "서버 오류가 발생했습니다");

    private final int status;
    private final String title;

    CommonErrorCode(int status, String title) {
        this.status = status;
        this.title = title;
    }

    @Override
    public String code() {
        return name();
    }

    @Override
    public int status() {
        return status;
    }

    @Override
    public String title() {
        return title;
    }
}
