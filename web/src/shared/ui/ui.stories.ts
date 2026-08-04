import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

import { UiAlert } from './alert/alert';
import { UiButton } from './button/button';
import { UiCard } from './card/card';
import { UiField } from './field/field';
import { UiInput } from './input/input';
import { UiLink } from './link/link';
import { UiOtpInput } from './otp-input/otp-input';
import { UiSpinner } from './spinner/spinner';

/**
 * 1차 컴포넌트 카탈로그. 두 모드를 나란히 띄운다 — 한쪽만 보면 다른 쪽이
 * 깨진 것을 늦게 발견한다(디자인시스템.md §7).
 */
const meta: Meta = {
  title: 'UI/컴포넌트',
  decorators: [
    moduleMetadata({
      imports: [UiAlert, UiButton, UiCard, UiField, UiInput, UiLink, UiOtpInput, UiSpinner],
    }),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;

const 모드 = (테마: 'light' | 'dark', 내용: string) => `
  <div class="${테마 === 'dark' ? 'dark ' : ''}flex-1 bg-background p-8">
    <div class="mb-8 flex items-center gap-3">
      <span class="t-label-sm">${테마 === 'dark' ? '다크' : '라이트'}</span>
      <span class="h-px flex-1 bg-border"></span>
    </div>
    <div class="flex flex-col gap-10">${내용}</div>
  </div>
`;

const 나란히 = (내용: string) => ({
  template: `<div class="flex min-h-screen flex-col lg:flex-row">${모드('light', 내용)}${모드('dark', 내용)}</div>`,
});

const 절 = (제목: string, 내용: string) => `
  <section class="flex flex-col gap-3">
    <h2 class="t-label-sm text-fg-faint">${제목}</h2>
    ${내용}
  </section>
`;

export const 버튼: StoryObj = {
  render: () =>
    나란히(`
      ${절(
        '변형',
        `<div class="flex flex-wrap items-center gap-3">
          <button ui-button variant="primary">주 동작</button>
          <button ui-button variant="secondary">기본</button>
          <button ui-button variant="tertiary">조용한</button>
          <button ui-button variant="danger">삭제</button>
        </div>`,
      )}
      ${절(
        '크기',
        `<div class="flex flex-wrap items-center gap-3">
          <button ui-button variant="primary" size="sm">작게</button>
          <button ui-button variant="primary" size="md">보통</button>
          <button ui-button variant="primary" size="lg">크게</button>
        </div>`,
      )}
      ${절(
        '상태 — loading은 비활성과 함께 동작하고 텍스트를 갈아치우지 않는다',
        `<div class="flex flex-wrap items-center gap-3">
          <button ui-button variant="primary" [loading]="true">전송 중</button>
          <button ui-button variant="secondary" [disabled]="true">비활성</button>
          <button ui-button variant="primary" [disabled]="true">비활성</button>
        </div>`,
      )}
      ${절(
        '아이콘 전용 — 접근가능한 이름을 반드시 준다',
        `<div class="flex flex-wrap items-center gap-3">
          <button ui-button variant="secondary" [iconOnly]="true" aria-label="닫기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="size-4" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
          <button ui-button variant="tertiary" [iconOnly]="true" aria-label="설정">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="size-4" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>
          </button>
        </div>`,
      )}
      ${절(
        '링크로서의 버튼 — a에는 aria-disabled가 붙는다',
        `<div class="flex flex-wrap items-center gap-3">
          <a ui-button variant="secondary" href="#">이동</a>
          <a ui-button variant="secondary" href="#" [disabled]="true">이동(잠김)</a>
        </div>`,
      )}
    `),
};

export const 폼: StoryObj = {
  render: () =>
    나란히(`
      ${절(
        '필드 — 라벨 · 힌트 · 오류가 컨트롤에 자동으로 묶인다',
        `<div class="flex max-w-sm flex-col gap-5">
          <ui-field label="이메일" hint="가입 확인 코드를 이 주소로 보냅니다" [required]="true">
            <input ui-input type="email" placeholder="you@example.com" />
          </ui-field>

          <ui-field label="이메일" error="이미 사용 중인 주소입니다">
            <input ui-input type="email" value="taken@example.com" />
          </ui-field>

          <ui-field label="비활성">
            <input ui-input value="수정할 수 없음" disabled />
          </ui-field>

          <ui-field label="여러 줄" hint="textarea는 높이를 고정하지 않습니다">
            <textarea ui-input placeholder="내용을 적어주세요"></textarea>
          </ui-field>
        </div>`,
      )}
      ${절(
        '필드 없이 단독으로도 동작한다',
        `<div class="max-w-sm"><input ui-input placeholder="검색" aria-label="검색" /></div>`,
      )}
    `),
};

export const OTP입력: StoryObj = {
  render: () =>
    나란히(`
      ${절(
        '입력은 하나다 — 붙여넣기 · 자동완성 · 스크린리더가 네이티브로 동작한다',
        `<div class="flex flex-col gap-6">
          <ui-field label="인증 코드" hint="메일로 받은 6자리를 입력하세요">
            <ui-otp-input />
          </ui-field>

          <ui-field label="인증 코드" error="코드가 일치하지 않습니다. 2회 남았습니다">
            <ui-otp-input [invalid]="true" value="123" />
          </ui-field>

          <ui-field label="다 채운 상태">
            <ui-otp-input value="482913" />
          </ui-field>
        </div>`,
      )}
    `),
};

export const 배너: StoryObj = {
  render: () =>
    나란히(`
      ${절(
        '의도 — danger·warning만 role="alert"로 즉시 읽힌다',
        `<div class="flex max-w-md flex-col gap-3">
          <ui-alert intent="info" title="안내">코드는 10분 후 만료됩니다.</ui-alert>
          <ui-alert intent="success" title="완료">이메일이 확인되었습니다.</ui-alert>
          <ui-alert intent="warning" title="주의">남은 시도 횟수가 1회입니다.</ui-alert>
          <ui-alert intent="danger" title="오류">코드가 만료되었습니다. 다시 받아주세요.</ui-alert>
          <ui-alert intent="info">제목 없이 본문만 둘 수도 있습니다.</ui-alert>
        </div>`,
      )}
    `),
};

export const 카드와기타: StoryObj = {
  render: () =>
    나란히(`
      ${절(
        '카드 — 같은 평면은 선으로 가르고, 그림자는 실제로 떠 있는 것에만',
        `<div class="grid max-w-2xl gap-4 sm:grid-cols-2">
          <ui-card>
            <h3 class="t-title-md">기본 표면</h3>
            <p class="t-body-sm text-fg-muted">헤어라인 보더가 면을 가릅니다.</p>
            <div><button ui-button variant="secondary" size="sm">동작</button></div>
          </ui-card>
          <ui-card surface="elevated">
            <h3 class="t-title-md">떠 있는 표면</h3>
            <p class="t-body-sm text-fg-muted">모달·팝오버처럼 실제로 떠 있는 것에만 씁니다.</p>
          </ui-card>
        </div>`,
      )}
      ${절(
        '링크 — 색만으로 구분하지 않으므로 밑줄이 기본이다',
        `<p class="t-body-md max-w-md">
          계정이 이미 있다면 <a ui-link href="#">로그인</a>하세요.
          문제가 계속되면 <a ui-link href="#">도움말</a>을 참고하세요.
        </p>`,
      )}
      ${절(
        '스피너 — label이 있으면 읽히고 없으면 장식이다',
        `<div class="flex items-center gap-6">
          <ui-spinner size="sm" />
          <ui-spinner size="md" />
          <ui-spinner size="lg" label="불러오는 중" />
        </div>`,
      )}
    `),
};
