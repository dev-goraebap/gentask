import { ProjectAvatar, useWorkspaceStore } from '@/entities/workspace';
import { useSession } from '@/entities/session';
import { parseResourceScope } from '@/shared/config';
import { PageHeader } from '@/shared/ui/page-layout';
import { UserAvatar } from '@/shared/ui/user-avatar';
import { Breadcrumbs, BreadcrumbItem, Heading, HStack, Text } from '@astryxdesign/core';
import { useSearch } from '@tanstack/react-router';
import type { ComponentProps } from 'react';
import './scope-page-header.css';

export function ScopePageHeader(props: ComponentProps<typeof PageHeader>) {
  const { projects } = useWorkspaceStore();
  const { data: me } = useSession();
  const search = parseResourceScope(useSearch({ strict: false }));
  const project = projects.find(item => item.id === search.projectId);
  const name = search.projectId ? project?.name ?? '프로젝트' : '개인';
  return <PageHeader {...props} titleContent={
    <Breadcrumbs label="현재 페이지 경로" separator="/">
      <BreadcrumbItem>
        <HStack gap={1} align="center" style={{ minWidth: 0 }}>
          <HStack className="scope-header-avatar" aria-hidden="true" align="center">
            {project ? <ProjectAvatar project={project} size="sm" /> : !search.projectId ?
              <UserAvatar userId={me?.id} name={me?.nickname} src={me?.profileImageUrl ?? undefined} size="sm" tooltip={false} /> : null}
          </HStack>
          <Text type="label" maxLines={1} style={{ maxWidth: 'clamp(4rem, 18vw, 16rem)' }}>{name}</Text>
        </HStack>
      </BreadcrumbItem>
      <BreadcrumbItem isCurrent>
        <Heading level={3} accessibilityLevel={1} maxLines={1} style={{ fontSize: '1rem', lineHeight: 1.5 }}>{props.title}</Heading>
      </BreadcrumbItem>
    </Breadcrumbs>
  } />;
}
