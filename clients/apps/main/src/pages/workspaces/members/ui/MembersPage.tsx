import { PageLayout, PageContent, PageHeader } from '@/shared/ui/page-layout';
import { MobileFilterBar, MobileFilterButton } from '@/shared/ui/mobile';
import { useSession } from '@/entities/session';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RequestState } from '@/shared/ui/request-state';
import { membersOptions, invitationsOptions, createInvitation, changeMemberRole, removeMember, revokeInvitation } from '@/entities/workspace';
import { ROLE_LABEL, useWorkspaceStore, type Invitation, type ProjectMember } from '@/entities/workspace';
import { WIDTH } from '@/shared/config';
import { HgiMembers, HgiPlus, HgiSearch, HgiTrash } from '@/shared/ui/icons';
import { ListingFooter, PageSize, SortSelector, SortFields, useListing } from '@/shared/ui/listing';
import { MobileSurface } from '@/shared/ui/mobile';
import {
    Avatar, Button, CheckboxList, CheckboxListItem, MultiSelector, Dialog, DialogHeader, EmptyState,
    HStack,
    Item,
    Layout, LayoutContent,
    LayoutFooter,
    List, Selector,
    Tab, TabList,
    Text, TextInput,
    Token, Toolbar, VStack, useToast,
} from '@astryxdesign/core';
import { Table, pixel, proportional, type TableColumn } from '@astryxdesign/core/Table';
import { useEffect, useState } from 'react';

import { ROLE_OPTIONS, type MemberRow, type MembersProps } from './members';

const sortOptions = [{ value: 'title', label: '이름 순' }, { value: 'role', label: '역할 순' }];

export function MembersPage({ projectId, onPreview }: MembersProps) {
  const { projects, isPending: projectsPending, error: projectsError, retry: retryProjects } = useWorkspaceStore();
  const session = useSession();
  const client = useQueryClient();
  const memberQuery = useQuery(membersOptions(projectId));
  const members = memberQuery.data ?? [];
  const canManage = members.some(m => m.id === session.data?.id && m.role === 'owner');
  const invitationQuery = useQuery({ ...invitationsOptions(projectId), enabled: canManage });
  const invitations = invitationQuery.data ?? [];
  const mutation = useMutation({ mutationFn: (work: () => Promise<unknown>) => work(), onSuccess: async () => {
    await Promise.all([client.invalidateQueries({ queryKey: ['project-members', projectId] }), client.invalidateQueries({ queryKey: ['project-invitations', projectId] })]);
  } });
  const toast = useToast();
  const listing = useListing(`members:${projectId}`);
  const { query, filter: roleFilter, mobile } = listing;
  const setQuery = (query: string) => listing.change({ query });
  const roles = roleFilter === 'all' ? [] : roleFilter.split(',');
  const setRoles = (values: string[]) => listing.change({ filter: values.join(',') || 'all' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState({ filter: roleFilter, size: listing.size, sort: listing.sort, direction: listing.direction });
  const [selectedMember, setSelectedMember] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [inviteTab, setInviteTab] = useState('new');
  const [label, setLabel] = useState('');
  const [role, setRole] = useState<Invitation['role']>('viewer');
  const [days, setDays] = useState('7');
  const [createdId, setCreatedId] = useState<string>();
  const [removing, setRemoving] = useState<ProjectMember>();
  const [revoking, setRevoking] = useState<Invitation>();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const project = projects.find((p) => p.id === projectId);
  const projectMembers = members.filter((m) => m.projectId === projectId);
  const projectInvites = invitations.filter((i) => i.projectId === projectId);

  const matched = projectMembers.filter((m) =>
    m.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
    (!roles.length || roles.includes(m.role)),
  ).sort((a, b) => (listing.direction === 'asc' ? 1 : -1) * (listing.sort === 'role' ? Object.keys(ROLE_LABEL).indexOf(a.role) - Object.keys(ROLE_LABEL).indexOf(b.role) : a.name.localeCompare(b.name, 'ko')) || a.id.localeCompare(b.id));
  const created = projectInvites.find((i) => i.id === createdId);
  const page = Math.min(listing.page, Math.max(1, Math.ceil(matched.length / listing.size)));
  const visibleMembers = matched.slice(listing.range(matched.length).start, listing.range(matched.length).end);
  const selected = projectMembers.find((m) => m.id === selectedMember);
  useEffect(() => { if (page !== listing.page) listing.change({ page }); }, [page, listing.page]);

  const isActive = (invite: Invitation) => !invite.revoked && invite.expiresAt > now;
  const urlFor = (id: string) => `${window.location.origin}/invitations/${projectInvites.find(i => i.id === id)?.token ?? ''}`;
  const copy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(urlFor(id));
      toast({ body: '초대 링크를 복사했습니다.' });
    } catch {
      toast({ type: 'error', body: '복사하지 못했습니다. 링크를 선택해 직접 복사해 주세요.' });
      setCreatedId(id);
      setInviteTab('new');
      setCreating(true);
    }
  };
  const create = () => {
    if (!canManage || !label.trim() || mutation.isPending) return;
    mutation.mutate(async () => { const result = await createInvitation(projectId, { label: label.trim(), role, days: Number(days) }); setCreatedId(result.id); });
  };
  const changeRole = (member: ProjectMember, next: string) => {
    if (!canManage || member.role === 'owner' || mutation.isPending) return;
    mutation.mutate(() => changeMemberRole(projectId, member.id, next));
  };
  const columns: TableColumn<MemberRow>[] = [
    {
      key: 'name', header: '멤버', width: proportional(2),
      renderCell: (member) => <HStack gap={2} align="center">
        <Avatar src={member.profileImageUrl} name={member.name} size="sm" />
        <HStack gap={1} wrap="wrap" align="center">
          <Text weight="semibold">{member.name}</Text>
          {member.id === session.data?.id ? <Text type="supporting">나</Text> : null}
          {member.isGuest ? <Token label="게스트" size="sm" color="orange" /> : null}
        </HStack>
      </HStack>,
    },
    {
      key: 'role', header: '역할', width: pixel(180),
      renderCell: (member) => member.role === 'owner'
        ? <Token label="소유자" color="purple" size="sm" />
        : <Selector label={`${member.name} 역할`} isLabelHidden size="sm" variant="ghost" width="100%" value={member.role}
            options={ROLE_OPTIONS} isDisabled={!canManage || mutation.isPending} onChange={(next) => changeRole(member, next)} />,
    },
    { key: 'joinedOn', header: '참여일', width: pixel(130) },
    {
      key: 'actions', header: '관리', width: pixel(90), align: 'end',
      renderCell: (member) => <Button label={`${member.name} 제외`} isIconOnly icon={<HgiTrash />} size="sm" variant="ghost"
        isDisabled={!canManage || member.role === 'owner'} tooltip={member.role === 'owner' ? '소유자는 제외할 수 없습니다.' : '프로젝트에서 제외'}
        onClick={() => setRemoving(member)} />,
    },
  ];


  const memberToolbar = mobile ? <MobileFilterBar label="멤버 필터" searchLabel="멤버 검색" placeholder="이름으로 검색" query={query} onQueryChange={setQuery}
    actions={<>
      <MobileFilterButton active={roleFilter !== 'all'} onClick={() => { setDraft({ filter: roleFilter, size: listing.size, sort: listing.sort, direction: listing.direction }); setFiltersOpen(true); }} />
      <Button label="초대" variant="primary" isDisabled={!canManage} onClick={() => { setLabel(''); setRole('viewer'); setDays('7'); setCreatedId(undefined); setInviteTab('new'); setRevoking(undefined); setCreating(true); }} />
    </>} /> : <Toolbar className="page-filter-toolbar" label="멤버 필터" size="sm" endContent={<HStack gap={2} align="center"><SortSelector options={sortOptions} value={{ key: listing.sort, direction: listing.direction }} onChange={value => listing.change({ sort: value.key, direction: value.direction })} /><Text type="supporting">참여 중 · {matched.length}명</Text></HStack>} startContent={<>
      <TextInput label="멤버 검색" isLabelHidden placeholder="이름으로 검색" startIcon={<HgiSearch />} value={query} onChange={setQuery} hasClear width="13.75rem" />
      <MultiSelector label="역할 필터" isLabelHidden placeholder="모든 역할" value={roles} onChange={setRoles} options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))} triggerDisplay="count" formatValue={items => `역할 · ${items.length}`} hasSelectAll selectAllLabel="전체 선택" />
      {query || roleFilter !== 'all' ? <Button label="초기화" variant="secondary" onClick={() => { setQuery(''); setRoles([]); }} /> : null}
    </>} />;

  if (!memberQuery.data || !project) return <PageLayout padding={0} height="fill" contentWidth={WIDTH.wide}
    header={<PageHeader title="멤버" compact={mobile} toolbar={memberToolbar} />}
    content={<PageContent>{!project && !projectsPending && !projectsError ? <EmptyState title="프로젝트를 찾을 수 없습니다" /> : <RequestState error={memberQuery.error ?? projectsError} retry={() => { void memberQuery.refetch(); retryProjects(); }} />}</PageContent>} />;

  return <>
    <PageLayout padding={0} height="fill" contentWidth={WIDTH.wide}
      header={<><PageHeader title="멤버" compact={mobile}
        actions={<Button label="멤버 초대" size="sm" variant="primary" icon={<HgiPlus />} isDisabled={!canManage}
          onClick={() => { setLabel(''); setRole('viewer'); setDays('7'); setCreatedId(undefined); setInviteTab('new'); setRevoking(undefined); setCreating(true); }} />} />
        {memberToolbar}
        {mobile && roleFilter !== 'all' ? <HStack paddingInline={mobile ? 3 : 4} paddingBlockEnd={2} gap={2} align="center">
          <Text color="secondary">역할 · {roles.map(role => ROLE_LABEL[role as keyof typeof ROLE_LABEL]).join(', ')}</Text>
          <Button label="해제" variant="secondary" onClick={() => setRoles([])} />
        </HStack> : null}
      </>}
      footer={mobile ? undefined : <ListingFooter {...listing.pagination(matched.length)} unit="명" />}
      content={<PageContent padding={mobile ? 3 : 4} ref={listing.ref} onScroll={listing.onScroll}>
        <VStack gap={6}>
          {mutation.error ? <Text role="alert">{mutation.error.message}</Text> : null}
          <VStack gap={3}>
            {mobile ? <Text weight="semibold">참여 중 · {matched.length}명</Text> : null}
            {mobile ? <List hasDividers style={{ marginInline: 'calc(-1 * var(--spacing-3))' }}>{visibleMembers.map((member) => <Item as="li" key={member.id}
              label={member.name} labelLines={2} description={`${ROLE_LABEL[member.role]}${member.isGuest ? ' · 게스트' : ''}`}
              startContent={<Avatar src={member.profileImageUrl} name={member.name} size="sm" />} density="spacious"
              onClick={() => setSelectedMember(member.id)} />)}</List> :
              <Table<MemberRow> aria-label="프로젝트 멤버" data={visibleMembers.map((member) => ({ ...member }))}
                columns={columns} idKey="id" density="balanced" dividers="rows" hasHover />}
            {!matched.length ? <EmptyState title="검색 결과가 없습니다" description="다른 이름이나 역할로 검색해 주세요." /> : null}
          </VStack>
          <VStack gap={1} paddingInline={0}>
            <Text color="secondary">편집자는 문서를 수정하고, 열람자는 문서를 읽고 코멘트를 남길 수 있습니다.</Text>
          </VStack>
        </VStack>
        {mobile ? <ListingFooter {...listing.pagination(matched.length)} unit="명" /> : null}
      </PageContent>} />

    <MobileSurface title="필터" isOpen={filtersOpen} onOpenChange={setFiltersOpen}>
      <Layout header={<DialogHeader title="멤버 필터" onOpenChange={setFiltersOpen} />} content={<LayoutContent><VStack gap={4}>
        <CheckboxList label="역할" description="선택하지 않으면 모든 역할을 표시합니다." value={draft.filter === 'all' ? [] : draft.filter.split(',')} onChange={values => setDraft({ ...draft, filter: values.join(',') || 'all' })}>
          {Object.entries(ROLE_LABEL).map(([value, label]) => <CheckboxListItem key={value} value={value} label={label} />)}
        </CheckboxList>
        <SortFields options={sortOptions} value={{ key: draft.sort, direction: draft.direction }} onChange={value => setDraft({ ...draft, sort: value.key, direction: value.direction })} />
        <PageSize value={draft.size} onChange={(size) => setDraft({ ...draft, size })} />
        <Button label="초기화" onClick={() => setDraft({ filter: 'all', size: 25, sort: 'title', direction: 'asc' })} />
        <Button label="적용" variant="primary" size="lg" onClick={() => { listing.change(draft); setFiltersOpen(false); }} />
      </VStack></LayoutContent>} />
    </MobileSurface>
    <MobileSurface title={selected?.name ?? '멤버'} isOpen={Boolean(selected)} onOpenChange={() => setSelectedMember(undefined)}>
      <Layout header={<DialogHeader title={selected?.name ?? '멤버'} onOpenChange={() => setSelectedMember(undefined)} />} content={<LayoutContent>
        {selected ? <VStack gap={4}>
          <Text>참여일 · {selected.joinedOn}</Text>
          <Text>{selected.isGuest ? '게스트' : '등록 계정'}</Text>
          <Selector label="역할" value={selected.role} isDisabled={selected.role === 'owner' || !canManage}
            options={[{ value: 'owner', label: '소유자', disabled: true }, ...ROLE_OPTIONS]}
            onChange={(role) => changeRole(selected, role)} />
          <Button label="프로젝트에서 제외" variant="destructive" size="lg" isDisabled={selected.role === 'owner' || !canManage}
            onClick={() => { setSelectedMember(undefined); setRemoving(selected); }} />
        </VStack> : null}
      </LayoutContent>} />
    </MobileSurface>
    <Dialog isOpen={creating} onOpenChange={setCreating} purpose="form" variant={mobile ? 'fullscreen' : 'standard'} width="35rem">
      <Layout header={<DialogHeader title="멤버 초대" onOpenChange={setCreating} />}
        footer={mobile && inviteTab === 'new' && !created ? <LayoutFooter hasDivider><HStack paddingBlock={3} gap={2} wrap="wrap">
          <Button label="취소" size="lg" onClick={() => setCreating(false)} />
          <Button label="링크 만들기" size="lg" width="100%" variant="primary" isDisabled={!label.trim() || !canManage || mutation.isPending} onClick={create} />
        </HStack></LayoutFooter> : undefined} content={<LayoutContent>
      <VStack gap={4}>
        {mutation.error || invitationQuery.error ? <Text role="alert">{(mutation.error ?? invitationQuery.error)?.message}</Text> : null}
        <TabList role="tablist" aria-label="초대 방식" value={inviteTab} onChange={(value) => { setInviteTab(value); setRevoking(undefined); }} hasDivider>
          <Tab value="new" label="새 초대" panelId="invite-new" />
          <Tab value="manage" label="초대 링크 관리" panelId="invite-manage" />
        </TabList>
        <VStack role="tabpanel" aria-label={inviteTab === 'new' ? '새 초대' : '초대 링크 관리'} id={`invite-${inviteTab}`} gap={4}>
        {inviteTab === 'manage' ? revoking ? <>
          <Text weight="semibold">초대 링크 비활성화</Text>
          <Text>{revoking.label} 링크로 더 이상 참여할 수 없게 합니다. 이미 참여한 멤버는 유지됩니다.</Text>
          <HStack gap={2} justify="end">
            <Button label="취소" onClick={() => setRevoking(undefined)} />
            <Button label="비활성화" variant="destructive" onClick={() => {
              if (!canManage) return;
              mutation.mutate(async () => { await revokeInvitation(projectId, revoking.id); setRevoking(undefined); });
            }} />
          </HStack>
        </> : <>
          <VStack gap={3}>
            <VStack gap={1}><Text weight="semibold" size="lg">초대 링크</Text>
              <Text color="secondary">링크를 받은 사람은 이메일 인증 후 지정한 역할로 참여합니다.</Text></VStack>
            {projectInvites.length ? <List hasDividers>
              {projectInvites.map((invite) => <Item as="li" key={invite.id}
                label={<HStack gap={2} wrap="wrap" align="center"><Text weight="semibold">{invite.label}</Text>
                  <Token size="sm" label={invite.revoked ? '비활성' : isActive(invite) ? '사용 가능' : '만료'} color={isActive(invite) ? 'green' : 'gray'} /></HStack>}
                description={`${ROLE_LABEL[invite.role]} · ${new Date(invite.expiresAt).toLocaleDateString('ko-KR')} 만료 · ${invite.uses}명 참여`}
                endContent={<HStack gap={1} wrap="wrap">
                  <Button label="복사" size="sm" variant="secondary" isDisabled={!isActive(invite)} onClick={() => void copy(invite.id)} />
                  <Button label="미리보기" size="sm" variant="secondary" isDisabled={!isActive(invite)} onClick={() => { setCreating(false); onPreview(invite.token); }} />
                  <Button label={`${invite.label} 비활성화`} size="sm" variant="ghost" isIconOnly icon={<HgiTrash />}
                    isDisabled={!canManage || !isActive(invite)} onClick={() => setRevoking(invite)} />
                </HStack>} />)}
            </List> : <EmptyState isCompact icon={<HgiMembers />} title="초대 링크가 없습니다" description="새 초대 탭에서 링크를 만들어 공유하세요." />}
          </VStack>

        </> : created ? <>
          <Text weight="semibold">초대 링크가 준비됐습니다.</Text>
          <Text>{created.label} · {ROLE_LABEL[created.role]}</Text>
          <TextInput label="초대 링크" value={urlFor(created.id)} isReadOnly />
          <Text color="secondary">링크를 전달받은 사람 누구나 참여할 수 있습니다. 필요한 사람에게만 공유하세요.</Text>
          <HStack gap={2} justify="end" wrap="wrap">
            <Button label="새 링크 만들기" variant="secondary" onClick={() => { setCreatedId(undefined); setLabel(''); }} />
            <Button label="참여 미리보기" isDisabled={!isActive(created)} onClick={() => { setCreating(false); onPreview(created.token); }} />
            <Button label="링크 복사" variant="primary" isDisabled={!isActive(created)} onClick={() => void copy(created.id)} />
          </HStack>
        </> : <>
          <TextInput label="링크 이름" placeholder="예: 외부 검토자" value={label} onChange={setLabel} isRequired onEnter={create} />
          <Selector label="참여 역할" value={role} onChange={(value) => setRole(value as Invitation['role'])} options={ROLE_OPTIONS} />
          <Selector label="유효 기간" value={days} onChange={setDays} options={['1', '7', '30'].map((value) => ({ value, label: `${value}일` }))} />
          <Text color="secondary">이미 가입한 사람은 기존 계정으로, 처음 사용하는 사람은 이메일 인증 후 참여합니다.</Text>
          {!mobile ? <HStack gap={2} justify="end"><Button label="취소" onClick={() => setCreating(false)} />
            <Button label="링크 만들기" variant="primary" isDisabled={!label.trim() || !canManage} onClick={create} /></HStack> : null}
        </>}
        </VStack>
      </VStack>
      </LayoutContent>} />
    </Dialog>
    <Dialog isOpen={Boolean(removing)} onOpenChange={() => setRemoving(undefined)}>
      <Layout header={<DialogHeader title="멤버 제외" onOpenChange={() => setRemoving(undefined)} />} content={<LayoutContent>
      <VStack gap={4}>
        {mutation.error ? <Text role="alert">{mutation.error.message}</Text> : null}
        <Text>{removing?.name} 님을 {project.name}에서 제외하시겠습니까?</Text>
        <HStack gap={2} justify="end"><Button label="취소" onClick={() => setRemoving(undefined)} />
          <Button label="제외" variant="destructive" isLoading={mutation.isPending} isDisabled={mutation.isPending} onClick={() => {
            if (!canManage) return;
            if (removing && removing.role !== 'owner') mutation.mutate(async () => { await removeMember(projectId, removing.id); setRemoving(undefined); });
          }} /></HStack>
      </VStack>
      </LayoutContent>} />
    </Dialog>
  </>;
}
