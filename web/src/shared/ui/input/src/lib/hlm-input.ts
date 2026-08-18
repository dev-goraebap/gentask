import { Directive } from '@angular/core';
import { BrnFieldControlDescribedBy } from '@spartan-ng/brain/field';
import { BrnInput } from '@spartan-ng/brain/input';
import { classes } from '@/shared/ui/utils';

@Directive({
  selector: '[hlmInput]',
  hostDirectives: [
    { directive: BrnInput, inputs: ['id', 'forceInvalid'] },
    BrnFieldControlDescribedBy,
  ],
  host: { 'data-slot': 'input' },
})
/*
 * 생성기 기본값의 md:text-sm 을 pointer-fine:text-sm 으로 바꿨습니다. 폭으로 판정하면
 * 태블릿 가로가 md 를 넘겨 14px 이 되는데, iOS Safari 는 16px 미만 입력에 포커스가 가면
 * 화면을 확대하고 사용자가 그 배율을 직접 되돌려야 합니다. 04-design-system.md 3.5절.
 */
export class HlmInput {
  constructor() {
    classes(
      () =>
        'pointer-coarse:min-h-11 dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 data-[matches-spartan-invalid=true]:ring-destructive/20 dark:data-[matches-spartan-invalid=true]:ring-destructive/40 data-[matches-spartan-invalid=true]:border-destructive dark:data-[matches-spartan-invalid=true]:border-destructive/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] file:h-7 file:text-sm file:font-medium focus-visible:ring-3 data-[matches-spartan-invalid=true]:ring-3 pointer-fine:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    );
  }
}
