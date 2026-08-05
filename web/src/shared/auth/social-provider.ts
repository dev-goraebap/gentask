/**
 * 소셜 로그인 제공자 (AUTH-02·03).
 *
 * 제공자 목록을 데이터로 두고 버튼 컴포넌트를 만들지 않는다. 버튼이 쓰이는 두 곳(로그인·가입)은
 * **항상 함께 바뀌므로** 추출 조건을 충족하지 않는다(웹.md §2의 조건 2). 목록만 여기 모아 두면
 * 제공자를 더할 때 고칠 곳은 이 파일 하나이고, 마크업은 각 화면이 자기 맥락에 맞게 그린다.
 */
export interface SocialProvider {
  readonly id: 'google' | 'kakao';
  readonly label: string;
}

export const SOCIAL_PROVIDERS: readonly SocialProvider[] = [
  { id: 'google', label: 'Google로 계속하기' },
  { id: 'kakao', label: '카카오로 계속하기' },
];

/**
 * 제공자로 보내는 시작 경로 (설계/인프라.md §2.2 — 이 경로는 서버가 받는다).
 *
 * **`routerLink`가 아니라 `href`로 이동해야 한다.** SPA 안에서 라우팅하면 서버에 도달하지 않아
 * 아무 일도 일어나지 않는다 — 제공자로 가는 302를 브라우저가 따라가야 하므로 전체 페이지
 * 이동이어야 한다.
 */
export function socialLoginStartUrl(provider: SocialProvider): string {
  return `/oauth2/authorization/${provider.id}`;
}
