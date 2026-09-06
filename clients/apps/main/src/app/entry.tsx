import { LOCALE_OVERRIDES } from '@/app/config/locale-overrides';
import { router } from '@/app/router/router';
import { LayerProvider } from '@astryxdesign/core';
import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import koKR from '@astryxdesign/core/locales/ko-KR.json';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MockDataProvider } from './model/MockDataProvider';

import '@/app/styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root 이 없습니다.');

createRoot(root).render(
  <StrictMode>
    {/* Astryx 가 컴포넌트 안에서 쓰는 문구를 한국어로 낸다. */}
    <InternationalizationProvider
      locale="ko-KR"
      messages={{ 'ko-KR': koKR }}
      overrides={LOCALE_OVERRIDES}
    >
      {/* 토스트와 오버레이가 서는 자리를 함께 세운다. */}
      <LayerProvider toast={{ position: 'bottomEnd' }}>
        {/* 라우트가 화면을 갈아 끼워도 상태는 유지되도록 라우터 바깥에 둔다. */}
        <MockDataProvider>
          <RouterProvider router={router} />
        </MockDataProvider>
      </LayerProvider>
    </InternationalizationProvider>
  </StrictMode>,
);
