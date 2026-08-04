import { HttpErrorResponse } from '@angular/common/http';

import { ApiError, toApiError } from './api-error';

function 응답(status: number, body?: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: body, url: '/api/v1/sessions' });
}

describe('toApiError', () => {
  it('상태 코드를 화면이 분기하는 유형으로 옮긴다', () => {
    expect(toApiError(응답(0)).kind).toBe('offline');
    expect(toApiError(응답(400)).kind).toBe('validation');
    expect(toApiError(응답(401)).kind).toBe('unauthorized');
    expect(toApiError(응답(403)).kind).toBe('forbidden');
    expect(toApiError(응답(404)).kind).toBe('notFound');
    expect(toApiError(응답(409)).kind).toBe('conflict');
    expect(toApiError(응답(429)).kind).toBe('rateLimited');
    expect(toApiError(응답(503)).kind).toBe('server');
  });

  it('AUTH-01 서버 코드에 대응하는 우리 문구를 쓴다', () => {
    // 서버의 title·detail은 바뀔 수 있고 계약인 것은 code뿐이다(설계/서버.md §1.4).
    const error = toApiError(
      응답(401, {
        code: 'AUTH_INVALID_CREDENTIALS',
        title: '인증 정보가 올바르지 않습니다',
        detail: '이메일 또는 비밀번호를 확인해 주세요',
        traceId: 'trace-1',
      }),
    );

    expect(error.code).toBe('AUTH_INVALID_CREDENTIALS');
    expect(error.message).toBe('이메일 또는 비밀번호를 확인해 주세요.');
    expect(error.traceId).toBe('trace-1');
  });

  it('모르는 코드는 서버 문구로 되돌아간다', () => {
    const error = toApiError(
      응답(400, { code: 'FILE_UPLOAD_EXPIRED', detail: '업로드가 만료됐습니다' }),
    );

    expect(error.message).toBe('업로드가 만료됐습니다');
  });

  it('ProblemDetail이 아닌 본문에도 유형별 문구를 준다', () => {
    // 프록시·게이트웨이는 HTML이나 빈 본문을 돌려준다 — 그때 화면이 침묵하면 안 된다.
    expect(toApiError(응답(502, '<html>Bad Gateway</html>')).message).toContain('서버에 문제');
    expect(toApiError(응답(0)).message).toContain('네트워크');
  });

  it('재시도가 의미 있는 실패만 retryable이다', () => {
    expect(toApiError(응답(503)).retryable).toBe(true);
    expect(toApiError(응답(0)).retryable).toBe(true);
    expect(toApiError(응답(429)).retryable).toBe(true);
    // 같은 비밀번호를 다시 보내는 것은 재시도가 아니다
    expect(toApiError(응답(401)).retryable).toBe(false);
  });

  it('이미 정규화된 오류는 그대로 통과시킨다', () => {
    const original = new ApiError('offline', '연결 없음', 0);

    expect(toApiError(original)).toBe(original);
  });
});
