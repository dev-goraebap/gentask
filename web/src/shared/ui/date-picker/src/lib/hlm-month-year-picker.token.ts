import { inject, InjectionToken, type ValueProvider } from '@angular/core';

export interface HlmMonthYearPickerConfig<T> {
  autoCloseOnSelect: boolean;

  formatDate: (date: T) => string;

  formatInputDate: (date: T) => string;

  transformDate: (date: T) => T;

  parseDate: (value: string) => T | null;
}

const mmYYYY = <T>(date: T) => {
  if (!(date instanceof Date)) return `${date}`;

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${year}`;
};

function getDefaultConfig<T>(): HlmMonthYearPickerConfig<T> {
  return {
    formatDate: mmYYYY,
    formatInputDate: mmYYYY,
    transformDate: (date) => date,
    parseDate: (value) => {
      if (typeof value !== 'string') return null;

      const match = value.match(/^(\d{2})\/(\d{4})$/);
      if (!match) return null;

      const month = Number(match[1]);
      const year = Number(match[2]);

      if (month < 1 || month > 12) return null;

      const date = new Date(year, month - 1, 1);

      return date as T;
    },
    autoCloseOnSelect: false,
  };
}

const HlmMonthYearPickerConfigToken = new InjectionToken<HlmMonthYearPickerConfig<unknown>>(
  'HlmMonthYearPickerConfig',
);

export function provideHlmMonthYearPickerConfig<T>(
  config: Partial<HlmMonthYearPickerConfig<T>>,
): ValueProvider {
  return { provide: HlmMonthYearPickerConfigToken, useValue: { ...getDefaultConfig(), ...config } };
}

export function injectHlmMonthYearPickerConfig<T>(): HlmMonthYearPickerConfig<T> {
  const injectedConfig = inject(HlmMonthYearPickerConfigToken, { optional: true });
  return injectedConfig ? (injectedConfig as HlmMonthYearPickerConfig<T>) : getDefaultConfig();
}
