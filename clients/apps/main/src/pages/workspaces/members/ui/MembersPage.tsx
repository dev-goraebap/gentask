import { ME } from '@/entities/session';
import { ROLE_LABEL, useWorkspaceStore, type Invitation, type ProjectMember } from '@/entities/workspace';
import { TITLE_PAD_TOP, TITLE_ROW, WIDTH } from '@/shared/config';
import { HgiMembers, HgiPlus, HgiSearch, HgiTrash } from '@/shared/ui/icons';
import { ListingFooter, PageSize, useListing } from '@/shared/ui/listing';
import { MobileSurface } from '@/shared/ui/mobile';
import {
    Avatar, Button, Dialog, DialogHeader, EmptyState,
    HStack,
    Heading,
    Item,
    Layout, LayoutContent,
    LayoutFooter,
    LayoutHeader,
    List, Selector,
    Tab, TabList,
    Text, TextInput,
    Token, Toolbar, VStack, useToast,
} from '@astryxdesign/core';
import { Table, pixel, proportional, type TableColumn } from '@astryxdesign/core/Table';
import { useEffect, useState } from 'react';

import { ROLE_OPTIONS, type MemberRow, type MembersProps } from './members';

export function MembersPage({ projectId, inviteId, onPreview }: MembersProps) {
  const { projects, members, invitations, setMembers, setInvitations } = useWorkspaceStore();
  const toast = useToast();
  const listing = useListing(`members:${projectId}`);
  const { query, filter: roleFilter, mobile } = listing;
  const setQuery = (query: string) => listing.change({ query });
  const setRoleFilter = (filter: string) => listing.change({ filter });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState({ filter: roleFilter, size: listing.size });
  const [selectedMember, setSelectedMember] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [inviteTab, setInviteTab] = useState('new');
  const [label, setLabel] = useState('');
  const [role, setRole] = useState<Invitation['role']>('viewer');
  const [days, setDays] = useState('7');
  const [createdId, setCreatedId] = useState<string>();
  const [removing, setRemoving] = useState<ProjectMember>();
  const [revoking, setRevoking] = useState<Invitation>();
  const [guestName, setGuestName] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const project = projects.find((p) => p.id === projectId);
  const projectMembers = members.filter((m) => m.projectId === projectId);
  const projectInvites = invitations.filter((i) => i.projectId === projectId);
  const canManage = projectMembers.some((m) => m.name === ME && m.role === 'owner');
  const matched = projectMembers.filter((m) =>
    m.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
    (roleFilter === 'all' || m.role === roleFilter),
  );
  const created = projectInvites.find((i) => i.id === createdId);
  const page = Math.min(listing.page, Math.max(1, Math.ceil(matched.length / listing.size)));
  const visibleMembers = matched.slice((page - 1) * listing.size, page * listing.size);
  const selected = projectMembers.find((m) => m.id === selectedMember);
  useEffect(() => { if (page !== listing.page) listing.change({ page }); }, [page, listing.page]);
  const preview = projectInvites.find((i) => i.id === inviteId);
  const isActive = (invite: Invitation) => !invite.revoked && invite.expiresAt > now;
  const urlFor = (id: string) => `${window.location.origin}/projects/${projectId}/members?invite=${id}`;
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
    if (!canManage || !label.trim()) return;
    const invitation: Invitation = {
      id: crypto.randomUUID(), projectId, label: label.trim(), role,
      expiresAt: Date.now() + Number(days) * 86400000, revoked: false, uses: 0,
    };
    setInvitations((prev) => [invitation, ...prev]);
    setCreatedId(invitation.id);
  };
  const changeRole = (member: ProjectMember, next: string) => {
    if (!canManage || member.role === 'owner' || (next !== 'editor' && next !== 'viewer')) return;
    setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, role: next } : m));
    toast({ body: `${member.name} 님을 ${ROLE_LABEL[next]}로 변경했습니다.` });
  };
  const duplicateName = projectMembers.some((m) => m.name === guestName.trim());
  const join = () => {
    if (!preview || preview.revoked || preview.expiresAt <= Date.now() || !guestName.trim() || duplicateName) return;
    setMembers((prev) => [...prev, {
      id: crypto.randomUUID(), projectId, name: guestName.trim(), role: preview.role,
      isGuest: true, joinedOn: new Date().toLocaleDateString('sv-SE'),
    }]);
    setInvitations((prev) => prev.map((i) => i.id === preview.id ? { ...i, uses: i.uses + 1 } : i));
    setGuestName('');
    onPreview();
    toast({ body: '게스트가 프로젝트에 참여했습니다.' });
  };

  const columns: TableColumn<MemberRow>[] = [
    {
      key: 'name', header: '멤버', width: proportional(2),
      renderCell: (member) => <HStack gap={2} align="center">
        <Avatar name={member.name} size="sm" />
        <HStack gap={1} wrap="wrap" align="center">
          <Text weight="semibold">{member.name}</Text>
          {member.name === ME ? <Text type="supporting">나</Text> : null}
          {member.isGuest ? <Token label="게스트" size="sm" color="orange" /> : null}
        </HStack>
      </HStack>,
    },
    {
      key: 'role', header: '역할', width: pixel(180),
      renderCell: (member) => member.role === 'owner'
        ? <Token label="소유자" color="purple" size="sm" />
        : <Selector label={`${member.name} 역할`} isLabelHidden size="sm" variant="ghost" width="100%" value={member.role}
            options={ROLE_OPTIONS} isDisabled={!canManage} onChange={(next) => changeRole(member, next)} />,
    },
    { key: 'joinedOn', header: '참여일', width: pixel(130) },
    {
      key: 'actions', header: '관리', width: pixel(90), align: 'end',
      renderCell: (member) => <Button label={`${member.name} 제외`} isIconOnly icon={<HgiTrash />} size="sm" variant="ghost"
        isDisabled={!canManage || member.role === 'owner'} tooltip={member.role === 'owner' ? '소유자는 제외할 수 없습니다.' : '프로젝트에서 제외'}
        onClick={() => setRemoving(member)} />,
    },
  ];

  if (!project) return <EmptyState title="프로젝트를 찾을 수 없습니다" />;

  const memberToolbar = <Toolbar className={mobile ? undefined : "page-filter-toolbar"} label="멤버 필터" endContent={mobile ? undefined : <Text type="supporting">참여 중 · {matched.length}명</Text>} size={mobile ? 'lg' : 'sm'} startContent={<>
              <TextInput label="멤버 검색" isLabelHidden placeholder="이름으로 검색" startIcon={<HgiSearch />}
                size={mobile ? 'lg' : 'sm'}
                value={query} onChange={setQuery} hasClear width={mobile ? 'max(10rem, min(calc(100vw - 13.125rem), 45rem))' : '13.75rem'} />
              {mobile ? <Button label={roleFilter !== 'all' ? '필터 · 1' : '필터'} size="lg" onClick={() => { setDraft({ filter: roleFilter, size: listing.size }); setFiltersOpen(true); }} /> : <>
              <Selector label="역할 필터" isLabelHidden value={roleFilter} onChange={setRoleFilter}
                options={[{ value: 'all', label: '모든 역할' }, ...Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))]} />
              {query || roleFilter !== 'all' ? <Button label="초기화" variant="ghost" onClick={() => { setQuery(''); setRoleFilter('all'); }} /> : null}
              </>}
          {mobile ? <Button label="초대" size="lg" variant="primary" isDisabled={!canManage}
            onClick={() => { setLabel(''); setRole('viewer'); setDays('7'); setCreatedId(undefined); setInviteTab('new'); setRevoking(undefined); setCreating(true); }} /> : null}
        </>} />;

  return <>
    <Layout padding={0} height="fill" contentWidth={WIDTH.wide}
      header={<>{mobile ? null : <LayoutHeader hasDivider padding={mobile ? 0 : undefined}>
        <VStack gap={2}>
        <HStack justify="between" align="center" width="100%" height={mobile ? undefined : TITLE_ROW}
          paddingBlock={mobile ? 2 : undefined} paddingBlockStart={mobile ? 2 : TITLE_PAD_TOP} paddingInline={mobile ? 3 : 4} gap={2}>
          <Heading level={1}>멤버</Heading>
          <Button label="멤버 초대" size={mobile ? 'lg' : 'sm'} variant="primary" icon={<HgiPlus />} isDisabled={!canManage}
            onClick={() => { setLabel(''); setRole('viewer'); setDays('7'); setCreatedId(undefined); setInviteTab('new'); setRevoking(undefined); setCreating(true); }} />
        </HStack>
          <VStack paddingInline={mobile ? 3 : 4}>
            <Text color="secondary">프로젝트 멤버와 역할을 관리합니다.</Text>
          </VStack>
        </VStack>
      </LayoutHeader>}
        {memberToolbar}
        {mobile && roleFilter !== 'all' ? <HStack paddingInline={mobile ? 3 : 4} paddingBlockEnd={2} gap={2} align="center">
          <Text color="secondary">역할 · {ROLE_LABEL[roleFilter as keyof typeof ROLE_LABEL]}</Text>
          <Button label="해제" variant="ghost" onClick={() => setRoleFilter('all')} />
        </HStack> : null}
      </>}
      footer={mobile ? undefined : <ListingFooter total={matched.length} page={page} size={listing.size} mobile={mobile}
        onPage={(page) => listing.change({ page })} onSize={(size) => listing.change({ size })} />}
      content={<LayoutContent padding={mobile ? 3 : 4} ref={listing.ref} onScroll={listing.onScroll}>
        <VStack gap={6}>
          <VStack gap={3}>
            {mobile ? <Text weight="semibold">참여 중 · {matched.length}명</Text> : null}
            {mobile ? <List hasDividers style={{ marginInline: 'calc(-1 * var(--spacing-3))' }}>{visibleMembers.map((member) => <Item as="li" key={member.id}
              label={member.name} labelLines={2} description={`${ROLE_LABEL[member.role]}${member.isGuest ? ' · 게스트' : ''}`}
              startContent={<Avatar name={member.name} size="sm" />} density="spacious"
              onClick={() => setSelectedMember(member.id)} />)}</List> :
              <Table<MemberRow> aria-label="프로젝트 멤버" data={visibleMembers.map((member) => ({ ...member }))}
                columns={columns} idKey="id" density="balanced" dividers="rows" hasHover />}
            {!matched.length ? <EmptyState title="검색 결과가 없습니다" description="다른 이름이나 역할로 검색해 주세요." /> : null}
          </VStack>
          <VStack gap={1} paddingInline={0}>
            <Text color="secondary">게스트는 인수 조건의 완료 판정을 할 수 없습니다.</Text>
          </VStack>
        </VStack>
        {mobile ? <ListingFooter total={matched.length} page={page} size={listing.size} mobile={mobile}
        onPage={(page) => listing.change({ page })} onSize={(size) => listing.change({ size })} /> : null}
      </LayoutContent>} />

    <MobileSurface title="필터" isOpen={filtersOpen} onOpenChange={setFiltersOpen}>
      <Layout header={<DialogHeader title="멤버 필터" onOpenChange={setFiltersOpen} />} content={<LayoutContent><VStack gap={4}>
        <Selector label="역할" value={draft.filter} onChange={(filter) => setDraft({ ...draft, filter })}
          options={[{ value: 'all', label: '모든 역할' }, ...Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))]} />
        <PageSize value={draft.size} onChange={(size) => setDraft({ ...draft, size })} />
        <Button label="초기화" onClick={() => setDraft({ filter: 'all', size: 25 })} />
        <Button label="결과 보기" variant="primary" size="lg" onClick={() => { listing.change(draft); setFiltersOpen(false); }} />
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
          <Button label="링크 만들기" size="lg" width="100%" variant="primary" isDisabled={!label.trim() || !canManage} onClick={create} />
        </HStack></LayoutFooter> : undefined} content={<LayoutContent>
      <VStack gap={4}>
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
              setInvitations((prev) => prev.map((i) => i.id === revoking.id ? { ...i, revoked: true } : i));
              setRevoking(undefined);
              toast({ body: '초대 링크를 비활성화했습니다.' });
            }} />
          </HStack>
        </> : <>
          <VStack gap={3}>
            <VStack gap={1}><Text weight="semibold" size="lg">초대 링크</Text>
              <Text color="secondary">링크를 받은 사람은 지정한 역할의 게스트로 참여합니다.</Text></VStack>
            {projectInvites.length ? <List hasDividers>
              {projectInvites.map((invite) => <Item as="li" key={invite.id}
                label={<HStack gap={2} wrap="wrap" align="center"><Text weight="semibold">{invite.label}</Text>
                  <Token size="sm" label={invite.revoked ? '비활성' : isActive(invite) ? '사용 가능' : '만료'} color={isActive(invite) ? 'green' : 'gray'} /></HStack>}
                description={`${ROLE_LABEL[invite.role]} · ${new Date(invite.expiresAt).toLocaleDateString('ko-KR')} 만료 · ${invite.uses}명 참여`}
                endContent={<HStack gap={1} wrap="wrap">
                  <Button label="복사" size="sm" variant="ghost" isDisabled={!isActive(invite)} onClick={() => void copy(invite.id)} />
                  <Button label="미리보기" size="sm" variant="ghost" isDisabled={!isActive(invite)} onClick={() => { setCreating(false); onPreview(invite.id); }} />
                  <Button label={`${invite.label} 비활성화`} size="sm" variant="ghost" isIconOnly icon={<HgiTrash />}
                    isDisabled={!canManage || !isActive(invite)} onClick={() => setRevoking(invite)} />
                </HStack>} />)}
            </List> : <EmptyState isCompact icon={<HgiMembers />} title="초대 링크가 없습니다" description="새 초대 탭에서 링크를 만들어 공유하세요." />}
          </VStack>

        </> : created ? <>
          <Text weight="semibold">초대 링크가 준비됐습니다.</Text>
          <Text>{created.label} · {ROLE_LABEL[created.role]}</Text>
          <TextInput label="초대 링크" value={urlFor(created.id)} isReadOnly />
          <Text color="secondary">프로토타입 링크는 현재 탭에서만 유효하며 새로 고침하면 초기화됩니다.</Text>
          <HStack gap={2} justify="end" wrap="wrap">
            <Button label="새 링크 만들기" variant="ghost" onClick={() => { setCreatedId(undefined); setLabel(''); }} />
            <Button label="참여 미리보기" isDisabled={!isActive(created)} onClick={() => { setCreating(false); onPreview(created.id); }} />
            <Button label="링크 복사" variant="primary" isDisabled={!isActive(created)} onClick={() => void copy(created.id)} />
          </HStack>
        </> : <>
          <TextInput label="링크 이름" placeholder="예: 외부 검토자" value={label} onChange={setLabel} isRequired onEnter={create} />
          <Selector label="참여 역할" value={role} onChange={(value) => setRole(value as Invitation['role'])} options={ROLE_OPTIONS} />
          <Selector label="유효 기간" value={days} onChange={setDays} options={['1', '7', '30'].map((value) => ({ value, label: `${value}일` }))} />
          <Text color="secondary">게스트는 계정 없이 참여하며 인수 조건의 완료 판정은 제한됩니다.</Text>
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
        <Text>{removing?.name} 님을 {project.name}에서 제외하시겠습니까?</Text>
        <HStack gap={2} justify="end"><Button label="취소" onClick={() => setRemoving(undefined)} />
          <Button label="제외" variant="destructive" onClick={() => {
            if (!canManage) return;
            if (removing && removing.role !== 'owner') setMembers((prev) => prev.filter((m) => m.id !== removing.id));
            toast({ body: '멤버를 제외했습니다.' });
            setRemoving(undefined);
          }} /></HStack>
      </VStack>
      </LayoutContent>} />
    </Dialog>
    <Dialog isOpen={Boolean(inviteId)} onOpenChange={(open) => { if (!open) { onPreview(); setGuestName(''); } }} purpose="form" variant={mobile ? 'fullscreen' : 'standard'} width="30rem">
      <Layout header={<DialogHeader title="프로젝트 초대" onOpenChange={() => { onPreview(); setGuestName(''); }} />} content={<LayoutContent>
      <VStack gap={4}>
        {preview && isActive(preview) ? <>
          <Text size="lg" weight="semibold">{project.name}</Text>
          <Text>{ROLE_LABEL[preview.role]} 역할로 참여하도록 초대받았습니다.</Text>
          <TextInput label="표시 이름" value={guestName} onChange={setGuestName} onEnter={join} isRequired
            status={duplicateName ? { type: 'error', message: '이미 참여 중인 이름입니다. 다른 이름을 입력해 주세요.' } : undefined} />
          <Text color="secondary">참여 흐름 미리보기입니다. 입력한 이름이 이 탭의 멤버 목록에 추가됩니다.</Text>
          <Button label="게스트로 참여" variant="primary" isDisabled={!guestName.trim() || duplicateName} onClick={join} />
        </> : <EmptyState title="사용할 수 없는 초대 링크입니다" description="링크가 만료·비활성화되었거나 프로토타입 상태가 초기화되었습니다." />}
      </VStack>
      </LayoutContent>} />
    </Dialog>
  </>;
}
