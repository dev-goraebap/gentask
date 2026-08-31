import { inject, InjectionToken, type ValueProvider } from '@angular/core';

export interface HlmDatePickerConfig<T> {
  autoCloseOnSelect: boolean;

  formatDate: (date: T) => string;

  formatInputDate: (date: T) => string;

  transformDate: (date: T) => T;

  parseDate: (value: string) => T | null;
}

function getDefaultConfig<T>(): HlmDatePickerConfig<T> {
  return {
    formatDate: (date) => (date instanceof Date ? date.toDateString() : `${date}`),
    formatInputDate: (date) => (date instanceof Date ? date.toDateString() : `${date}`),
    transformDate: (date) => date,
    parseDate: (value) => {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : (date as T);
    },
    autoCloseOnSelect: false,
  };
}

const HlmDatePickerConfigToken = new InjectionToken<HlmDatePickerConfig<unknown>>(
  'HlmDatePickerConfig',
);

export function provideHlmDatePickerConfig<T>(
  config: Partial<HlmDatePickerConfig<T>>,
): ValueProvider {
  return { provide: HlmDatePickerConfigToken, useValue: { ...getDefaultConfig(), ...config } };
}

export function injectHlmDatePickerConfig<T>(): HlmDatePickerConfig<T> {
  const injectedConfig = inject(HlmDatePickerConfigToken, { optional: true });
  return injectedConfig ? (injectedConfig as HlmDatePickerConfig<T>) : getDefaultConfig();
}
