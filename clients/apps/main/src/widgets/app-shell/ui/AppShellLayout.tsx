import { ProjectAvatar, useWorkspaceStore } from '@/entities/workspace';
import { CreateProjectDialog } from '@/features/create-project';
import { HgiArrowLeft, HgiBook, HgiFolder, HgiLayers, HgiMembers, HgiNote, HgiSettings, HgiUser } from '@/shared/ui/icons';
import { MOBILE_QUERY, MobilePageHeader } from '@/shared/ui/mobile';
import { AppShell, Button, EmptyState, HStack, Layout, LayoutFooter, SideNav, SideNavItem, Text, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { Outlet, useMatchRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { ThemeToggle } from '@/shared/ui/theme';
import { ProjectNavigation } from './ProjectNavigation';

export function AppShellLayout() {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [creating, setCreating] = useState(false);
  const { projects } = useWorkspaceStore();
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const { projectId } = useParams({ strict: false });
  const project = projects.find((p) => p.id === projectId);
  const menu = [
    { label: '이슈', icon: <HgiLayers />, path: '/projects/$projectId/issues' as const },
    { label: '문서', icon: <HgiBook />, path: '/projects/$projectId/docs' as const },
    { label: '멤버', icon: <HgiMembers />, path: '/projects/$projectId/members' as const },
    { label: '설정', icon: <HgiSettings />, path: '/projects/$projectId/settings' as const },
  ];
  const inDrawer = Boolean(matchRoute({ to: '/drawer' }));
  const basicMenu = [{ label: '서랍', icon: <HgiNote />, path: '/drawer' as const }, { label: '프로젝트', icon: <HgiFolder />, path: '/projects' as const }, { label: '내 정보', icon: <HgiUser />, path: '/me' as const }];
  const selected = menu.find((m) => matchRoute({ to: m.path, fuzzy: true }));
  const missing = Boolean(projectId && !project);
  const archived = project?.archived && selected?.path !== '/projects/$projectId/settings';
  const mobileDetail = mobile && Boolean(project) && !archived && Boolean(
    matchRoute({ to: '/projects/$projectId/issues/$itemId' }) ||
    matchRoute({ to: '/projects/$projectId/docs/$docId' }),
  );
  return <>
    <AppShell mobileNav={false} height="fill" variant="section" contentPadding={0}
      sideNav={mobile ? undefined : <SideNav
        header={<HStack gap={2} align="center"><img src="/icon-192.png" alt="" width={28} height={28} /><Text className="app-logo" size="lg">Gentask</Text></HStack>}
        topContent={project ? <SideNavItem label="전체 메뉴로" icon={<HgiArrowLeft />} onClick={() => navigate({ to: '/drawer' })} /> : undefined}
        footer={<HStack justify="between" align="center"><Button label="내 정보" icon={<HgiUser />} variant="ghost" onClick={() => navigate({ to: '/me' })} /><ThemeToggle /></HStack>}>
        {project ? <VStack gap={2} paddingBlockStart={4}>
          <HStack gap={2} align="center"><ProjectAvatar project={project} /><Text weight="semibold" style={{ overflowWrap: 'anywhere' }}>{project.name}</Text></HStack>
          {menu.map((m) => <SideNavItem key={m.path} label={m.label} icon={m.icon}
            isSelected={selected?.path === m.path} onClick={() => navigate({ to: m.path, params: { projectId: project.id }, search: {} })} />)}
        </VStack> : <VStack gap={1}>
          <SideNavItem label="서랍" icon={<HgiNote />} isSelected={inDrawer} onClick={() => navigate({ to: '/drawer' })} />
          <ProjectNavigation onCreate={() => setCreating(true)} onOpen={(id, archived) => navigate({ to: archived ? '/projects/$projectId/settings' : '/projects/$projectId/issues', params: { projectId: id }, search: {} })} />
        </VStack>}
      </SideNav>}>
      <Layout padding={0} style={mobileDetail ? { paddingBottom: 'env(safe-area-inset-bottom)', boxSizing: 'border-box' } : undefined} header={mobile && project && !mobileDetail ? <MobilePageHeader title={project.name} backLabel="프로젝트 목록으로" onBack={() => navigate({ to: '/projects' })} /> : undefined}
        content={missing ? <EmptyState title="프로젝트를 찾을 수 없습니다" actions={<Button label="프로젝트 목록으로" onClick={() => navigate({ to: '/projects' })} />} /> :
          archived ? <EmptyState title="보관된 프로젝트입니다" description="프로젝트 설정에서 복원하면 다시 작업할 수 있습니다."
            actions={<Button label="프로젝트 설정" onClick={() => navigate({ to: '/projects/$projectId/settings', params: { projectId: project!.id } })} />} /> : <Outlet />}
        footer={mobile && !mobileDetail ? <LayoutFooter padding={0} hasDivider><HStack as="nav" aria-label={project ? "프로젝트 메뉴" : "기본 메뉴"} gap={0}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(var(--mobile-nav-height) + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
          {(project ? menu : basicMenu).map((m) => <Button key={m.path} label={m.label} size="lg" style={{ flex: '1 1 0', minWidth: 0, height: '100%' }} variant={(project ? selected?.path === m.path : Boolean(matchRoute({ to: m.path, fuzzy: true }))) ? 'secondary' : 'ghost'}
            aria-current={(project ? selected?.path === m.path : Boolean(matchRoute({ to: m.path, fuzzy: true }))) ? 'page' : undefined} onClick={() => navigate({ to: m.path, params: project ? { projectId: project.id } : {}, search: {} })}>
            <VStack align="center" gap={0.5}>{m.icon}<Text type="supporting" style={{ color: 'inherit' }}>{m.label}</Text></VStack>
          </Button>)}
        </HStack></LayoutFooter> : undefined} />
    </AppShell>
    {creating ? <CreateProjectDialog onClose={() => setCreating(false)} onCreated={id => navigate({ to: '/projects/$projectId/issues', params: { projectId: id }, search: {} })} /> : null}
  </>;
}
