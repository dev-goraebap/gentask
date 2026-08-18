import type { BooleanInput, NumberInput } from '@angular/cdk/coercion';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  forwardRef,
  input,
  linkedSignal,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  type BrnDatePickerBase,
  BrnDatePickerTriggerToken,
  provideBrnDatePicker,
} from '@spartan-ng/brain/date-picker';
import { BrnFieldControl, provideBrnLabelable } from '@spartan-ng/brain/field';
import type { ChangeFn, TouchFn } from '@spartan-ng/brain/forms';
import type { BrnOverlayState } from '@spartan-ng/brain/overlay';
import { BrnPopover, type BrnPopoverAlign } from '@spartan-ng/brain/popover';
import { HlmCalendarMulti } from '@/shared/ui/calendar';
import { HlmPopoverImports } from '@/shared/ui/popover';
import { injectHlmDatePickerMultiConfig } from './hlm-date-picker-multi.token';
import { injectHlmDatePickerPresentation } from './hlm-date-picker-presentation';

export const HLM_DATE_PICKER_MUTLI_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => HlmDatePickerMulti),
  multi: true,
};

@Component({
  selector: 'hlm-date-picker-multi',
  imports: [HlmPopoverImports, HlmCalendarMulti],
  providers: [
    HLM_DATE_PICKER_MUTLI_VALUE_ACCESSOR,
    provideBrnDatePicker(HlmDatePickerMulti),
    provideBrnLabelable(HlmDatePickerMulti),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BrnFieldControl],
  host: { class: 'block' },
  template: `
    <hlm-popover
      [align]="align()"
      sideOffset="5"
      [state]="_popoverState()"
      [hasBackdrop]="_presentation.hasBackdrop()"
      [positionStrategy]="_presentation.positionStrategy()"
      (stateChanged)="_onStateChange($event)"
    >
      <ng-content />

      <div
        *hlmPopoverPortal="let ctx"
        data-slot="popover-content"
        [class]="_presentation.surfaceClass()"
        [attr.data-state]="_popoverState() ?? 'closed'"
      >
        <ng-content select="[hlmDatePickerHeader]" />
        <hlm-calendar-multi
          class="rounded-none border-0"
          [date]="_mutableDate()"
          [captionLayout]="captionLayout()"
          [min]="minDate()"
          [max]="maxDate()"
          [minSelection]="minSelection()"
          [maxSelection]="maxSelection()"
          [disabled]="_disabled()"
          (dateChange)="_handleChange($event)"
        />
        <ng-content select="[hlmDatePickerFooter]" />
      </div>
    </hlm-popover>
  `,
})
export class HlmDatePickerMulti<T> implements BrnDatePickerBase<T[]>, ControlValueAccessor {
  private readonly _config = injectHlmDatePickerMultiConfig<T>();

  /** wide 는 트리거 옆 팝오버, compact 는 하단 바텀시트입니다. 07-adaptive-ui.md 5절. */
  protected readonly _presentation = injectHlmDatePickerPresentation();

  public readonly popover = viewChild.required(BrnPopover);

  private readonly _trigger = contentChild(BrnDatePickerTriggerToken);

  /*
   * 필드에 붙는 오버레이는 필드의 시작 모서리에 맞춥니다. 캘린더는 일곱 열이라 대개
   * 트리거보다 넓은데, 가운데로 맞추면 양쪽으로 삐져나와 어느 필드에 딸린 것인지
   * 흐려집니다. brain 기본값은 center 이며 여기서 바꿉니다.
   */
  public readonly align = input<BrnPopoverAlign>('start');

  /** Show dropdowns to navigate between months or years. */
  public readonly captionLayout = input<
    'dropdown' | 'label' | 'dropdown-months' | 'dropdown-years'
  >('label');

  /** The minimum date that can be selected.*/
  public readonly minDate = input<T>();

  /** The maximum date that can be selected. */
  public readonly maxDate = input<T>();

  /** The minimum selectable dates.  */
  public readonly minSelection = input<number, NumberInput>(undefined, {
    transform: numberAttribute,
  });

  /** The maximum selectable dates.  */
  public readonly maxSelection = input<number, NumberInput>(undefined, {
    transform: numberAttribute,
  });

  /** Determine if the date picker is disabled. */
  public readonly disabled = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
  });

  /** The selected value. */
  public readonly date = input<T[]>();

  protected readonly _mutableDate = linkedSignal(this.date);

  /** If true, the date picker will close when the max selection of dates is reached. */
  public readonly autoCloseOnMaxSelection = input<boolean, BooleanInput>(
    this._config.autoCloseOnMaxSelection,
    {
      transform: booleanAttribute,
    },
  );

  /** Defines how the date should be displayed in the UI.  */
  public readonly formatDates = input<(date: T[]) => string>(this._config.formatDates);

  /** Defines how the date should be transformed before saving to model/form. */
  public readonly transformDates = input<(date: T[]) => T[]>(this._config.transformDates);

  protected readonly _popoverState = signal<BrnOverlayState | null>(null);

  protected readonly _disabled = linkedSignal(this.disabled);

  /** @internal The disabled state as a readonly signal */
  public readonly disabledState = this._disabled.asReadonly();

  public readonly formattedDate = computed(() => {
    const dates = this._mutableDate();
    return dates ? this.formatDates()(dates) : undefined;
  });

  public readonly dateChange = output<T[]>();

  public readonly labelableId = computed(() => this._trigger()?.triggerId());

  public readonly hasDate = computed(() => !!this._mutableDate()?.length);

  /** @internal The current raw value, used by inputs to reformat on focus. */
  public readonly value = computed(() => this._mutableDate() ?? null);

  protected _onChange?: ChangeFn<T[]>;
  protected _onTouched?: TouchFn;

  protected _onStateChange(state: BrnOverlayState) {
    this._popoverState.set(state);
    if (state === 'closed') this._onTouched?.();
  }

  protected _handleChange(value: T[] | undefined) {
    if (value === undefined) return;

    if (this._disabled()) return;
    const transformedDate = value !== undefined ? this.transformDates()(value) : value;

    this._mutableDate.set(transformedDate);
    this._onChange?.(transformedDate);
    this.dateChange.emit(transformedDate);

    if (this.autoCloseOnMaxSelection() && this._mutableDate()?.length === this.maxSelection()) {
      this._popoverState.set('closed');
    }
  }

  /**
   * Commit dates to the picker. Updates the internal model, notifies form
   * controls, and emits `dateChange`. Intended to be called from a text input
   * that parses user-entered values. Pass `null` to clear the selection.
   */
  public updateDate(value: T[] | null) {
    if (this._disabled()) return;
    const transformedDate = value ? this.transformDates()(value) : undefined;

    this._mutableDate.set(transformedDate);
    this._onChange?.(transformedDate ?? []);
    this.dateChange.emit(transformedDate ?? []);
  }

  public touched(): void {
    this._onTouched?.();
  }

  /** CONTROL VALUE ACCESSOR */
  public writeValue(value: T[] | null): void {
    this._mutableDate.set(value ? this.transformDates()(value) : undefined);
  }

  public registerOnChange(fn: ChangeFn<T[]>): void {
    this._onChange = fn;
  }

  public registerOnTouched(fn: TouchFn): void {
    this._onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }

  public open() {
    this._popoverState.set('open');
  }

  public close() {
    this._popoverState.set('closed');
  }

  public reset() {
    this._mutableDate.set(undefined);
    this._onChange?.([]);
    this.dateChange.emit([]);
  }
}
