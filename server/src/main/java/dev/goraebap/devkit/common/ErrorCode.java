package dev.goraebap.devkit.common;

/**
 * 에러 응답의 안정적인 식별자 계약 (docs/references/API-설계.md §3·§4).
 *
 * <p>문구({@code title}·{@code detail})는 바뀔 수 있지만 {@code code}는 클라이언트가 분기에 쓰는
 * 계약이다. 코드 문자열은 {@code <모듈>_<사유>}의 SCREAMING_SNAKE_CASE — 하이픈은 요구사항 ID,
 * 언더스코어는 에러 코드로 구분한다.
 */
public interface ErrorCode {

    /** 안정적인 코드 문자열 (예: {@code AUTH_INVALID_CREDENTIALS}). */
    String code();

    /** HTTP 상태 코드. */
    int status();

    /** 사람이 읽는 기본 제목. */
    String title();
}
