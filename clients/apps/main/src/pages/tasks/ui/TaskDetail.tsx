import { type Task } from '@/entities/task';
import { TODAY } from '@/shared/config';
import {
    HgiAlarmClock,
    HgiAttachment,
    HgiStar,
    HgiSun
} from '@/shared/ui/icons';
import {
    Button,
    DateInput,
    Divider,
    HStack,
    Item,
    List,
    Text,
    TextArea,
    TextInput,
    VStack,
    type ISODateString
} from '@astryxdesign/core';

export function TaskDetail({
  task,
  onPatch,
}: {
  readonly task: Task;
  readonly onPatch: (patch: Partial<Task>) => void;
}) {
  return (
    <VStack gap={4}>
      <VStack gap={2}>
        <Button
          label={task.myDayOn === TODAY ? '나의 하루에서 빼기' : '나의 하루에 추가'}
          icon={<HgiSun />}
          variant="secondary"
          size="sm"
          onClick={() => onPatch({ myDayOn: task.myDayOn === TODAY ? null : TODAY })}
        />
        <Button
          label={task.important ? '중요 해제' : '중요로 표시'}
          icon={<HgiStar />}
          variant={task.important ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onPatch({ important: !task.important })}
        />
      </VStack>

      <Divider />

      <VStack gap={3}>
        {/* DateInput 은 `YYYY-MM-DD` 템플릿 타입을 받는다. 저장 값의 형식이 같으므로 단언한다. */}
        <DateInput
          label="기한"
          value={(task.dueDate ?? undefined) as ISODateString | undefined}
          onChange={(v) => onPatch({ dueDate: v ?? null })}
          hasClear
        />
        <TextInput
          label="알림 예약"
          type="text"
          startIcon={<HgiAlarmClock />}
          placeholder="2026-09-06T09:00"
          value={task.remindAt ?? ''}
          onChange={(v) => onPatch({ remindAt: v || null })}
        />
      </VStack>

      <Divider />

      <VStack gap={2}>
        <HStack justify="between" align="center">
          <Text type="supporting">첨부 파일</Text>
          <Button label="파일 추가" icon={<HgiAttachment />} variant="ghost" size="sm" />
        </HStack>
        {task.files.length === 0 ? (
          <Text type="supporting">첨부한 파일이 없습니다.</Text>
        ) : (
          <List hasDividers>
            {task.files.map((f) => (
              <Item
                key={f.id}
                as="li"
                density="compact"
                startContent={<HgiAttachment size={14} />}
                label={f.fileName}
                description={`${Math.round(f.size / 1024)}KB · ${f.createdAt.slice(0, 10)}`}
              />
            ))}
          </List>
        )}
      </VStack>

      <Divider />

      <TextArea
        label="메모"
        value={task.note}
        onChange={(v) => onPatch({ note: v })}
        placeholder="자세한 내용을 적습니다"
        rows={5}
      />

      <Text type="supporting">만든 날짜 {task.createdAt.slice(0, 10)}</Text>
    </VStack>
  );
}
