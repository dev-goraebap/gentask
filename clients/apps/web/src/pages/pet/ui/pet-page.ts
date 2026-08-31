import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState } from '@/shared/ui/empty-state';

/**
 * 팻을 기르는 자리.
 *
 * <p>아직 자리만 잡아 둔 시안이다. 무엇을 어떻게 기르는지는 정해지지 않았고, 여기 적힌 것은 지금까지
 * 나온 이야기의 골자다. 규격이 서면 서술서와 인수 조건이 먼저 생기고 그 뒤에 이 화면이 채워진다.
 */
@Component({
  selector: 'app-pet',
  imports: [EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  template: `
    <section class="mx-auto flex w-full max-w-[40rem] flex-1 flex-col px-4 pt-8 pb-8 md:pt-12">
      <h1 class="text-xl font-semibold tracking-tight">팻 관리</h1>
      <p class="text-foreground-secondary mt-1 text-sm">기르는 것을 이 자리에 둡니다.</p>

      <app-empty-state
        size="lg"
        title="아직 준비 중입니다"
        description="여덟 마리 가운데 하나를 골라 기릅니다. 작업을 완료할 때마다 자랍니다."
      />
    </section>
  `,
})
export class PetPage {}
