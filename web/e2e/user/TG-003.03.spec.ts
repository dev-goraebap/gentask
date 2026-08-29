import { 빈_계정으로_바꾼다, expect, test } from '../fixtures';

// TG-003.03 프로필 이미지 올리기
//
// 올리기는 서버가 내준 presigned PUT 으로 브라우저가 보관소에 직접 보낸다.
// 종단 테스트도 그 경로를 그대로 지나며 로컬에서는 MinIO 가 받는다.

/** 1×1 PNG. 형식만 성립하면 되므로 가장 작은 것을 쓴다. */
const 작은_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

interface 고를_파일 {
  readonly name: string;
  readonly mimeType: string;
  readonly buffer: Buffer;
}

/** 상한이 1MB 이므로 그것을 한 바이트 넘긴다. */
const 큰_PNG: 고를_파일 = {
  name: 'big.png',
  mimeType: 'image/png',
  buffer: Buffer.alloc(1024 * 1024 + 1),
};

const 이미지가_아닌_파일: 고를_파일 = {
  name: 'note.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('이미지가 아니다'),
};

/** 인수 조건이 트리거 둘을 열거하므로 한 시나리오가 둘을 받는다. */
const 거절될_파일: readonly {
  readonly 사유: string;
  readonly 파일: 고를_파일;
  readonly 문구: string;
}[] = [
  { 사유: '이미지가 아니면', 파일: 이미지가_아닌_파일, 문구: '업로드 가능 형식' },
  { 사유: '1MB 를 넘으면', 파일: 큰_PNG, 문구: '업로드 허용 용량 초과' },
];

/** Uppy 대화상자를 열고 파일을 고른다. 올리기는 부르는 쪽이 정한다. */
async function 이미지를_고른다(
  page: import('@playwright/test').Page,
  파일: 고를_파일,
): Promise<void> {
  await page.getByRole('button', { name: '이미지 올리기' }).click();
  await page.locator('.uppy-Dashboard-input').first().setInputFiles(파일);
}

async function 이미지를_올린다(page: import('@playwright/test').Page): Promise<void> {
  await 이미지를_고른다(page, { name: 'avatar.png', mimeType: 'image/png', buffer: 작은_PNG });
  await page.getByRole('button', { name: /파일 업로드/ }).click();
}

function 아바타(page: import('@playwright/test').Page) {
  return page.getByRole('main').locator('app-user-avatar');
}

test.describe('TG-003.03 프로필 이미지 올리기', () => {
  test('TG-003.03 #1: 이미지를 올리면 아바타 자리에 그 이미지가 온다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await page.goto('/account');

    await 이미지를_올린다(page);

    await expect(아바타(page).locator('img')).toBeVisible();
  });

  test('TG-003.03 #3: 이미지를 지우면 아바타가 이니셜로 돌아온다', async ({ page }) => {
    await 빈_계정으로_바꾼다(page);
    await page.goto('/account');
    await 이미지를_올린다(page);
    await expect(아바타(page).locator('img')).toBeVisible();

    await page.getByRole('button', { name: '이미지 지우기' }).click();

    await expect(아바타(page).locator('img')).toHaveCount(0);
    await expect(아바타(page)).toHaveText('빈');
  });

  for (const { 사유, 파일, 문구 } of 거절될_파일) {
    test(`TG-003.03 #2: ${사유} 아바타 자리가 그대로 남는다`, async ({ page }) => {
      await 빈_계정으로_바꾼다(page);
      await page.goto('/account');

      await 이미지를_고른다(page, 파일);

      // 거절된 파일은 목록에 들어가지 않으므로 올리기 버튼 자체가 서지 않는다.
      await expect(page.getByRole('button', { name: /파일 업로드/ })).toHaveCount(0);
      await expect(아바타(page).locator('img')).toHaveCount(0);
    });

    test(`TG-003.03 #4: ${사유} 거절 사유를 알린다`, async ({ page }) => {
      await 빈_계정으로_바꾼다(page);
      await page.goto('/account');

      await 이미지를_고른다(page, 파일);

      // Uppy 는 같은 알림을 대화상자와 진행 표시줄에 하나씩 그린다.
      await expect(page.getByRole('alert').filter({ hasText: 문구 }).first()).toBeVisible();
    });
  }
});
