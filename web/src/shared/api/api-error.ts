import { HttpErrorResponse } from '@angular/common/http';

import { resolveErrorMessage } from './error-message';
import { isProblemDetail, type ProblemDetail } from './problem-detail';

/**
 * 화면이 분기하는 실패 유형 (설계/웹.md §6.4).
 *
 * HTTP 상태 코드를 화면까지 흘려보내지 않는다. 상태 코드는 전송 계층의 어휘이고, 화면이
 * 결정해야 하는 것은 "**사용자에게 무엇을 보여주고 어디로 보낼 것인가**"다 — 두 축을 한
 * 숫자에 겹쳐 두면 호출부마다 `err.status === 401 || err.status === 403` 같은 분기가 번진다.
 */
export type ApiErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'rateLimited'
  | 'server'
  | 'offline'
  | 'unknown';

/** 화면이 다루는 단일 실패 표현. HTTP·네트워크·비정상 응답이 모두 여기로 모인다. */
export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    override readonly message: string,
    readonly status: number,
    readonly code?: string,
    readonly traceId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 같은 요청을 그대로 다시 보내는 것이 의미 있는 실패인가. 재시도 UI의 판단 기준이다. */
  get retryable(): boolean {
    return this.kind === 'offline' || this.kind === 'server' || this.kind === 'rateLimited';
  }
}

/**
 * 상태 코드를 유형으로 옮긴다.
 *
 * `status === 0`은 **응답이 오지 않았다**는 뜻이다 — 오프라인·DNS 실패·CORS 차단·요청 중단이
 * 모두 여기 해당한다. 서버가 0을 응답할 방법은 없으므로 네트워크 문제로 다룬다.
 */
function 유형판정(status: number): ApiErrorKind {
  if (status === 0) return 'offline';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rateLimited';
  if (status >= 500) return 'server';
  if (status >= 400) return 'validation';
  return 'unknown';
}

/**
 * 무엇이 던져졌든 {@link ApiError} 하나로 정규화한다.
 *
 * 호출부가 `instanceof HttpErrorResponse`를 알 필요가 없게 하는 것이 목적이다. 그 타입이
 * 화면까지 새어 나가면 HttpClient를 다른 것으로 바꿀 수 없고, 무엇보다 **에러 처리 코드가
 * 프레임워크 타입에 묶여 테스트에서 진짜 실패를 흉내내기 어려워진다.**
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    const kind = 유형판정(error.status);
    const problem: ProblemDetail = isProblemDetail(error.error) ? error.error : {};
    return new ApiError(
      kind,
      resolveErrorMessage(kind, problem.code, problem.detail ?? problem.title),
      error.status,
      problem.code,
      problem.traceId,
    );
  }

  // 여기까지 온 것은 서버가 아니라 우리 코드가 던진 것이다 — 문구를 지어내지 않는다.
  return new ApiError('unknown', resolveErrorMessage('unknown'), 0);
}
