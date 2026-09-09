import { PageState as EmptyState } from '@/shared/ui/page-state';
import { PageLayout, PageHeader, PageContent } from '@/shared/ui/page-layout';
import { RequestState } from '@/shared/ui/request-state';
import { WIDTH } from '@/shared/config';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useWorkspaceStore } from '@/entities/workspace';

import { useParams } from '@tanstack/react-router';
import { SettingsForm } from './SettingsForm';


export function WorkspaceSettingsPage() {
  const { projectId } = useParams({ strict: false });
  const mobile = useMediaQuery(MOBILE_QUERY);
  const { projects, isPending, error, retry } = useWorkspaceStore();
  const project = projects.find((p) => p.id === projectId);
  if (isPending || error) return <PageLayout padding={0} height="fill" contentWidth={WIDTH.wide}
    header={<PageHeader title="프로젝트 설정" compact={mobile} />}
    content={<PageContent><RequestState error={error} retry={retry} /></PageContent>} />;
  return project && project.role !== 'owner' ? <EmptyState title="프로젝트 설정은 소유자가 관리합니다" /> : project ? <SettingsForm key={project.id} project={project} /> : <EmptyState kind="not-found" title="프로젝트를 찾을 수 없습니다" />;
}
