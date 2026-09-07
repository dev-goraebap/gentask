import { invitationOptions, acceptInvitation, projectsOptions, ROLE_LABEL } from '@/entities/workspace';
import { ApiError, get } from '@/shared/api';
import { PageLayout, PageContent } from '@/shared/ui/page-layout';
import { WIDTH } from '@/shared/config';
import { Button, Heading, Text, VStack } from '@astryxdesign/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components } from 'api-types';

export function InvitationPage({ token, onLogin, onJoined }: { token: string; onLogin: () => void; onJoined: (projectId: string) => Promise<unknown> }) {
  const invitation = useQuery({ ...invitationOptions(token), staleTime: 0, refetchOnMount: 'always' });
  const client = useQueryClient();
  const session = useQuery({ queryKey: ['invitation-session', token], staleTime: 0, gcTime: 0, retry: false, refetchOnMount: 'always', queryFn: async () => {
    try { return await get<components['schemas']['MeView']>('/me'); }
    catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
  } });
  const projects = useQuery({ ...projectsOptions(), queryKey: ['invitation-projects', token, session.data?.id ?? 'anonymous'],
    enabled: !!session.data, staleTime: 0, gcTime: 0, refetchOnMount: 'always',
  });
  const existing = projects.data?.find(project => project.id === invitation.data?.projectId);
  const checking = session.isPending || session.isFetching || (!!session.data && (projects.isPending || projects.isFetching));
  const accept = useMutation({ mutationFn: () => acceptInvitation(token), meta: { login: true },
    onError: async error => {
      if (error instanceof ApiError && error.status === 401) {
        await client.cancelQueries(); client.clear(); onLogin();
      } else if (error instanceof ApiError && error.status === 410) {
        await client.invalidateQueries({ queryKey: invitationOptions(token).queryKey });
      }
    }, onSuccess: async result => {
    await client.invalidateQueries({ queryKey: ['projects'] });
    await client.invalidateQueries({ queryKey: ['project-members', result.projectId] });
    await onJoined(result.projectId);
  } });
  return <PageLayout height="fill" contentWidth={WIDTH.narrow} content={<PageContent padding={6}>
    <VStack gap={4}>
      <Heading level={1}>프로젝트 초대</Heading>
      {invitation.data && !invitation.error ? <>
        <Heading level={2}>{invitation.data.projectName}</Heading>
        {checking ? <Text>참여 상태를 확인하고 있습니다.</Text> : existing ?
          <Text>이미 이 프로젝트에 {ROLE_LABEL[existing.role as keyof typeof ROLE_LABEL] ?? existing.role}로 참여 중입니다.</Text> : <>
            <Text>{ROLE_LABEL[invitation.data.role as keyof typeof ROLE_LABEL] ?? invitation.data.role} 역할로 참여할 수 있습니다.</Text>
            <Text color="secondary">{new Date(invitation.data.expiresAt).toLocaleString('ko-KR')}까지 유효합니다.</Text>
          </>}
        {session.data ? <Text>{session.data.nickname} · {session.data.email}</Text> : !checking ? <Text>이메일 인증 후 참여를 수락해 주세요.</Text> : null}
        <Button label={checking ? '참여 상태 확인 중' : existing ? '프로젝트로 이동' : session.data ? '프로젝트 참여' : '이메일로 계속하기'} variant="primary" isLoading={checking || accept.isPending}
          isDisabled={checking || !!session.error || !!projects.error || accept.isPending}
          onClick={() => existing ? void onJoined(existing.id) : session.data ? accept.mutate() : onLogin()} />
      </> : invitation.isPending ? <Text>초대 정보를 확인하고 있습니다.</Text> : null}
      {invitation.error || accept.error || session.error || projects.error ? <Text role="alert">{(invitation.error ?? accept.error ?? session.error ?? projects.error)?.message}</Text> : null}
    </VStack>
  </PageContent>} />;
}
