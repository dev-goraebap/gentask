import { useState } from 'react';
import { Button, HStack, VStack, Heading, Text, StatusDot } from '@astryxdesign/core';
import { HgiPlus } from '@/shared/ui/icons';
import { type Task, type TaskState, STATES } from '../api/tasks';
import { TaskBoardCard } from './TaskBoardCard';
export function TaskBoard({ tasks, states, onOpen, onMove, onCreate, canEdit, busy, showProject }: {
  tasks: Task[]; states: string[]; onOpen: (id: string) => void; onMove: (id: string, state: TaskState) => void;
  canEdit: (task: Task) => boolean; busy: boolean; showProject: boolean;
  onCreate?: (state: TaskState) => void;
}) {
  const [target, setTarget] = useState<string | null>(null);
  return <HStack gap={3} align="stretch" className="task-board" aria-label="상태별 작업 보드">{STATES.filter(state => !states.length || states.includes(state.value)).map(state => {
    const entries = tasks.filter(task => task.state === state.value);
    return <VStack key={state.value} gap={3} className="task-board-column" data-drop-target={target === state.value}
      onDragOver={event => { if (!busy && event.dataTransfer.types.includes('application/gentask-task')) { event.preventDefault(); setTarget(state.value); } }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setTarget(null); }}
      onDragEnd={() => setTarget(null)}
      onDrop={event => {
        event.preventDefault(); setTarget(null);
        const task = tasks.find(task => task.id === event.dataTransfer.getData('application/gentask-task'));
        if (task && canEdit(task) && !busy && task.state !== state.value) onMove(task.id, state.value);
      }}>
      <HStack gap={2} align="center" padding={2}>
        <StatusDot label={state.label} variant={state.value === 'DONE' ? 'success' : state.value === 'IN_PROGRESS' ? 'accent' : 'neutral'} />
        <Heading level={3} accessibilityLevel={2} className="task-board-column-title">{state.label}</Heading><Text type="supporting" color="secondary">{entries.length}</Text>
        {onCreate ? <Button label={`${state.label} 작업 만들기`} icon={<HgiPlus size={16} />} isIconOnly variant="ghost" size="sm" style={{ marginInlineStart: 'auto' }} onClick={() => onCreate(state.value)} /> : null}
      </HStack>
      <VStack gap={2}>{entries.map(task => <TaskBoardCard key={task.id} task={task} showProject={showProject} writable={canEdit(task)} busy={busy} onOpen={() => onOpen(task.id)} onMove={state => onMove(task.id, state)} />)}</VStack>
      {!entries.length ? <VStack padding={3}><Text type="supporting" color="secondary">작업이 없습니다.</Text></VStack> : null}
    </VStack>;
  })}</HStack>;
}
