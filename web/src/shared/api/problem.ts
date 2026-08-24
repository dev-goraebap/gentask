import { HttpErrorResponse } from '@angular/common/http';

/**
 * RFC 9457 응답의 detail 을 꺼냅니다. 서버가 사용자에게 보여도 되는 문장만 detail 에
 * 싣기로 했으므로(15-error-handling.md) 그대로 내보입니다. 그 모양이 아니면 대체 문구입니다.
 */
export function problemDetail(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse && typeof error.error?.detail === 'string') {
    return error.error.detail;
  }
  return fallback;
}
