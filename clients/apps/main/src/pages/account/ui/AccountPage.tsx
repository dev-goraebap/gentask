import { UserAvatar } from '@/shared/ui/user-avatar';
import { PageLayout, PageContent, PageHeader } from '@/shared/ui/page-layout';
import { MobilePageHeader, MOBILE_QUERY } from '@/shared/ui/mobile';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { logout, useSession } from '@/entities/session';
import { WIDTH } from '@/shared/config';
import { ThemeToggle } from '@/shared/ui/theme';
import { Button, Text, VStack } from '@astryxdesign/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ApiTokenSettings } from './ApiTokenSettings';
import { SettingsGroup } from './SettingsGroup';
import { SettingsRow } from './SettingsRow';
import { HgiUser, HgiSun, HgiArrowLeft } from '@/shared/ui/icons';
import './account.css';

export function AccountPage() {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const { data: me } = useSession();
  const client = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await client.cancelQueries(); client.clear();
      await navigate({ to: '/login', replace: true });
    },
  });
  return <PageLayout padding={0} contentWidth={WIDTH.wide}
    header={mobile ? <MobilePageHeader title="내 정보" /> : <PageHeader title="내 정보" />}
    content={<PageContent padding={mobile ? 3 : 4}><VStack gap={5} className="account-settings">
      <SettingsGroup title="프로필">
        <SettingsRow title={me?.nickname ?? '프로필'} description={me?.email} icon={<HgiUser />}
          control={<UserAvatar userId={me?.id} src={me?.profileImageUrl ?? undefined} name={me?.nickname ?? ''} size="lg" tooltip={false} />} />
      </SettingsGroup>
      <SettingsGroup title="화면 설정">
        <SettingsRow title="화면 테마" description="밝은 화면과 어두운 화면을 전환합니다." icon={<HgiSun />} control={<ThemeToggle />} />
      </SettingsGroup>
      {me ? <ApiTokenSettings key={me.id} /> : null}
      {mutation.error ? <Text role="alert">{mutation.error.message}</Text> : null}
      <SettingsGroup title="계정">
        <SettingsRow title="로그아웃" description="이 브라우저의 로그인 세션을 종료합니다." icon={<HgiArrowLeft />}
          control={<Button label="로그아웃" variant="secondary" isLoading={mutation.isPending} isDisabled={mutation.isPending} onClick={() => mutation.mutate()} />} />
      </SettingsGroup>
    </VStack></PageContent>} />;
}
