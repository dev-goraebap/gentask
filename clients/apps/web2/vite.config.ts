import { fileURLToPath } from 'node:url';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // web 이 4200 을 쓰므로 겹치지 않게 둔다.
    port: 4300,
    // 세션 쿠키를 같은 출처로 주고받아야 하므로 API 를 프록시로 붙인다.
    // web 의 proxy.conf.json 과 같은 대상이다.
    proxy: {
      '/api': { target: 'http://localhost:8080', secure: false },
      '/e2e': { target: 'http://localhost:8080', secure: false },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    // SPA 모드는 셸 하나를 정적 HTML 로 내보낸다. nginx 가 정적 파일만 서빙하는
    // 지금 배포 형태와 맞으며, Node 런타임을 두지 않는다.
    tanstackStart({
      spa: {
        enabled: true,
        // 셸을 index.html 로 낸다. 정적 서버와 nginx 가 기본 문서로 잡으므로
        // 폴백 규칙을 따로 두지 않아도 된다.
        prerender: { outputPath: '/index.html' },
      },
    }),
    viteReact(),
  ],
});
