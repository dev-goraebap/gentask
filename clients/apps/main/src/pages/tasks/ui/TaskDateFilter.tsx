import { DateInput, HStack, Selector } from '@astryxdesign/core';
import type { ComponentProps } from 'react';
import type { TaskFilters } from '../model/filters';
import { localDate } from '../model/taskDates';

export function TaskDateFilter({value, onChange}: {value: TaskFilters; onChange: (value: TaskFilters) => void}) {
  return <HStack gap={2} align="center">
    <Selector label="날짜 필터" isLabelHidden size="sm" variant="ghost" value={value.dateMode}
      options={[{value:'today',label:'오늘 · 기한 초과 포함'},{value:'date',label:'날짜 선택'},{value:'undated',label:'날짜 미지정'},{value:'all',label:'전체 기간'}]}
      onChange={mode => onChange({...value, dateMode: mode as TaskFilters['dateMode'], date:value.date || localDate()})} />
    {value.dateMode === 'date' ? <DateInput label="조회 날짜" isLabelHidden size="sm" value={(value.date || localDate()) as ComponentProps<typeof DateInput>['value']}
      onChange={date => onChange({...value,date:date || localDate()})} /> : null}
  </HStack>;
}
