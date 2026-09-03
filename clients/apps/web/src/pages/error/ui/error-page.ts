import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROUTES } from '@/shared/config';
import { HlmButton } from '@/shared/ui/button';
import { EmptyState, type EmptyIllustration } from '@/shared/ui/empty-state';

/** 실패한 자리의 종류. 라우트가 어느 것인지 정한다. */
export type ErrorKind = '404' | '500';

/**
 * 404 와 500 이 함께 쓰는 자리.
 *
 * 레이아웃은 하나이고 그림과 글만 다르다. 둘을 각각의 화면으로 두면 같은 배치가 두 벌이 되고,
 * 한쪽만 고쳐 어긋난다.
 */
@Component({
  selector: 'app-error',
  imports: [EmptyState, HlmButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-dvh flex-col items-center justify-center p-6' },
  template: `
    <app-empty-state
      size="lg"
      [illustration]="content().illustration"
      [title]="content().title"
      [description]="content().description"
    >
      <a hlmBtn variant="outline" [routerLink]="routes.home()">처음으로</a>
    </app-empty-state>
  `,
})
export class ErrorPage {
  protected readonly routes = ROUTES;

  readonly kind = input<ErrorKind>('404');

  protected readonly content = computed(() => CONTENT[this.kind()] ?? CONTENT['404']);
}

const CONTENT: Record<ErrorKind, { illustration: EmptyIllustration; title: string; description: string }> = {
  '404': {
    illustration: 'error-404',
    title: '찾는 자리가 없습니다',
    description: '주소가 바뀌었거나 지워진 자리입니다. 주소를 다시 확인해 주세요.',
  },
  '500': {
    illustration: 'error-500',
    title: '서버에 닿지 못했습니다',
    description: '잠시 뒤에 다시 시도해 주세요. 계속 이러면 잠시 손을 보는 중일 수 있습니다.',
  },
};
