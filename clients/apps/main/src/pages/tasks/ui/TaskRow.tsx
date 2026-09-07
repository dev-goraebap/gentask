import { ListItem, Text, HStack, StatusDot } from '@astryxdesign/core';
import { type Task, STATES } from '../api/tasks';
export function TaskRow({ task, onOpen, draggable = false, showProject = true, showState = true, selected = false }: {
  task: Task; onOpen: () => void; draggable?: boolean; showProject?: boolean; showState?: boolean; selected?: boolean;
}) {
  const state = STATES.find(state => state.value === task.state)!;
  const metadata = [showProject ? task.projectName ?? '개인' : null, task.assigneeName,
    task.dueDate ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) + ' 마감' : null].filter(Boolean).join(' · ');
  return <ListItem label={<Text type="inherit" maxLines={2}>{task.title}</Text>} onClick={onOpen} isSelected={selected} draggable={draggable}
    onDragStart={event => { event.dataTransfer.setData('application/gentask-task', task.id); event.dataTransfer.effectAllowed = 'move'; }}
    description={metadata || undefined}
    endContent={showState ? <HStack gap={1} align="center" style={{ whiteSpace: 'nowrap' }}><StatusDot label={state.label} variant={task.state === 'DONE' ? 'success' : task.state === 'IN_PROGRESS' ? 'accent' : 'neutral'} /><Text type="supporting">{state.label}</Text></HStack> : undefined} />;
}
