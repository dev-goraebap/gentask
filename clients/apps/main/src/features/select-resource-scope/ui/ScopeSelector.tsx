import { ProjectAvatar, useWorkspaceStore } from '@/entities/workspace';
import { parseResourceScope } from '@/shared/config';
import { HgiFilter } from '@/shared/ui/icons';
import { HStack, Selector } from '@astryxdesign/core';
import { useLocation, useNavigate, useSearch } from '@tanstack/react-router';

export function ScopeSelector() {
  const { projects, isPending } = useWorkspaceStore();
  const search = parseResourceScope(useSearch({ strict: false }));
  const location = useLocation();
  const navigate = useNavigate();
  const to = location.pathname.startsWith('/artifacts') ? '/artifacts' : location.pathname.startsWith('/tasks') ? '/tasks' : '/notes';
  const artifactScope = to === '/artifacts';
  const value = search.projectId ?? search.scope ?? (artifactScope ? 'personal' : 'all');
  const options = [...(artifactScope ? [] : [{ value: 'all', label: '전체' }]), { value: 'personal', label: '개인' }, ...projects.filter(p => !p.archived).map(p => ({ value: p.id, label: p.name, icon: <HStack aria-hidden="true"><ProjectAvatar project={p} /></HStack> }))];
  return <HStack align="center" gap={2} style={{ flexShrink: 0 }}>
    <HStack aria-hidden="true" align="center" style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}><HgiFilter size={18} /></HStack>
    <Selector label="조회 범위" isLabelHidden size="sm" hasSearch isDisabled={isPending}
    searchPlaceholder="프로젝트 검색" emptySearchText="검색 결과가 없습니다."
    width="12rem" value={value} options={options}
    onChange={next => void navigate({ to, search: next === 'all' ? {} : next === 'personal' ? { scope: 'personal' } : { projectId: next } })} />
  </HStack>;
}
