import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // web 이 4200 을 쓰므로 겹치지 않게 둔다.
  server: { port: 4300 },
  plugins: [
    // SPA 모드는 셸 하나를 정적 HTML 로 내보낸다. nginx 가 정적 파일만 서빙하는
    // 지금 배포 형태와 맞으며, Node 런타임을 두지 않는다.
    tanstackStart({
      spa: { enabled: true },
    }),
    viteReact(),
  ],
});
