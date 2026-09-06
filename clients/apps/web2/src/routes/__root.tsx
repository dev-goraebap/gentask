import { Banner, Button, Card, LayerProvider, Text } from '@astryxdesign/core';
import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import koKR from '@astryxdesign/core/locales/ko-KR.json';
import { LOCALE_OVERRIDES } from '@/shared/config/locale-overrides';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';
import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'gentask' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
  errorComponent: ErrorScreen,
  notFoundComponent: NotFoundScreen,
});

function RootComponent() {
  return (
    <RootDocument>
      {/*
       * Astryx 가 컴포넌트 안에서 쓰는 문구(필수 표시, 닫기, 쪽 넘김 따위)를 한국어로 낸다.
       * 이것을 두지 않으면 우리가 쓴 한국어 사이에 영어가 섞인다.
       */}
      <InternationalizationProvider
        locale="ko-KR"
        messages={{ 'ko-KR': koKR }}
        overrides={LOCALE_OVERRIDES}
      >
        {/*
         * 조작의 결과를 알리는 자리를 함께 세운다. 바닥 오른쪽에 서되 바닥 띠를 피해 위로 띄운다.
         */}
        <LayerProvider toast={{ position: 'bottomEnd', inset: { bottom: 80 } }}>
          <Outlet />
        </LayerProvider>
      </InternationalizationProvider>
    </RootDocument>
  );
}

/**
 * 실패한 자리는 로그인하지 않아도 보여야 하므로 껍데기 밖에 둔다.
 *
 * 서버가 닿지 않는 경우가 여기로 온다. 로그인 화면으로 보내면 거기서도 같은 실패가 나므로
 * 무엇이 일어났는지 그대로 적는다.
 */
function ErrorScreen({ error }: { error: Error }) {
  return (
    <main className="auth-page">
      <Card padding={6} maxWidth={480}>
        <Text as="h1" type="display-3">
          문제가 생겼습니다
        </Text>
        <Banner status="error" title={error.message} />
        <Text as="p" type="supporting">
          API 서버가 떠 있는지 확인합니다. 로컬은 8080 입니다.
        </Text>
        <Button label="다시 시도" variant="primary" onClick={() => window.location.reload()} />
      </Card>
    </main>
  );
}

function NotFoundScreen() {
  return (
    <main className="auth-page">
      <Card padding={6} maxWidth={400}>
        <Text as="h1" type="display-3">
          찾지 못했습니다
        </Text>
        <Text as="p">주소가 가리키는 자리가 없습니다.</Text>
      </Card>
    </main>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    /*
     * 테마 CSS 는 @scope ([data-astryx-theme="..."]) 아래에만 적용된다. 이 속성이 없으면
     * 패키지를 들여와도 Astryx 의 기본 모습만 나온다.
     */
    <html lang="ko" data-astryx-theme="y2k">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
