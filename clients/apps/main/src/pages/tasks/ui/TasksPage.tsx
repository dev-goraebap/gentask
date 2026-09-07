import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, EmptyState, Heading, HStack, LayoutFooter, LayoutHeader, List, Text, TextInput, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useWorkspaceStore } from '@/entities/workspace';
import { PageLayout, PageContent } from '@/shared/ui/page-layout';
import { AppAsideContent, useAppAside } from '@/shared/ui/app-aside';
import { RequestState } from '@/shared/ui/request-state';
import { MobilePageHeader, MOBILE_QUERY } from '@/shared/ui/mobile';
import { HgiPlus, HgiTask, HgiSearchEmpty } from '@/shared/ui/icons';
import { TITLE_ROW, TITLE_PAD_TOP, WIDTH } from '@/shared/config';
import { addTask, changeTaskState, tasksOptions, type Task } from '../api/tasks';
import { DEFAULT_FILTERS, filterTasks } from '../model/filters';
import { useTaskAction } from '../model/useTaskAction';
import { TaskRow } from './TaskRow';
import { TaskBoard } from './TaskBoard';
import { TaskDetail } from './TaskDetail';
import { TaskFilters } from './TaskFilters';

export function TasksPage({ projectId }: { projectId: string | null }) {
  const query = useQuery(tasksOptions(projectId));
  const action = useTaskAction();
  const aside = useAppAside();
  const { projects } = useWorkspaceStore();
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState<string | null>(null);
  const mobile = useMediaQuery(MOBILE_QUERY);
  const writable = (id: string | null) => id === null || ['owner', 'editor'].includes(projects.find(p => p.id === id)?.role ?? '');
  const canEdit = (task: Task) => writable(task.projectId);
  const panelKey = 'task-detail:' + (projectId ?? 'personal');
  const open = (id: string) => { setSelected(id); aside.open({ key: panelKey, title: '작업 상세' }); };
  const add = () => {
    if (!draft.trim() || action.isPending) return;
    action.mutate(async () => {
      await addTask(projectId, draft.trim());
      setDraft('');
      setSearch('');
      setFilters(DEFAULT_FILTERS);
    });
  };
  const tasks = filterTasks(query.data ?? [], search, filters);
  const filtered = Boolean(search.trim()) || filters.state !== 'ALL';
  return <>
    <PageLayout padding={0} height="fill" contentWidth={WIDTH.wide}
      header={<>
        {mobile ? projectId === null ? <MobilePageHeader title="작업" /> : null : <LayoutHeader hasDivider>
          <VStack gap={2}>
            <HStack justify="between" align="center" width="100%" height={TITLE_ROW} paddingBlockStart={TITLE_PAD_TOP} paddingInline={4} gap={3}>
              <Heading level={1}>작업</Heading>
              <Text type="supporting">미완료 {(query.data ?? []).filter(task => task.state !== 'DONE').length}</Text>
            </HStack>
            <VStack paddingInline={4}><Text color="secondary">{projectId ? '프로젝트의 작업을 함께 관리하세요.' : '개인 작업과 나에게 할당된 프로젝트 작업을 한곳에서 관리하세요.'}</Text></VStack>
          </VStack>
        </LayoutHeader>}
        <TaskFilters mobile={mobile} query={search} onQueryChange={setSearch} filters={filters} onChange={setFilters} view={view} onViewChange={setView} />
      </>}
      footer={writable(projectId) ? <LayoutFooter hasDivider padding={mobile ? 3 : 4} label="작업 추가">
        <VStack gap={2}>
          {action.error ? <Text role="alert">{action.error.message}</Text> : null}
          <HStack gap={2} align="center" width="100%">
            <TextInput label="새 작업" isLabelHidden value={draft} onChange={setDraft} onEnter={add} placeholder="할 일을 입력하고 Enter" startIcon={<HgiPlus />} width="100%" isReadOnly={action.isPending} />
            <Button label="추가" variant="primary" onClick={add} isLoading={action.isPending} isDisabled={!draft.trim()} />
          </HStack>
        </VStack>
      </LayoutFooter> : undefined}>
      <PageContent padding={mobile ? 3 : 4} contentWidth={view === 'board' ? '100%' : undefined}>
        <VStack gap={3}>
          {query.isPending || query.error ? <RequestState error={query.error} retry={() => void query.refetch()} /> : tasks.length ? <>
            <Text type="supporting">{filtered ? '검색 결과' : '전체 작업'} · {tasks.length}</Text>
            {view === 'board' ? <TaskBoard tasks={tasks} onOpen={open} canEdit={canEdit} busy={action.isPending} showProject={projectId === null} onMove={(id, state) => action.mutate(() => changeTaskState(id, state))} /> :
              <List hasDividers density="balanced" style={{ marginInline: 'calc(-1 * var(--spacing-2))' }}>
                {tasks.map(task => <TaskRow key={task.id} task={task} showProject={projectId === null} selected={aside.active?.key === panelKey && task.id === selected} onOpen={() => open(task.id)} />)}
              </List>}
          </> : <EmptyState icon={filtered ? <HgiSearchEmpty /> : <HgiTask />} title={filtered ? '조건에 맞는 작업이 없습니다' : '아직 작업이 없습니다'}
            description={filtered ? '검색어나 필터를 바꿔 보세요.' : writable(projectId) ? '아래 입력창에서 첫 작업을 추가하세요.' : '프로젝트에 추가된 작업이 여기에 표시됩니다.'}
            actions={filtered ? <Button label="초기화" onClick={() => { setSearch(''); setFilters(DEFAULT_FILTERS); }} /> : undefined} />}
        </VStack>
      </PageContent>
    </PageLayout>
    <AppAsideContent panelKey={panelKey}>{selected ? <TaskDetail key={selected} id={selected} onDeleted={() => { aside.close(); setSelected(null); }} /> : null}</AppAsideContent>
  </>;
}
