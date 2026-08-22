import type { Provider } from '@angular/core';
import { describeDue, toDateKey } from '@/entities/task';
import { provideHlmDatePickerConfig } from '@/shared/ui/date-picker';

/**
 * 이 화면의 날짜 선택기 설정입니다. 라우트 정의의 providers 에 등록합니다.
 *
 * 컴포넌트 providers 에 두지 않는 이유는 개발 서버의 HMR 이 컴포넌트 메타데이터를 다시
 * 평가할 때 배럴에서 온 함수가 아직 묶이지 않아 "is not a function" 이 나기 때문입니다.
 * 동작에는 영향이 없지만 콘솔을 더럽힙니다. 라우트 제공자는 그 경로를 타지 않습니다.
 *
 * 달력이 다루는 값은 Date 이고 저장 형식은 날짜 문자열입니다. 표기를 이 자리에서 정해 두면
 * 목록과 상세가 같은 함수를 거치므로 두 화면의 날짜가 어긋나지 않습니다.
 */
export function provideTaskListDatePicker(): Provider[] {
  return [
    provideHlmDatePickerConfig<Date>({
      formatDate: (date) => describeDue(toDateKey(date), toDateKey(new Date())),
      autoCloseOnSelect: true,
    }),
  ];
}
