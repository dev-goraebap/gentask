import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { type APIRequestContext, type Page, expect, request, test as base } from '@playwright/test';

// 워커마다 계정을 하나 만들고 그 세션을 재사용한다. 테스트는 로그인 화면을 지나지 않으며,
// 워커끼리 데이터가 섞이지 않으므로 목록 전체를 단언해도 병렬 실행이 안전하다.

export interface 계정 {
  readonly email: string;
  readonly password: string;
  readonly nickname: string;
}

interface WorkerFixtures {
  계정: 계정;
  workerStorageState: string;
}

export const test = base.extend<Record<string, never>, WorkerFixtures>({
  계정: [
    // Playwright 는 픽스처의 첫 인자에 객체 구조 분해를 강제한다.
    // 의존하는 픽스처가 없으면 빈 패턴 외에 쓸 형태가 없다.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      await use({
        email: `e2e-w${workerInfo.parallelIndex}-${randomUUID()}@example.com`,
        password: 'e2e-password-1234',
        nickname: `E2E${workerInfo.parallelIndex}`,
      });
    },
    { scope: 'worker' },
  ],

  workerStorageState: [
    async ({ 계정 }, use, workerInfo) => {
      const path = resolve(workerInfo.project.outputDir, `.auth/${workerInfo.parallelIndex}.json`);
      const context = await request.newContext({ baseURL: 'http://localhost:4200' });

      const response = await context.post('/api/v1/auth/signup', { data: 계정 });
      expect(response.status(), '계정을 만들지 못했습니다').toBe(201);

      const state = await context.storageState();
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify(state), 'utf8');
      await context.dispose();

      await use(path);
    },
    { scope: 'worker' },
  ],

  storageState: ({ workerStorageState }, use) => use(workerStorageState),
});

export { expect } from '@playwright/test';

/** 준비 데이터는 화면 조작이 아니라 API 로 만든다. 결정-0008. */
export async function 작업을_만든다(
  request: APIRequestContext,
  title: string,
  extra: Record<string, unknown> = {},
): Promise<string> {
  const response = await request.post('/api/v1/tasks', { data: { title, ...extra } });
  expect(response.status(), `작업을 만들지 못했습니다: ${title}`).toBe(201);
  return (response.headers()['location'] ?? '').split('/').pop() ?? '';
}

/** 목록이 비어 있어야 하는 테스트를 위해 브라우저 문맥의 세션을 새 계정으로 바꾼다. */
export async function 빈_계정으로_바꾼다(page: Page): Promise<void> {
  const response = await page.request.post('/api/v1/auth/signup', {
    data: {
      email: `e2e-empty-${randomUUID()}@example.com`,
      password: 'e2e-password-1234',
      nickname: '빈계정',
    },
  });
  expect(response.status(), '빈 계정을 만들지 못했습니다').toBe(201);
}

/** 작업의 하위 자원을 바꾼다. `importance` 와 `my-day` 와 `completion` 이 대상이다. */
export async function 하위_자원을_바꾼다(
  request: APIRequestContext,
  taskId: string,
  segment: 'importance' | 'my-day' | 'completion',
  body: Record<string, unknown>,
): Promise<void> {
  const response = await request.patch(`/api/v1/tasks/${taskId}/${segment}`, { data: body });
  expect(response.status(), `${segment} 을 바꾸지 못했습니다`).toBe(204);
}
