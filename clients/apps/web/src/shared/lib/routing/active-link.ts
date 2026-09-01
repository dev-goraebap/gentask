import type { IsActiveMatchOptions } from '@angular/router';

/**
 * 지금 자리를 정확히 가리키는 링크만 켠다.
 *
 * <p>기본값은 앞자리만 맞아도 켜는 것이라, `/todo` 와 `/todo/my-day` 처럼 층이 겹치는 자리에서
 * 여러 칸이 함께 켜진다. 띠와 탭이 같은 규칙을 써야 하므로 한 곳에서 만든다.
 */
export const EXACT_LINK: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'ignored',
  fragment: 'ignored',
  matrixParams: 'ignored',
};
