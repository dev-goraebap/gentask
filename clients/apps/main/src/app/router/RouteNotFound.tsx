import { Button } from '@astryxdesign/core';
import { useNavigate } from '@tanstack/react-router';
import { PageState } from '@/shared/ui/page-state';
import { PageLayout, PageContent, PageHeader } from '@/shared/ui/page-layout';
import { WIDTH } from '@/shared/config';
export function RouteNotFound() {
  const navigate = useNavigate();
  return <PageLayout padding={0} contentWidth={WIDTH.wide} header={<PageHeader title="페이지를 찾을 수 없습니다" />}
    content={<PageContent><PageState kind="not-found" title="페이지를 찾을 수 없습니다"
      description="주소를 확인하거나 메모 화면으로 이동해 주세요."
      actions={<Button label="메모로 이동" onClick={() => void navigate({ to: '/notes' })} />} /></PageContent>} />;
}
