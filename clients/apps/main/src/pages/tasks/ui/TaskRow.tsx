import { isCompleted, type Task } from '@/entities/task';
import { TODAY } from '@/shared/config';
import {
    HgiStar
} from '@/shared/ui/icons';
import {
    Button,
    CheckboxInput,
    Item
} from '@astryxdesign/core';

export function TaskRow({
  task,
  isSelected,
  onToggle,
  onOpen,
  onStar,
}: {
  readonly task: Task;
  readonly isSelected: boolean;
  readonly onToggle: () => void;
  readonly onOpen: () => void;
  readonly onStar: () => void;
}) {
  const marks = [
    task.myDayOn === TODAY ? '나의 하루' : null,
    task.dueDate ? `기한 ${task.dueDate}` : null,
    task.remindAt ? '알림' : null,
    task.files.length > 0 ? `첨부 ${task.files.length}` : null,
    task.note ? '메모' : null,
  ].filter(Boolean);

  return (
    <Item
      as="li"
      isSelected={isSelected}
      onClick={onOpen}
      startContent={
        <CheckboxInput
          label={isCompleted(task) ? '완료 해제' : '완료'}
          isLabelHidden
          value={isCompleted(task)}
          onChange={onToggle}
        />
      }
      label={task.title}
      description={marks.length > 0 ? marks.join(' · ') : undefined}
      endContent={
        <Button
          label={task.important ? '중요 해제' : '중요 표시'}
          isIconOnly
          icon={<HgiStar />}
          variant={task.important ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onStar}
        />
      }
    />
  );
}
