import { WIDTH } from '@/shared/config';
import { PageContent, PageLayout } from '@/shared/ui/page-layout';
import { EmptyState, Heading, LayoutHeader } from '@astryxdesign/core';
export function TasksComingSoonPage() {
  return <PageLayout padding={0} contentWidth={WIDTH.wide}
    header={<LayoutHeader hasDivider padding={4}><Heading level={1}>작업</Heading></LayoutHeader>}
    content={<PageContent><EmptyState title="작업은 준비 중입니다" description="해야 할 일을 정리하고 관련 아티팩트를 연결할 공간입니다." /></PageContent>} />;
}
