import { WIDTH } from '@/shared/config';
import { PageContent, PageLayout, PageHeader } from '@/shared/ui/page-layout';
import { EmptyState } from '@astryxdesign/core';
export function TasksComingSoonPage() {
  return <PageLayout padding={0} contentWidth={WIDTH.wide}
    header={<PageHeader title="작업" />}
    content={<PageContent><EmptyState title="작업은 준비 중입니다" description="해야 할 일을 정리하고 관련 아티팩트를 연결할 공간입니다." /></PageContent>} />;
}
