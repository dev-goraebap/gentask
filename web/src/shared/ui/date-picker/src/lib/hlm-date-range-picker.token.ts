import { inject, InjectionToken, type ValueProvider } from '@angular/core';

export interface HlmDateRangePickerConfig<T> {
  autoCloseOnEndSelection: boolean;

  formatDates: (dates: [T | null, T | null]) => string;

  formatInputDates: (dates: [T | null, T | null]) => string;

  transformDates: (dates: [T, T]) => [T, T];

  parseDate: (value: string) => [T, T] | null;
}

function getDefaultConfig<T>(): HlmDateRangePickerConfig<T> {
  return {
    formatDates: (dates) =>
      dates
        .filter(Boolean)
        .map((date) => (date instanceof Date ? date.toDateString() : `${date}`))
        .join(' - '),
    formatInputDates: (dates) =>
      dates
        .filter(Boolean)
        .map((date) => (date instanceof Date ? date.toDateString() : `${date}`))
        .join(' - '),
    transformDates: (dates) => dates,
    autoCloseOnEndSelection: false,
    parseDate: (value) => {
      if (typeof value !== 'string') return null;

      const parts = value.split(' - ').map((part) => part.trim());
      if (parts.length === 0 || parts.length > 2) return null;

      const start = new Date(parts[0]);
      if (isNaN(start.getTime())) return null;

      const end = parts.length === 2 ? new Date(parts[1]) : start;

      return [start, isNaN(end.getTime()) ? start : end] as [T, T];
    },
  };
}

const HlmDateRangePickerConfigToken = new InjectionToken<HlmDateRangePickerConfig<unknown>>(
  'HlmDateRangePickerConfig',
);

export function provideHlmDateRangePickerConfig<T>(
  config: Partial<HlmDateRangePickerConfig<T>>,
): ValueProvider {
  return { provide: HlmDateRangePickerConfigToken, useValue: { ...getDefaultConfig(), ...config } };
}

export function injectHlmDateRangePickerConfig<T>(): HlmDateRangePickerConfig<T> {
  const injectedConfig = inject(HlmDateRangePickerConfigToken, { optional: true });
  return injectedConfig ? (injectedConfig as HlmDateRangePickerConfig<T>) : getDefaultConfig();
}
