import { PageState as EmptyState } from '@/shared/ui/page-state';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, HStack, LayoutFooter, List, Selector, Text, TextInput, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useWorkspaceStore } from '@/entities/workspace';
import { PageLayout, PageContent, PageHeader } from '@/shared/ui/page-layout';
import { useNavigate } from '@tanstack/react-router';
import { RequestState } from '@/shared/ui/request-state';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import { HgiPlus, HgiTask, HgiSearchEmpty } from '@/shared/ui/icons';
import { WIDTH } from '@/shared/config';
import { addTask, changeTaskState, tasksOptions, type Task } from '../api/tasks';
import { DEFAULT_FILTERS, filterTasks } from '../model/filters';
import { useTaskAction } from '../model/useTaskAction';
import { TaskRow } from './TaskRow';
import { TaskBoard } from './TaskBoard';
import { TaskFilters } from './TaskFilters';

export function TaskList({ projectId, personal = false }: { projectId: string | null; personal?: boolean }) {
  const query = useQuery(tasksOptions(projectId, personal));
  const action = useTaskAction();
  const navigate = useNavigate();
  const { projects } = useWorkspaceStore();
  const [destination, setDestination] = useState(projectId);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [view, setView] = useState('list');
  const mobile = useMediaQuery(MOBILE_QUERY);
  const writable = (id: string | null) => id === null || ['owner', 'editor'].includes(projects.find(p => p.id === id)?.role ?? '');
  const canEdit = (task: Task) => writable(task.projectId);
  const open = (id: string) => { void navigate({ to: '/tasks/$taskId', params: { taskId: id }, search: projectId ? { projectId } : personal ? { scope: 'personal' } : {} }); };
  const add = () => {
    if (!draft.trim() || action.isPending) return;
    action.mutate(async () => {
      await addTask(destination, draft.trim());
      setDraft('');
      setSearch('');
      setFilters(DEFAULT_FILTERS);
    });
  };
  const tasks = filterTasks(query.data ?? [], search, filters);
  const filtered = Boolean(search.trim()) || filters.states.length > 0;
  return <>
    <PageLayout padding={0} height="fill" contentWidth={WIDTH.wide}
      header={<PageHeader title="작업" compact={mobile}
        toolbar={<TaskFilters mobile={mobile} query={search} onQueryChange={setSearch} filters={filters} onChange={setFilters} view={view} onViewChange={setView} />} />}
      footer={writable(projectId) ? <LayoutFooter hasDivider padding={mobile ? 3 : 4} label="작업 추가" style={mobile ? { paddingBottom: 'calc(var(--spacing-3) + env(safe-area-inset-bottom))' } : undefined}>
        <VStack gap={2}>{!projectId && !personal ? <Selector label="새 작업 소속" size="sm" width="18rem" value={destination ?? 'personal'}
          options={[{ value: 'personal', label: '개인' }, ...projects.filter(p => !p.archived && writable(p.id)).map(p => ({ value: p.id, label: p.name }))]}
          onChange={value => setDestination(value === 'personal' ? null : String(value))} /> : <Text type="supporting">추가 위치 · {projectId ? projects.find(p => p.id === projectId)?.name : '개인'}</Text>}
          {action.error ? <Text role="alert">{action.error.message}</Text> : null}
          <HStack gap={2} align="center" width="100%">
            <TextInput label="새 작업" isLabelHidden value={draft} onChange={setDraft} onEnter={add} placeholder="할 일을 입력하고 Enter" startIcon={<HgiPlus />} width="100%" isReadOnly={action.isPending} />
            <Button label="추가" variant="primary" onClick={add} isLoading={action.isPending} isDisabled={!draft.trim()} />
          </HStack>
        </VStack>
      </LayoutFooter> : undefined}>
      <PageContent padding={mobile ? 3 : 4} contentWidth={view === 'board' ? '100%' : undefined}>
        <VStack gap={3}>
          {query.isRefetchError ? <RequestState error={query.error} retry={() => void query.refetch()} /> : null}
          {query.isPending || (query.error && !query.data) ? <RequestState error={query.error} retry={() => void query.refetch()} /> : tasks.length ? <>
            <Text type="supporting">{filtered ? '검색 결과' : '전체 작업'} · {tasks.length}</Text>
            {view === 'board' ? <TaskBoard tasks={tasks} onOpen={open} canEdit={canEdit} busy={action.isPending} showProject={projectId === null} onMove={(id, state) => action.mutate(() => changeTaskState(id, state))} /> :
              <List hasDividers density="balanced" style={{ marginInline: 'calc(-1 * var(--spacing-2))' }}>
                {tasks.map(task => <TaskRow key={task.id} task={task} showProject={projectId === null} selected={false} onOpen={() => open(task.id)} />)}
              </List>}
          </> : <EmptyState kind={filtered ? 'search' : 'empty'} title={filtered ? '조건에 맞는 작업이 없습니다' : '아직 작업이 없습니다'}
            description={filtered ? '검색어나 필터를 바꿔 보세요.' : writable(projectId) ? '아래 입력창에서 첫 작업을 추가하세요.' : '프로젝트에 추가된 작업이 여기에 표시됩니다.'}
            actions={filtered ? <Button label="초기화" onClick={() => { setSearch(''); setFilters(DEFAULT_FILTERS); }} /> : undefined} />}
        </VStack>
      </PageContent>
    </PageLayout>
  </>;
}
