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

  protected readonly _presentation = injectHlmDatePickerPresentation();

  public readonly popover = viewChild.required(BrnPopover);

  private readonly _trigger = contentChild(BrnDatePickerTriggerToken);

  public readonly align = input<BrnPopoverAlign>('start');

  public readonly captionLayout = input<
    'dropdown' | 'label' | 'dropdown-months' | 'dropdown-years'
  >('label');

  public readonly minDate = input<T>();

  public readonly maxDate = input<T>();

  public readonly minSelection = input<number, NumberInput>(undefined, {
    transform: numberAttribute,
  });

  public readonly maxSelection = input<number, NumberInput>(undefined, {
    transform: numberAttribute,
  });

  public readonly disabled = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
  });

  public readonly date = input<T[]>();

  protected readonly _mutableDate = linkedSignal(this.date);

  public readonly autoCloseOnMaxSelection = input<boolean, BooleanInput>(
    this._config.autoCloseOnMaxSelection,
    {
      transform: booleanAttribute,
    },
  );

  public readonly formatDates = input<(date: T[]) => string>(this._config.formatDates);

  public readonly transformDates = input<(date: T[]) => T[]>(this._config.transformDates);

  protected readonly _popoverState = signal<BrnOverlayState | null>(null);

  protected readonly _disabled = linkedSignal(this.disabled);

  public readonly disabledState = this._disabled.asReadonly();

  public readonly formattedDate = computed(() => {
    const dates = this._mutableDate();
    return dates ? this.formatDates()(dates) : undefined;
  });

  public readonly dateChange = output<T[]>();

  public readonly labelableId = computed(() => this._trigger()?.triggerId());

  public readonly hasDate = computed(() => !!this._mutableDate()?.length);

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
