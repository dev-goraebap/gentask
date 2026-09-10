import { Suspense, useRef, useState, type ComponentProps } from 'react';
import { Button, DateInput, HStack, Selector, Text, TextArea, VStack } from '@astryxdesign/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBlocker, useNavigate } from '@tanstack/react-router';
import { membersOptions, useWorkspaceStore } from '@/entities/workspace';
import { WIDTH } from '@/shared/config';
import { PageContent, PageHeader, PageLayout } from '@/shared/ui/page-layout';
import { LazyDocumentEditor } from '@/shared/ui/lazy-document-editor';
import { HgiCalendar, HgiTask, HgiUser } from '@/shared/ui/icons';
import { addTask, STATES, uploadTaskFile, type TaskState } from '../api/tasks';
import { TaskDraftFiles } from './TaskDraftFiles';
import './task-detail.css';
import { localDate } from '../model/taskDates';

export function TaskCreate({ projectId, initialState }: { projectId: string | null; initialState: TaskState }) {
  const { projects } = useWorkspaceStore();
  const project = projects.find(item => item.id === projectId);
  const writable = !projectId || (!!project && ['owner', 'editor'].includes(project.role ?? ''));
  const members = useQuery({ ...membersOptions(projectId ?? ''), enabled: !!projectId });
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [state, setState] = useState(initialState);
  const [assignee, setAssignee] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string | null>(localDate());
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState('');
  const created = useRef<string | null>(null);
  const uploaded = useRef(new Set<File>());
  const leaving = useRef(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  const scope = projectId ? { projectId } : { scope: 'personal' as const };
  const mutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !writable) throw new Error('제목과 생성 권한을 확인해 주세요.');
      setStage('작업 저장 중…');
      const id = created.current ?? await addTask({projectId, title: title.trim(), note, state, scheduledDate, dueDate, assigneeId: assignee || null});
      created.current = id;
      for (const file of files) {
        if (uploaded.current.has(file)) continue;
        setStage(`${file.name} 업로드 중…`);
        await uploadTaskFile(id, file);
        uploaded.current.add(file);
      }
      return id;
    },
    onSuccess: async id => {
      await client.invalidateQueries({ queryKey: ['tasks'] });
      leaving.current = true;
      await navigate({ to: '/tasks/$taskId', params: { taskId: id }, search: scope, replace: true });
    },
    onSettled: () => setStage(''),
  });
  const dirty = !!title || !!note || files.length > 0 || !!dueDate || !!assignee || state !== initialState;
  useBlocker({ shouldBlockFn: () => !leaving.current && (mutation.isPending || (dirty && !window.confirm(created.current ? '작업은 생성되었지만 일부 저장이 끝나지 않았습니다. 이동할까요?' : '작성 중인 내용을 버리고 이동할까요?'))), enableBeforeUnload: dirty && !leaving.current });
  const disabled = mutation.isPending || !writable || !!created.current;
  return <PageLayout padding={0} height="fill" contentWidth={WIDTH.wide}
    header={<PageHeader title="새 작업" onBack={() => { void navigate({ to: '/tasks', search: scope }); }} backLabel="작업 목록으로"
      actions={<Button label={created.current ? '저장 다시 시도' : '작업 만들기'} size="sm" isLoading={mutation.isPending} isDisabled={mutation.isPending || !writable || !title.trim()} onClick={() => mutation.mutate()} />} />}>
    <PageContent><VStack className="task-detail-grid" gap={0}>
      <VStack className="task-detail-body" gap={4}>
        <TextArea className="task-document-field task-document-title" label="제목" isLabelHidden rows={2} placeholder="작업 제목" value={title} onChange={setTitle} isDisabled={disabled} />
        <Suspense fallback={<Text>편집기를 불러오는 중…</Text>}><LazyDocumentEditor initialMarkdown="" label="작업 설명" disabled={disabled} onChange={value => setNote(value.markdown)} /></Suspense>
        {stage ? <Text role="status" type="supporting">{stage}</Text> : null}
        {mutation.error ? <VStack gap={1}><Text role="alert">{mutation.error.message}</Text>{created.current ? <Text type="supporting">작업은 생성되었습니다. 다시 시도하면 같은 작업에 나머지를 저장합니다.</Text> : null}</VStack> : null}
        {!writable ? <Text role="alert">이 프로젝트에 작업을 만들 권한이 없습니다.</Text> : null}
        <TaskDraftFiles files={files} onChange={setFiles} disabled={disabled || !!created.current} />
      </VStack>
      <VStack className="task-detail-meta" gap={5}>
        <VStack gap={2}><Text type="supporting" color="secondary" weight="medium">속성</Text>
          <Selector label="상태" isLabelHidden size="sm" variant="ghost" startIcon={<HgiTask size={16} />} options={STATES} value={state} onChange={value => setState(value as TaskState)} isDisabled={disabled} />
          {projectId ? <Selector label="담당자" isLabelHidden size="sm" variant="ghost" startIcon={<HgiUser size={16} />} value={assignee} onChange={setAssignee} hasSearch options={[{ value: '', label: '담당자 미지정' }, ...(members.data ?? []).map(member => ({ value: member.id, label: member.name }))]} isLoading={members.isPending} isDisabled={disabled || !!members.error} /> : null}
          {members.error ? <Text role="alert">{members.error.message}</Text> : null}
          <HStack className="task-due-date" gap={2} align="center"><HgiCalendar size={16} /><Text type="supporting" color="secondary">예정</Text><DateInput label="예정일" isLabelHidden size="sm" hasClear placeholder="예정일 선택" value={(scheduledDate ?? undefined) as ComponentProps<typeof DateInput>['value']} onChange={value => setScheduledDate(value ?? null)} isDisabled={disabled} /></HStack>
          <HStack className="task-due-date" gap={2} align="center"><HgiCalendar size={16} /><Text type="supporting" color="secondary">마감</Text><DateInput label="마감일" isLabelHidden size="sm" hasClear placeholder="마감일 선택" value={(dueDate ?? undefined) as ComponentProps<typeof DateInput>['value']} onChange={value => setDueDate(value ?? null)} isDisabled={disabled} /></HStack>
        </VStack>
        <VStack gap={1}><Text type="supporting" color="secondary" weight="medium">프로젝트</Text><Text size="sm">{projectId ? project?.name ?? '프로젝트' : '개인 작업'}</Text></VStack>
      </VStack>
    </VStack></PageContent>
  </PageLayout>;
}
