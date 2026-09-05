import {
  AppShell,
  Button,
  Card,
  SideNav,
  SideNavItem,
  Text,
  TopNav,
} from '@astryxdesign/core';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: Home,
});

/*
 * 스파이크의 확인 대상은 셋이다.
 *
 *   1. AppShell 의 mobileNav 가 폭에 따라 SideNav 를 드로어로 바꾸는가
 *   2. y2k 테마 CSS 가 정적 빌드 산출물에 실려 나가는가
 *   3. 서버 없이 빌드되어 _shell.html 이 나오는가
 *
 * 창 폭을 768px 아래로 줄이면 왼쪽 내비게이션이 사라지고 상단에 햄버거가 나온다.
 */
function Home() {
  const [count, setCount] = useState(0);

  return (
    <AppShell
      height="fill"
      topNav={<TopNav heading="gentask" label="주 내비게이션" />}
      sideNav={
        <SideNav>
          <SideNavItem label="작업" isSelected />
          <SideNavItem label="백로그" />
          <SideNavItem label="문서" />
        </SideNav>
      }
      mobileNav={{ breakpoint: 'md' }}
    >
      <Card padding={6} maxWidth={480}>
        <Text as="h1" type="display-3">
          Astryx 적응형 확인
        </Text>
        <Text as="p">
          창 폭을 768px 아래로 줄이면 왼쪽 내비게이션이 드로어로 바뀝니다.
          코드에는 분기가 없습니다.
        </Text>
        <Button
          label={`눌린 횟수 ${count}`}
          variant="primary"
          onClick={() => setCount((n) => n + 1)}
        />
      </Card>
    </AppShell>
  );
}
