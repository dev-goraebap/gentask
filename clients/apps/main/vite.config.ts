import viteReact from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 4401, strictPort: true, proxy: { '/api': { target: process.env.DEV_API_TARGET ?? 'http://localhost:8080', changeOrigin: true } } },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [viteReact()],
});
