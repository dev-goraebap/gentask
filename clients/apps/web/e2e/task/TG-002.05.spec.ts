import type { Page } from '@playwright/test';

import { 빈_계정으로_바꾼다, 작업을_만든다, 하위_자원을_바꾼다, expect, test } from '../fixtures';

// TG-002.05 순서를 골라 작업 보기

function 날짜(더할일수: number): string {
  const date = new Date();
  date.setDate(date.getDate() + 더할일수);
  return date.toISOString().slice(0, 10);
}

// 사이드바의 스마트 목록도 listitem 이므로 작업 링크만 집는다.
async function 제목들(page: Page): Promise<string[]> {
  const 목록 = await page.locator('a[id^="task-"]').allTextContents();
  return 목록.map((t) => t.trim());
}

async function 기준을_고른다(page: Page, 기준: string): Promise<void> {
  await page.getByRole('button', { name: '정렬', exact: true }).click();
  await page.getByRole('button', { name: 기준, exact: true }).click();
}

test.describe('TG-002.05 순서를 골라 작업 보기', () => {
  // AC1 — 기준이 다섯이므로 파라미터화한다. 인수 조건은 하나다.
  const 기준별_준비 = [
    {
      기준: '중요도',
      async 준비(page: Page) {
        const 앞 = await 작업을_만든다(page.request, '중요한 것');
        await 작업을_만든다(page.request, '중요하지 않은 것');
        await 하위_자원을_바꾼다(page.request, 앞, 'importance', { important: true });
      },
      기대: ['중요한 것', '중요하지 않은 것'],
    },
    {
      기준: '기한',
      async 준비(page: Page) {
        await 작업을_만든다(page.request, '가까운 기한', { dueDate: 날짜(1) });
        await 작업을_만든다(page.request, '먼 기한', { dueDate: 날짜(7) });
      },
      기대: ['가까운 기한', '먼 기한'],
    },
    {
      기준: '나의 하루에 추가됨',
      async 준비(page: Page) {
        const 앞 = await 작업을_만든다(page.request, '담은 것');
        await 작업을_만든다(page.request, '담지 않은 것');
        await 하위_자원을_바꾼다(page.request, 앞, 'my-day', { inMyDay: true });
      },
      기대: ['담은 것', '담지 않은 것'],
    },
    {
      기준: '제목',
      async 준비(page: Page) {
        await 작업을_만든다(page.request, '나중에 오는 제목');
        await 작업을_만든다(page.request, '가장 먼저 오는 제목');
      },
      기대: ['가장 먼저 오는 제목', '나중에 오는 제목'],
    },
    {
      기준: '만든 날짜',
      async 준비(page: Page) {
        await 작업을_만든다(page.request, '먼저 만든 것');
        await 작업을_만든다(page.request, '나중에 만든 것');
      },
      // 만든 날짜는 이미 기본 기준이므로 고르면 방향이 뒤집혀 오래된 것부터 온다.
      기대: ['먼저 만든 것', '나중에 만든 것'],
    },
  ];

  for (const { 기준, 준비, 기대 } of 기준별_준비) {
    test(`TG-002.05 #1: ${기준}을 고르면 그 기준으로 늘어놓는다`, async ({ page }) => {
      await 빈_계정으로_바꾼다(page);
      await 준비(page);
      await page.goto('/tasks/all');

      await 기준을_고른다(page, 기준);

      await expect.poll(() => 제목들(page)).toEqual(기대);
    });
  }

  test('TG-002.05 #2: 같은 기준을 다시 고르면 방향을 뒤집는다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await 작업을_만든다(page.request, '나중에 오는 제목');
    await 작업을_만든다(page.request, '가장 먼저 오는 제목');
    await page.goto('/tasks/all');

    await 기준을_고른다(page, '제목');
    await expect.poll(() => 제목들(page)).toEqual(['가장 먼저 오는 제목', '나중에 오는 제목']);

    await 기준을_고른다(page, '제목');
    await expect.poll(() => 제목들(page)).toEqual(['나중에 오는 제목', '가장 먼저 오는 제목']);
  });

  test('TG-002.05 #3: 기준 값이 없는 작업을 뒤에 둔다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await 작업을_만든다(page.request, '기한 없는 것');
    await 작업을_만든다(page.request, '기한 있는 것', { dueDate: 날짜(3) });
    await page.goto('/tasks/all');

    await 기준을_고른다(page, '기한');

    await expect.poll(() => 제목들(page)).toEqual(['기한 있는 것', '기한 없는 것']);
  });

  test('TG-002.05 #4: 기준을 고르지 않았으면 만든 날짜 최근 것부터 보여 준다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await 작업을_만든다(page.request, '먼저 만든 것');
    await 작업을_만든다(page.request, '나중에 만든 것');

    await page.goto('/tasks/all');

    await expect.poll(() => 제목들(page)).toEqual(['나중에 만든 것', '먼저 만든 것']);
  });
});
