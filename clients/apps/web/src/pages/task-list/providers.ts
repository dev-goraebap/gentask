import type { Provider } from '@angular/core';
import { describeDue, toDateKey } from '@/entities/task';
import { provideHlmDatePickerConfig } from '@/shared/ui/date-picker';

export { TaskService } from './api/task-service';

export function provideTaskListDatePicker(): Provider[] {
  return [
    provideHlmDatePickerConfig<Date>({
      formatDate: (date) => describeDue(toDateKey(date), toDateKey(new Date())),
      autoCloseOnSelect: true,
    }),
  ];
}
