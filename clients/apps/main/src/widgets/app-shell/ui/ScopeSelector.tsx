import { ProjectAvatar, useWorkspaceStore } from '@/entities/workspace';
import { useSession } from '@/entities/session';
import { UserAvatar } from '@/shared/ui/user-avatar';
import { parseResourceScope } from '@/shared/config';
import { HStack, Selector } from '@astryxdesign/core';
import { useLocation, useNavigate, useSearch } from '@tanstack/react-router';

export function ScopeSelector() {
  const { projects, isPending } = useWorkspaceStore();
  const { data: me } = useSession();
  const search = parseResourceScope(useSearch({ strict: false }));
  const location = useLocation();
  const navigate = useNavigate();
  const to = location.pathname.startsWith('/artifacts') ? '/artifacts' : location.pathname.startsWith('/tasks') ? '/tasks' : location.pathname.startsWith('/notes') ? '/notes' : location.pathname;
  const options = [{ value: 'personal', label: '개인', icon: <HStack aria-hidden="true" align="center"><UserAvatar userId={me?.id} name={me?.nickname} src={me?.profileImageUrl ?? undefined} size="sm" tooltip={false} /></HStack> },
    ...projects.filter(p => !p.archived).map(p => ({ value: p.id, label: p.name, icon: <HStack aria-hidden="true" align="center"><ProjectAvatar project={p} size="sm" /></HStack> }))];
  return <Selector label="공통 조회 범위" isLabelHidden size="md" hasSearch isDisabled={isPending}
    searchPlaceholder="프로젝트 검색" emptySearchText="검색 결과가 없습니다."
    width="100%" value={search.projectId ?? 'personal'} options={options}
    onChange={next => void navigate({ to, search: next === 'personal' ? { scope: 'personal' } : { projectId: next } })} />;
}
