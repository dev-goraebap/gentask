/**
 * shared/api 공개 API.
 *
 * 바깥에서는 이 파일을 통해서만 가져온다(`@/shared/api`) — 웹.md §1의 세그먼트 공개 API 규칙.
 */
export { API_V1 } from './endpoint';
export { ApiError, toApiError, type ApiErrorKind } from './api-error';
export { errorInterceptor } from './error-interceptor';
export { isProblemDetail, type ProblemDetail } from './problem-detail';
