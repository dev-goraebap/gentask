import { Button, DropdownMenu, HStack, Text, VStack } from '@astryxdesign/core';
import { UserAvatar } from '@/shared/ui/user-avatar';
import { HgiTask } from '@/shared/ui/icons';
import { STATES, type Task, type TaskState } from '../api/tasks';

export function TaskBoardCard({ task, onOpen, onMove, writable, busy, showProject }: {
  task: Task; onOpen: () => void; onMove: (state: TaskState) => void; writable: boolean; busy: boolean; showProject: boolean;
}) {
  const date = (value: string) => new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  return <VStack gap={2} className="task-board-card" draggable={writable && !busy}
    onDragStart={event => { event.dataTransfer.setData('application/gentask-task', task.id); event.dataTransfer.effectAllowed = 'move'; }}>
    <HStack justify="between" align="center" gap={2}>
      <Text type="supporting" color="secondary">{task.id.slice(0, 8)}</Text>
      {task.assigneeId ? <UserAvatar userId={task.assigneeId} name={task.assigneeName ?? ''} size="sm" /> : null}
    </HStack>
    <Button className="task-board-card-title" label={task.title} variant="ghost" onClick={onOpen} width="100%"><Text maxLines={3} weight="medium">{task.title}</Text></Button>
    {showProject ? <Text className="task-board-project" type="supporting" color="secondary" maxLines={1}>{task.projectName ?? '개인'}</Text> : null}
    <HStack justify="between" align="center" gap={2}>
      <Text type="supporting" color="secondary">{task.dueDate ? `${date(task.dueDate + 'T00:00:00')} 마감` : task.scheduledDate ? `${date(task.scheduledDate + 'T00:00:00')} 예정` : '날짜 미지정'}</Text>
      {writable ? <DropdownMenu hasChevron={false} button={{ label: `${task.title} 상태 변경`, icon: <HgiTask size={14} />, isIconOnly: true, variant: 'ghost', size: 'sm', isDisabled: busy }}
        items={STATES.map(state => ({ label: state.label, isDisabled: task.state === state.value, onClick: () => onMove(state.value) }))} /> : null}
    </HStack>
  </VStack>;
}
