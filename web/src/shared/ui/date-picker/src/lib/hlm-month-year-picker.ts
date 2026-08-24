import type { BooleanInput } from '@angular/cdk/coercion';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  forwardRef,
  input,
  linkedSignal,
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
import { HlmCalendarImports } from '@/shared/ui/calendar';
import { HlmPopoverImports } from '@/shared/ui/popover';
import { injectHlmDatePickerPresentation } from './hlm-date-picker-presentation';
import { injectHlmMonthYearPickerConfig } from './hlm-month-year-picker.token';

export const HLM_MONTH_YEAR_PICKER_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => HlmMonthYearPicker),
  multi: true,
};
@Component({
  selector: 'hlm-month-year-picker',
  imports: [HlmPopoverImports, HlmCalendarImports],
  providers: [
    HLM_MONTH_YEAR_PICKER_VALUE_ACCESSOR,
    provideBrnDatePicker(HlmMonthYearPicker),
    provideBrnLabelable(HlmMonthYearPicker),
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
        <hlm-month-year-calendar
          class="rounded-none border-0"
          [date]="_mutableDate()"
          [defaultFocusedDate]="_mutableDate() ?? defaultFocusedDate()"
          [min]="minDate()"
          [max]="maxDate()"
          [disabled]="_disabled()"
          (dateChange)="_handleChange($event)"
        />
        <ng-content select="[hlmDatePickerFooter]" />
      </div>
    </hlm-popover>
  `,
})
export class HlmMonthYearPicker<T> implements BrnDatePickerBase<T>, ControlValueAccessor {
  private readonly _config = injectHlmMonthYearPickerConfig<T>();

  protected readonly _presentation = injectHlmDatePickerPresentation();

  public readonly popover = viewChild.required(BrnPopover);

  private readonly _trigger = contentChild(BrnDatePickerTriggerToken);

  public readonly align = input<BrnPopoverAlign>('start');

  public readonly minDate = input<T>();

  public readonly maxDate = input<T>();

  public readonly disabled = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
  });

  public readonly date = input<T>();

  public readonly defaultFocusedDate = input<T>();

  protected readonly _mutableDate = linkedSignal(this.date);

  public readonly autoCloseOnSelect = input<boolean, BooleanInput>(this._config.autoCloseOnSelect, {
    transform: booleanAttribute,
  });

  public readonly formatDate = input<(date: T) => string>(this._config.formatDate);

  public readonly transformDate = input<(date: T) => T>(this._config.transformDate);

  protected readonly _popoverState = signal<BrnOverlayState | null>(null);

  protected readonly _disabled = linkedSignal(this.disabled);

  public readonly disabledState = this._disabled.asReadonly();

  public readonly formattedDate = computed(() => {
    const date = this._mutableDate();
    return date ? this.formatDate()(date) : undefined;
  });

  public readonly dateChange = output<T | null>();

  public readonly labelableId = computed(() => this._trigger()?.triggerId());

  public readonly hasDate = computed(() => !!this._mutableDate());

  public readonly value = computed(() => this._mutableDate() ?? null);

  protected _onChange?: ChangeFn<T | null>;
  protected _onTouched?: TouchFn;

  protected _onStateChange(state: BrnOverlayState) {
    this._popoverState.set(state);
    if (state === 'closed') this._onTouched?.();
  }

  protected _handleChange(value: T | undefined) {
    if (this._disabled()) return;
    this.updateDate(value ?? null);

    if (this.autoCloseOnSelect()) {
      this._popoverState.set('closed');
    }
  }

  public updateDate(value: T | null) {
    if (this._disabled()) return;
    const transformedDate = value != null ? this.transformDate()(value) : undefined;

    this._mutableDate.set(transformedDate);
    this._onChange?.(transformedDate ?? null);
    this.dateChange.emit(transformedDate ?? null);
  }

  public writeValue(value: T | null): void {
    this._mutableDate.set(value ? this.transformDate()(value) : undefined);
  }

  public registerOnChange(fn: ChangeFn<T | null>): void {
    this._onChange = fn;
  }

  public registerOnTouched(fn: TouchFn): void {
    this._onTouched = fn;
  }

  public touched(): void {
    this._onTouched?.();
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
    this._onChange?.(null);
    this.dateChange.emit(null);
  }
}
