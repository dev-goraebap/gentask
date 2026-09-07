import { useState } from 'react';
import { HStack, VStack, Heading, Text, List, StatusDot } from '@astryxdesign/core';
import { type Task, type TaskState, STATES } from '../api/tasks';
import { TaskRow } from './TaskRow';
export function TaskBoard({ tasks, onOpen, onMove, canEdit, busy, showProject }: {
  tasks: Task[]; onOpen: (id: string) => void; onMove: (id: string, state: TaskState) => void;
  canEdit: (task: Task) => boolean; busy: boolean; showProject: boolean;
}) {
  const [target, setTarget] = useState<string | null>(null);
  return <HStack gap={4} align="stretch" style={{ overflowX: 'auto' }}>{STATES.map(state => {
    const entries = tasks.filter(task => task.state === state.value);
    return <VStack key={state.value} gap={2} style={{ flex: '1 0 260px', minWidth: 0, minHeight: 240, background: target === state.value ? 'var(--color-background-muted)' : undefined, borderRadius: 'var(--radius-container)' }}
      onDragOver={event => { if (!busy && event.dataTransfer.types.includes('application/gentask-task')) { event.preventDefault(); setTarget(state.value); } }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setTarget(null); }}
      onDrop={event => {
        event.preventDefault(); setTarget(null);
        const task = tasks.find(task => task.id === event.dataTransfer.getData('application/gentask-task'));
        if (task && canEdit(task) && !busy && task.state !== state.value) onMove(task.id, state.value);
      }}>
      <HStack gap={2} align="center" paddingBlock={2} style={{ borderBottom: 'var(--border-width) solid var(--color-border)' }}>
        <StatusDot label={state.label} variant={state.value === 'DONE' ? 'success' : state.value === 'IN_PROGRESS' ? 'accent' : 'neutral'} />
        <Heading level={3} accessibilityLevel={2}>{state.label}</Heading><Text type="supporting">{entries.length}</Text>
      </HStack>
      <List hasDividers density="balanced">{entries.map(task => <TaskRow key={task.id} task={task} showProject={showProject} showState={false} draggable={canEdit(task) && !busy} onOpen={() => onOpen(task.id)} />)}</List>
      {!entries.length ? <VStack padding={3}><Text type="supporting">작업이 없습니다.</Text></VStack> : null}
    </VStack>;
  })}</HStack>;
}
