import viteReact from '@vitejs/plugin-react';
import { Features } from 'lightningcss';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import { palettes, paletteTokens } from './src/shared/ui/theme/palettes';

export default defineConfig(({ mode }) => {
  const storageEndpoint = process.env.DEV_STORAGE_TARGET ?? loadEnv(mode, fileURLToPath(new URL('../../../server', import.meta.url)), 'STORAGE_ENDPOINT').STORAGE_ENDPOINT;
  const storageOrigin = storageEndpoint ? new URL(storageEndpoint).origin : '';
  const storageProxy: ProxyOptions = {
    target: storageOrigin,
    changeOrigin: true,
    rewrite: path => path.replace(/^\/__storage/, ''),
    configure(proxy) {
      proxy.on('proxyReq', request => {
        request.removeHeader('cookie');
        request.removeHeader('authorization');
        request.removeHeader('origin');
        request.removeHeader('referer');
      });
    },
  };
  return {
    // 폴리필은 상위 토큰의 색상을 고정하므로 중첩된 MediaTheme에 필요한 함수를 유지한다.
    css: { lightningcss: { exclude: Features.LightDark } },
    define: { 'import.meta.env.DEV_STORAGE_ORIGIN': JSON.stringify(storageOrigin) },
    server: {
      port: 4401, strictPort: true,
      proxy: {
        '/api': { target: process.env.DEV_API_TARGET ?? 'http://localhost:8080', changeOrigin: true },
        ...(storageOrigin ? { '/__storage/': storageProxy } : {}),
      },
    },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    plugins: [viteReact(), {
      name: 'gentask-appearance',
      transformIndexHtml(html) {
        const tokens = { neutral: {}, ...Object.fromEntries(palettes.map(palette => [palette.id, paletteTokens(palette)])) };
        const bootstrap = readFileSync(new URL('./src/shared/ui/theme/appearance-bootstrap.js', import.meta.url), 'utf8');
        return html.replace('<!-- GENTASK_APPEARANCE -->', `<script>(${bootstrap})(${JSON.stringify(tokens)});</script>`);
      },
    }],
  };
});
