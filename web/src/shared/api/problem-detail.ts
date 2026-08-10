/**
 * 서버의 에러 응답 형식 — RFC 7807 `application/problem+json` (server/docs/references/API-설계.md §3).
 *
 * 서버는 성공 응답을 봉투로 감싸지 않으므로 이 타입은 실패 경로에만 등장한다.
 */
export interface ProblemDetail {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;

  /**
   * 클라이언트가 분기 판단에 쓰는 안정적인 식별자(`AUTH_INVALID_CREDENTIALS` 등).
   * 문구(`title`·`detail`)는 바뀔 수 있지만 이 값은 계약이다 — **분기는 항상 이것으로 한다.**
   */
  readonly code?: string;

  /** 서버 로그와 대조하는 추적 키. 응답 헤더 `X-Trace-Id`로도 온다. */
  readonly traceId?: string;
}

/**
 * 임의의 응답 본문이 ProblemDetail인지 판정한다.
 *
 * 서버가 아닌 것이 응답할 수 있다는 전제로 쓴다 — 프록시·게이트웨이·오프라인 페이지는
 * HTML이나 빈 본문을 돌려주며, 그것을 ProblemDetail로 단정하면 `undefined` 접근이 화면에서
 * 터진다.
 */
export function isProblemDetail(value: unknown): value is ProblemDetail {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const 후보 = value as Record<string, unknown>;
  return (
    typeof 후보['title'] === 'string' ||
    typeof 후보['detail'] === 'string' ||
    typeof 후보['code'] === 'string'
  );
}
