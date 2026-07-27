import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/**
 * Storybook 스파이크 전용 컴포넌트 — 검증이 끝나면 삭제한다.
 *
 * 정적 컴포넌트는 변경 감지가 깨져 있어도 렌더링되므로 검증이 되지 않는다.
 * 시그널로 갱신되는 화면을 두어 워크벤치에서 zoneless 변경 감지가 실제로 도는지 본다.
 */
@Component({
  selector: 'app-zoneless-spike',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="font-family: system-ui; padding: 24px">
      <p>
        클릭 수: <strong data-testid="count">{{ count() }}</strong>
      </p>
      <button type="button" data-testid="increment" (click)="increment()">증가</button>
    </div>
  `,
})
export class ZonelessSpike {
  readonly count = signal(0);

  increment(): void {
    this.count.update((value) => value + 1);
  }
}
