import type { IsActiveMatchOptions } from '@angular/router';

/**
 * 현재 URL 경로와 정확히 일치하는 네비게이션 링크만 활성화한다.
 */
export const EXACT_LINK: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'ignored',
  fragment: 'ignored',
  matrixParams: 'ignored',
};
