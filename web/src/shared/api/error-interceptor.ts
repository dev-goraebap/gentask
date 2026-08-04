import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { toApiError } from './api-error';

/**
 * 모든 HTTP 실패를 {@link ApiError}로 바꿔 흘려보낸다.
 *
 * 호출부마다 정규화하지 않고 여기 한 곳에 두는 이유: **빠뜨린 곳이 생기면 그 화면만 조용히
 * 프레임워크 타입을 받는다.** 그러면 `error.error.detail`을 직접 파는 코드가 자라고, 서버가
 * 문구를 바꾸는 날 화면이 함께 깨진다.
 *
 * 여기서 화면 전환(로그인으로 보내기 등)을 하지 않는다 — 그것은 실패의 의미를 아는 쪽이
 * 판단할 일이다. 로그인 요청의 401(비밀번호 오류)과 세션 만료의 401은 상태 코드가 같지만
 * 사용자에게는 전혀 다른 사건이다.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(catchError((error: unknown) => throwError(() => toApiError(error))));
