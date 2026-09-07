import { PageLayout, PageContent } from '@/shared/ui/page-layout';
import { MobilePageHeader, MOBILE_QUERY } from '@/shared/ui/mobile';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { logout, useSession } from '@/entities/session';
import { WIDTH } from '@/shared/config';
import { ThemeToggle } from '@/shared/ui/theme';
import { Avatar, Button, Heading, HStack, LayoutHeader, Text, VStack } from '@astryxdesign/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

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
  return <PageLayout padding={0} contentWidth={WIDTH.narrow}
    header={mobile ? <MobilePageHeader title="내 정보" /> : <LayoutHeader hasDivider padding={4}><Heading level={1}>내 정보</Heading></LayoutHeader>}
    content={<PageContent padding={mobile ? 3 : 4}><VStack gap={6}>
      <HStack gap={4} align="center"><Avatar name={me?.nickname ?? ''} size="lg" tooltip={false} />
        <VStack gap={1}><Text weight="semibold">{me?.nickname}</Text><Text color="secondary">{me?.email}</Text></VStack>
      </HStack>
      <HStack justify="between" align="center"><Heading level={2}>화면 테마</Heading><ThemeToggle /></HStack>
      {mutation.error ? <Text role="alert">{mutation.error.message}</Text> : null}
      <Button label="로그아웃" isLoading={mutation.isPending} isDisabled={mutation.isPending} onClick={() => mutation.mutate()} />
    </VStack></PageContent>} />;
}
