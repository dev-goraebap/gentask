import { join } from 'node:path';

import { defineConfig } from '@playwright/test';

import { 관리자_이메일 } from './e2e/env';

const 서버 = join(__dirname, '..', 'server');

// 종단 테스트 설정. 규약은 결정-0008 이 갖는다.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 4,
  // 재시도로 통과시키지 않는다. 간헐적 실패는 원인을 고치거나 지운다.
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4200',
    // 실패하면 타임라인과 DOM 스냅숏을 남긴다. 테스트 코드 대신 이것을 읽는다.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  webServer: [
    {
      command: process.platform === 'win32' ? `"${join(서버, 'gradlew.bat')}" bootRun` : './gradlew bootRun',
      cwd: 서버,
      env: { ADMIN_EMAIL: 관리자_이메일 },
      url: 'http://localhost:8080/v3/api-docs',
      reuseExistingServer: true,
      timeout: 300_000,
      stdout: 'pipe',
    },
    {
      command: 'npm start',
      cwd: __dirname,
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 300_000,
    },
  ],
});
