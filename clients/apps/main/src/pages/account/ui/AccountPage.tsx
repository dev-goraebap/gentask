import { MobilePageHeader, MOBILE_QUERY } from '@/shared/ui/mobile';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { ME } from '@/entities/session';
import { WIDTH } from '@/shared/config';
import { ThemeToggle } from '@/shared/ui/theme';
import { Avatar, Heading, HStack, Layout, LayoutContent, LayoutHeader, Text, VStack } from '@astryxdesign/core';

export function AccountPage() {
  const mobile = useMediaQuery(MOBILE_QUERY);
  return <Layout padding={0} contentWidth={WIDTH.narrow}
    header={mobile ? <MobilePageHeader title="내 정보" /> : <LayoutHeader hasDivider padding={4}><VStack gap={2}><Heading level={1}>내 정보</Heading><Text color="secondary">내 프로필과 화면 설정을 확인합니다.</Text></VStack></LayoutHeader>}
    content={<LayoutContent padding={mobile ? 3 : 4}><VStack gap={6}>
      {mobile ? <Text color="secondary">내 프로필과 화면 설정을 확인합니다.</Text> : null}
      <HStack gap={4} align="center"><Avatar name={ME} size="lg" tooltip={false} /><VStack gap={1}><Text weight="semibold">{ME}</Text><Text color="secondary">데모 계정</Text></VStack></HStack>
      <VStack gap={2}><Heading level={2}>프로필</Heading><Text>이름: {ME}</Text></VStack>
      <HStack justify="between" align="center"><VStack gap={1}><Heading level={2}>화면 테마</Heading><Text color="secondary">밝은 화면과 어두운 화면을 전환합니다.</Text></VStack><ThemeToggle /></HStack>
    </VStack></LayoutContent>} />;
}
