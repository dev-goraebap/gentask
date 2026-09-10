import { ScopePageHeader } from '@/widgets/scope-page-header';

import { useEffect, useState } from 'react';
import { localDate, taskDates } from '../model/taskDates';
import { useQuery } from '@tanstack/react-query';
import { Text, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useWorkspaceStore } from '@/entities/workspace';
import { PageLayout, PageContent } from '@/shared/ui/page-layout';
import { useNavigate } from '@tanstack/react-router';
import { RequestState } from '@/shared/ui/request-state';
import { MOBILE_QUERY } from '@/shared/ui/mobile';


import { changeTaskState, tasksOptions, type Task } from '../api/tasks';
import { DEFAULT_FILTERS, filterTasks } from '../model/filters';
import { useTaskAction } from '../model/useTaskAction';
import './task-board.css';
import { TaskBoard } from './TaskBoard';
import { TaskFilters } from './TaskFilters';

export function TaskList({ projectId, personal = false }: { projectId: string | null; personal?: boolean }) {

  const action = useTaskAction();
  const navigate = useNavigate();
  const { projects } = useWorkspaceStore();


  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [today, setToday] = useState(localDate);
  useEffect(() => { const timer = setInterval(() => setToday(localDate()), 30_000); return () => clearInterval(timer); }, []);
  const query = useQuery(tasksOptions(projectId, personal, taskDates(filters, today)));

  const mobile = useMediaQuery(MOBILE_QUERY);
  const writable = (id: string | null) => id === null || ['owner', 'editor'].includes(projects.find(p => p.id === id)?.role ?? '');
  const canEdit = (task: Task) => writable(task.projectId);
  const open = (id: string) => { void navigate({ to: '/tasks/$taskId', params: { taskId: id }, search: projectId ? { projectId } : personal ? { scope: 'personal' } : {} }); };
  const tasks = filterTasks(query.data ?? [], search, filters);
  const filtered = Boolean(search.trim()) || filters.states.length > 0;
  return <>
    <PageLayout padding={0} height="fill" className="task-board-page"
      header={<ScopePageHeader title="작업" compact={mobile}
        toolbar={<TaskFilters mobile={mobile} query={search} onQueryChange={setSearch} filters={filters} onChange={setFilters} />} />}
>
      <PageContent padding={mobile ? 3 : 4} contentWidth="100%">
        <VStack gap={3}>{action.error ? <Text role="alert">{action.error.message}</Text> : null}
          {query.isRefetchError ? <RequestState error={query.error} retry={() => void query.refetch()} /> : null}
          {query.isPending || (query.error && !query.data) ? <RequestState error={query.error} retry={() => void query.refetch()} /> : <>
            {filtered && !tasks.length ? <Text type="supporting" color="secondary">조건에 맞는 작업이 없습니다. 날짜나 상태 필터를 바꿔보세요.</Text> : null}
            <TaskBoard onCreate={writable(projectId) ? state => { void navigate({ to: '/tasks/new', search: { ...(projectId ? { projectId } : { scope: 'personal' as const }), state } }); } : undefined} tasks={tasks} states={filters.states} onOpen={open} canEdit={canEdit} busy={action.isPending} showProject={projectId === null} onMove={(id, state) => action.mutate(() => changeTaskState(id, state))} />
          </>}
        </VStack>
      </PageContent>
    </PageLayout>
  </>;
}
