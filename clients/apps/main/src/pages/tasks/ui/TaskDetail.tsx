import { useQuery } from '@tanstack/react-query';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { PageLayout, PageHeader, PageContent } from '@/shared/ui/page-layout';
import { RequestState } from '@/shared/ui/request-state';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import { WIDTH } from '@/shared/config';
import { taskOptions } from '../api/tasks';
import { TaskForm } from './TaskForm';

export function TaskDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const query = useQuery(taskOptions(id));
  const mobile = useMediaQuery(MOBILE_QUERY);
  return <PageLayout padding={0} height="fill" contentWidth={WIDTH.wide}
    header={<PageHeader title="작업 상세" compact={mobile} onBack={onBack} backLabel="작업 목록으로" />}>
    <PageContent padding={mobile ? 3 : 4}>
      {query.data ? <TaskForm task={query.data} onDeleted={onBack} /> :
        <RequestState error={query.error} retry={() => void query.refetch()} />}
    </PageContent>
  </PageLayout>;
}
