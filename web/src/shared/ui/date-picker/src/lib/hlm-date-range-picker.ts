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
  untracked,
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
import { HlmCalendarRange } from '@/shared/ui/calendar';
import { HlmPopoverImports } from '@/shared/ui/popover';
import { injectHlmDatePickerPresentation } from './hlm-date-picker-presentation';
import { injectHlmDateRangePickerConfig } from './hlm-date-range-picker.token';

export const HLM_DATE_RANGE_PICKER_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => HlmDateRangePicker),
  multi: true,
};

@Component({
  selector: 'hlm-date-range-picker',
  imports: [HlmPopoverImports, HlmCalendarRange],
  providers: [
    HLM_DATE_RANGE_PICKER_VALUE_ACCESSOR,
    provideBrnDatePicker(HlmDateRangePicker),
    provideBrnLabelable(HlmDateRangePicker),
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
        <hlm-calendar-range
          class="rounded-none border-0"
          [startDate]="_start()"
          [captionLayout]="captionLayout()"
          [endDate]="_end()"
          [min]="minDate()"
          [max]="maxDate()"
          [disabled]="_disabled()"
          (startDateChange)="_handleStartDayChange($event)"
          (endDateChange)="_handleEndDateChange($event)"
        />
        <ng-content select="[hlmDatePickerFooter]" />
      </div>
    </hlm-popover>
  `,
})
export class HlmDateRangePicker<T> implements BrnDatePickerBase<[T, T]>, ControlValueAccessor {
  private readonly _config = injectHlmDateRangePickerConfig<T>();

  protected readonly _presentation = injectHlmDatePickerPresentation();

  public readonly popover = viewChild.required(BrnPopover);

  private readonly _trigger = contentChild(BrnDatePickerTriggerToken);

  public readonly align = input<BrnPopoverAlign>('start');

  public readonly captionLayout = input<
    'dropdown' | 'label' | 'dropdown-months' | 'dropdown-years'
  >('label');

  public readonly minDate = input<T>();

  public readonly maxDate = input<T>();

  public readonly disabled = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
  });

  public readonly date = input<[T, T]>();

  protected readonly _mutableDate = linkedSignal(this.date);

  protected readonly _start = linkedSignal(() => this._mutableDate()?.[0]);
  protected readonly _end = linkedSignal(() => this._mutableDate()?.[1]);

  public readonly autoCloseOnEndSelection = input<boolean, BooleanInput>(
    this._config.autoCloseOnEndSelection,
    {
      transform: booleanAttribute,
    },
  );

  public readonly formatDates = input<(dates: [T | null, T | null]) => string>(
    this._config.formatDates,
  );

  public readonly transformDates = input<(date: [T, T]) => [T, T]>(this._config.transformDates);

  protected readonly _popoverState = signal<BrnOverlayState | null>(null);

  protected readonly _disabled = linkedSignal(this.disabled);

  public readonly disabledState = this._disabled.asReadonly();

  public readonly formattedDate = computed(() => {
    const start = this._start();
    const end = this._end();
    return start || end ? this.formatDates()([start ?? null, end ?? null]) : undefined;
  });

  public readonly dateChange = output<[T, T] | null>();

  public readonly labelableId = computed(() => this._trigger()?.triggerId());

  public readonly hasDate = computed(() => !!this._start() || !!this._end());

  public readonly value = computed(() => this._mutableDate() ?? null);

  protected _onChange?: ChangeFn<[T, T] | null>;
  protected _onTouched?: TouchFn;

  protected _onStateChange(state: BrnOverlayState) {
    this._popoverState.set(state);
    if (state === 'closed') {
      this._onClose();
      this._onTouched?.();
    }
  }

  protected _handleStartDayChange(value: T | undefined) {
    this._start.set(value);
  }

  protected _handleEndDateChange(value: T | undefined): void {
    this._end.set(value);
    if (this._disabled()) return;

    const start = this._start();
    if (start && value) {
      const transformedDates = this.transformDates()([start, value]);
      this._mutableDate.set(transformedDates);
      this.dateChange.emit(transformedDates);
      this._onChange?.(transformedDates);

      if (this.autoCloseOnEndSelection()) {
        this._popoverState.set('closed');
      }
    }
  }

  public updateDate(value: [T, T] | null) {
    if (this._disabled()) return;

    if (!value) {
      this._mutableDate.set(undefined);
      this._start.set(undefined);
      this._end.set(undefined);
      this._onChange?.(null);
      this.dateChange.emit(null);
      return;
    }

    const transformedDates = this.transformDates()(value);
    this._mutableDate.set(transformedDates);
    this._start.set(transformedDates[0]);
    this._end.set(transformedDates[1]);
    this._onChange?.(transformedDates);
    this.dateChange.emit(transformedDates);
  }

  public touched(): void {
    this._onTouched?.();
  }

  public writeValue(value: [T, T] | null): void {
    untracked(() => {
      if (!value) {
        this._mutableDate.set(undefined);
      } else {
        this._mutableDate.set(this.transformDates()(value));
      }
    });
  }

  public registerOnChange(fn: ChangeFn<[T, T] | null>): void {
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
    this._start.set(undefined);
    this._end.set(undefined);
    this._onChange?.(null);
    this.dateChange.emit(null);
  }

  protected _onClose(): void {
    const dates = this._mutableDate();
    if (this._start() && !this._end() && dates) {
      this._start.set(dates[0]);
      this._end.set(dates[1]);
    }
  }
}
