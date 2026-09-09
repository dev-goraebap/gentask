import { useSession } from '@/entities/session';
import { UserAvatar } from '@/shared/ui/user-avatar';
import { useState } from 'react';
import { HgiArtifacts, HgiFolder, HgiTask, HgiUser, HgiNote } from '@/shared/ui/icons';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import { AppShell, Button, HStack, Layout, SideNav, SideNavItem, Text, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { Outlet, useLocation, useNavigate, useSearch } from '@tanstack/react-router';
import { ThemeToggle } from '@/shared/ui/theme';
import { BrandMark } from '@/shared/ui/brand';
import { parseResourceScope } from '@/shared/config';
import { useViewportHeight } from './useViewportHeight';

export function AppShellLayout() {
  const { data: me } = useSession();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const viewportHeight = useViewportHeight(mobile);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const path = useLocation({ select: location => location.pathname });
  const search = parseResourceScope(useSearch({ strict: false }));
  const menu = [
    { label: '메모', icon: <HgiNote />, path: '/notes' },
    { label: '작업', icon: <HgiTask />, path: '/tasks' },
    { label: '아티팩트', icon: <HgiArtifacts />, path: '/artifacts' },
    { label: '프로젝트', icon: <HgiFolder />, path: '/projects' },
    { label: '계정', icon: <HgiUser />, path: '/me' },
  ] as const;
  return <AppShell mobileNav={{ hasToggle: false, breakpoint: 'lg', isOpen: menuOpen, onOpenChange: setMenuOpen }} height="fill" style={viewportHeight ? { height: viewportHeight, maxHeight: viewportHeight } : undefined} variant="section" contentPadding={0}
    sideNav={<SideNav style={mobile ? undefined : { width: '16.25rem' }}
      header={<HStack gap={2} align="center"><BrandMark size={36} /><Text className="app-logo" size="lg">Gentask</Text></HStack>}
      footer={<HStack justify="between" align="center"><Button label="계정" icon={<UserAvatar userId={me?.id} name={me?.nickname} src={me?.profileImageUrl ?? undefined} size="sm" tooltip={false} />} variant="secondary" onClick={() => { setMenuOpen(false); void navigate({ to: '/me', search }); }} /><ThemeToggle /></HStack>}>
      <VStack gap={0}>{menu.slice(0, 4).map(m => <SideNavItem key={m.path} label={m.label} icon={m.icon} isSelected={path.startsWith(m.path)} onClick={() => { setMenuOpen(false); void navigate({ to: m.path, search }); }} />)}</VStack>
    </SideNav>}>
    <Layout padding={0} content={<Outlet />} />
  </AppShell>;
}
