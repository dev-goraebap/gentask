import { WIDTH } from '@/shared/config';
import { PageContent, PageLayout } from '@/shared/ui/page-layout';
import { EmptyState, Heading, LayoutHeader } from '@astryxdesign/core';
export function PersonalArtifactsPage() {
  return <PageLayout padding={0} contentWidth={WIDTH.wide}
    header={<LayoutHeader hasDivider padding={4}><Heading level={1}>개인 아티팩트</Heading></LayoutHeader>}
    content={<PageContent><EmptyState title="개인 아티팩트는 준비 중입니다" description="나만 보는 문서와 산출물을 관리할 공간입니다. 프로젝트 아티팩트는 해당 프로젝트에서 이용할 수 있습니다." /></PageContent>} />;
}
