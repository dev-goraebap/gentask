import { BooleanInput } from '@angular/cdk/coercion';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import {
  type BrnDatePickerTriggerBase,
  injectBrnDatePicker,
  provideBrnDatePickerTrigger,
} from '@spartan-ng/brain/date-picker';
import { BrnFieldControl, BrnFieldControlDescribedBy } from '@spartan-ng/brain/field';
import { BrnOverlayTrigger } from '@spartan-ng/brain/overlay';
import { injectViewportClass } from '@/shared/lib';
import { ButtonVariants, HlmButtonImports } from '@/shared/ui/button';
import { hlm } from '@/shared/ui/utils';
import { ClassValue } from 'clsx';

@Component({
  selector: 'hlm-date-picker-trigger',
  imports: [HlmButtonImports, BrnOverlayTrigger, NgIcon, BrnFieldControlDescribedBy],
  providers: [
    provideIcons({ lucideChevronDown }),
    provideBrnDatePickerTrigger(HlmDatePickerTrigger),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'date-picker-trigger' },
  template: `
    <button
      #trigger
      [id]="buttonId()"
      type="button"
      aria-haspopup="dialog"
      [class]="_computedClass()"
      [disabled]="_disabled()"
      [attr.aria-invalid]="_ariaInvalid()"
      [attr.data-invalid]="_ariaInvalid()"
      [attr.data-touched]="_touched?.() ? 'true' : null"
      [attr.data-dirty]="_dirty?.() ? 'true' : null"
      [attr.data-matches-spartan-invalid]="_spartanInvalid() ? 'true' : null"
      hlmBtn
      [variant]="variant()"
      brnOverlayTrigger
      [brnOverlayTriggerFor]="_popover()"
      brnFieldControlDescribedBy
      [attr.data-placeholder]="_isPlaceholder() ? '' : null"
    >
      <span class="truncate">
        @if (_formattedDate(); as formattedDate) {
          {{ formattedDate }}
        } @else {
          <ng-content />
        }
      </span>

      @if (showTrigger()) {
        <ng-icon name="lucideChevronDown" />
      }
    </button>
  `,
})
export class HlmDatePickerTrigger implements BrnDatePickerTriggerBase {
  private static _nextId = 0;

  private readonly _fieldControl = inject(BrnFieldControl, { optional: true });
  private readonly _datePicker = injectBrnDatePicker();

  private readonly _invalid = this._fieldControl?.invalid;
  protected readonly _spartanInvalid = computed(
    () => this.forceInvalid() || this._fieldControl?.spartanInvalid(),
  );
  protected readonly _dirty = this._fieldControl?.dirty;
  protected readonly _touched = this._fieldControl?.touched;

  protected readonly _ariaInvalid = computed(() => (this._invalid?.() ? 'true' : null));

  public readonly userClass = input<ClassValue>('', { alias: 'class' });
  protected readonly _computedClass = computed(() =>
    hlm('data-placeholder:text-muted-foreground justify-between', this.userClass()),
  );

  protected readonly _isPlaceholder = computed(() => !this._datePicker.hasDate());

  /** The id of the button that opens the date picker. */
  public readonly buttonId = input<string>(`hlm-date-picker-${++HlmDatePickerTrigger._nextId}`);

  /** @internal The id of the button that opens the date picker, used for labeling. */
  public readonly triggerId = this.buttonId;

  /** Forces the invalid state visually, regardless of form control state. */
  public readonly forceInvalid = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
  });

  public readonly variant = input<ButtonVariants['variant']>('outline');

  public readonly showTrigger = input<boolean, BooleanInput>(true, { transform: booleanAttribute });

  protected readonly _popover = this._datePicker.popover;
  protected readonly _disabled = this._datePicker.disabledState;
  protected readonly _formattedDate = this._datePicker.formattedDate;

  private readonly _viewport = injectViewportClass();
  private readonly _button = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  constructor() {
    /*
     * 오리진을 트리거가 직접 관리합니다. `BrnPopoverTrigger` 를 쓰지 않는 이유는
     * 그것이 클릭 시점에 자기 호스트를 오리진으로 심고, 오리진이 붙은 팝오버는
     * `positionStrategy` 입력을 무시한 채 트리거 연결 전략만 쓰기 때문입니다.
     * 바텀시트는 오리진이 비어 있어야 열립니다. 07-adaptive-ui.md 4.2절.
     *
     * ARIA·id·클릭 처리는 `BrnOverlayTrigger` 가 그대로 담당하며 여기서 직접
     * 배선하는 것은 오리진 하나입니다. 같은 방식이 `HlmDatePickerAnchor` 에도
     * 이미 쓰이고 있습니다.
     */
    effect(() => {
      const origin = this._viewport() === 'compact' ? null : this._button().nativeElement;
      this._popover().setOrigin(origin);
    });
  }
}
