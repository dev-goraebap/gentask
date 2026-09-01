import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState } from '@/shared/ui/empty-state';
import { ROUTES } from '@/shared/config';

/**
 * 정한 시간 동안 하나에 집중하는 자리.
 *
 * <p>아직 자리만 잡아 둔 시안이다. 몇 분을 재는지, 작업과 어떻게 이어지는지가 정해지지 않았다.
 */
@Component({
  selector: 'app-pomodoro',
  imports: [EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  template: `
    <section class="mx-auto flex w-full max-w-[40rem] flex-1 flex-col px-4 pt-8 pb-8 md:pt-12">
      <h1 class="text-xl font-semibold tracking-tight">뽀모도로</h1>
      <p class="text-foreground-secondary mt-1 text-sm">하나에 집중하는 시간을 잽니다.</p>

      <app-empty-state
        size="lg"
        title="아직 준비 중입니다"
        description="정한 시간 동안 하나에 집중하고 잠시 쉬는 것을 되풀이합니다."
      />
    </section>
  `,
})
export class PomodoroPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;
}
