import { TaskNotes } from './TaskNotes';
import { type Task, STATES, deleteTask, type TaskState } from '../api/tasks';
import { useWorkspaceStore, membersOptions } from '@/entities/workspace';
import { Button, Text, TextArea, DateInput, Selector, VStack } from '@astryxdesign/core';
import { useQuery } from '@tanstack/react-query';
import { useLayoutEffect, useRef, type ComponentProps } from 'react';
import './task-detail.css';
import { useTaskAction } from '../model/useTaskAction';
import { useTaskAutosave } from '../model/useTaskAutosave';
import { TaskArtifacts } from './TaskArtifacts';
import { TaskFiles } from './TaskFiles';

export function TaskForm({ task, onDeleted }: { task: Task; onDeleted: () => void }) {
  const { projects } = useWorkspaceStore();
  const action = useTaskAction(task.id);
  const autosave = useTaskAutosave(task);
  const writable = task.projectId === null || ['owner', 'editor'].includes(projects.find(p => p.id === task.projectId)?.role ?? '');
  const members = useQuery({ ...membersOptions(task.projectId ?? ''), enabled: task.projectId !== null });
  const editor = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const resize = () => editor.current?.querySelectorAll('textarea').forEach(input => {
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight}px`;
    });
    resize();
    let lastWidth = 0;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width !== lastWidth) { lastWidth = width; resize(); }
    });
    if (editor.current) observer.observe(editor.current);
    return () => observer.disconnect();
  }, [autosave.values.title, autosave.values.note]);
  const disabled = !writable || action.isPending;
  return <VStack className="task-detail-grid" gap={0}>
    <VStack ref={editor} className="task-detail-body" gap={4}>
      <Text type="supporting">{task.projectName ?? '개인 작업'}</Text>
      <TextArea className="task-document-field task-document-title" rows={1} label="제목" isLabelHidden placeholder="작업 제목" value={autosave.values.title}
        onChange={(value, event) => autosave.changeText('title', value, (event?.nativeEvent as InputEvent | undefined)?.isComposing)}
        onCompositionEnd={event => { if (event.target instanceof HTMLTextAreaElement) autosave.changeText('title', event.target.value); }} onBlur={() => autosave.flush('title')}
        status={autosave.status('title')} isReadOnly={!writable} isDisabled={action.isPending} />
      <TextArea className="task-document-field task-document-note" label="설명" isLabelHidden placeholder="설명을 입력하세요" value={autosave.values.note}
        onChange={(value, event) => autosave.changeText('note', value, (event?.nativeEvent as InputEvent | undefined)?.isComposing)}
        onCompositionEnd={event => { if (event.target instanceof HTMLTextAreaElement) autosave.changeText('note', event.target.value); }} onBlur={() => autosave.flush('note')}
        status={autosave.status('note')} rows={8} isReadOnly={!writable} isDisabled={action.isPending} />
      {autosave.isPending ? <Text role="status" type="supporting">자동 저장 중…</Text> : null}
      {autosave.hasErrors ? <Button label="다시 시도" variant="secondary" isDisabled={disabled || autosave.isPending} onClick={autosave.retry} /> : null}
      {action.error ? <Text role="alert">{action.error.message}</Text> : null}
      <TaskFiles taskId={task.id} writable={writable} />
    </VStack>
    <VStack className="task-detail-meta" gap={5}>
      <Selector label="상태" isLabelHidden value={autosave.values.state} options={STATES} isDisabled={disabled}
        status={autosave.status('state')} changeAction={state => autosave.change({ field: 'state', value: state as TaskState })} />
      {task.projectId ? <>
        <Selector label="담당자" isLabelHidden placeholder="담당자 미지정" value={autosave.values.assigneeId ?? ''}
          options={[{ value: '', label: '담당자 미지정' }, ...(members.data ?? []).map(member => ({ value: member.id, label: member.name }))]}
          hasSearch isLoading={members.isPending} isDisabled={disabled || !!members.error} status={autosave.status('assigneeId')}
          changeAction={id => autosave.change({ field: 'assigneeId', value: id || null })} />
        {members.error ? <Text role="alert">{members.error.message}</Text> : null}
      </> : null}
      <DateInput label="마감일" isLabelHidden placeholder="마감일 선택"
        value={(autosave.values.dueDate ?? undefined) as ComponentProps<typeof DateInput>['value']}
        changeAction={value => autosave.change({ field: 'dueDate', value: value ?? null })}
        status={autosave.status('dueDate')} hasClear isDisabled={disabled} />
    <TaskArtifacts task={task} writable={writable} />
    <TaskNotes task={task} writable={writable} />
    {writable ? <Button label="작업 삭제" variant="secondary" isDisabled={action.isPending} onClick={() => {
      if (window.confirm('이 작업과 연결된 첨부파일을 삭제할까요?')) {
        autosave.flush('title'); autosave.flush('note');
        action.mutate(async () => { await deleteTask(task.id); onDeleted(); });
      }
    }} /> : null}
    </VStack>
  </VStack>;
}
