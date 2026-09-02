import { readFile } from 'node:fs/promises';
import { 작업을_만든다, expect, test } from '../fixtures';

// GT-32 작업에 파일 붙이기
//
// 올리기는 presigned PUT, 받기는 presigned GET 이며 브라우저가 보관소와 직접 주고받는다.
// 제한은 Uppy 가 먼저 알리고 서버가 붙임 확정에서 강제한다. 이 시나리오는 앞쪽을 지난다.

interface 고를_파일 {
  readonly name: string;
  readonly mimeType: string;
  readonly buffer: Buffer;
}

function 텍스트_파일(name: string, 내용: string): 고를_파일 {
  return { name, mimeType: 'text/plain', buffer: Buffer.from(내용, 'utf8') };
}

/** 상한이 10MB 이므로 그것을 한 바이트 넘긴다. */
const 큰_파일: 고를_파일 = {
  name: 'big.bin',
  mimeType: 'application/octet-stream',
  buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
};

/** 상한이 작업당 5개이므로 여섯을 한 번에 고른다. */
const 여섯_파일: readonly 고를_파일[] = Array.from({ length: 6 }, (_, index) =>
  텍스트_파일(`file-${index}.txt`, `내용 ${index}`),
);

/**
 * 인수 조건이 트리거 둘을 열거하므로 한 시나리오가 둘을 받는다.
 * 개수를 넘긴 붙임은 남는 만큼만 담기는 것이 아니라 통째로 거절된다.
 */
const 거절될_붙임: readonly {
  readonly 사유: string;
  readonly 파일들: readonly 고를_파일[];
  readonly 문구: string;
}[] = [
  { 사유: '각 10MB 를 넘으면', 파일들: [큰_파일], 문구: '업로드 허용 용량 초과' },
  { 사유: '작업당 5개를 넘으면', 파일들: 여섯_파일, 문구: '개의 파일만 업로드할 수 있습니다' },
];

async function 상세를_연다(
  page: import('@playwright/test').Page,
  제목: string,
): Promise<void> {
  await page.goto('/todo/all');
  await page.getByRole('link', { name: 제목 }).click();
  await expect(page.getByRole('button', { name: /파일 추가/ })).toBeVisible();
}

/** Uppy 대화상자를 열고 파일을 고른다. 올리기는 부르는 쪽이 정한다. */
async function 파일을_고른다(
  page: import('@playwright/test').Page,
  파일들: readonly 고를_파일[],
): Promise<void> {
  await page.getByRole('button', { name: /파일 추가/ }).click();
  await page.locator('.uppy-Dashboard-input').first().setInputFiles([...파일들]);
}

async function 파일을_붙인다(
  page: import('@playwright/test').Page,
  파일들: readonly 고를_파일[],
): Promise<void> {
  await 파일을_고른다(page, 파일들);
  await page.getByRole('button', { name: /파일 업로드/ }).click();
}

test.describe('GT-32 작업에 파일 붙이기', () => {
  test('GT-32 #1: 파일을 붙이면 목록에 이름과 크기가 온다', async ({ page, request }) => {
    await 작업을_만든다(request, '파일을 붙일 작업');
    await 상세를_연다(page, '파일을 붙일 작업');

    await 파일을_붙인다(page, [
      { name: '설계.txt', mimeType: 'text/plain', buffer: Buffer.alloc(2048) },
    ]);

    await expect(page.getByRole('link', { name: '설계.txt' })).toBeVisible();
    await expect(page.getByText('2KB')).toBeVisible();
  });

  test('GT-32 #3: 붙인 파일을 받으면 올린 그것이 그 이름으로 온다', async ({ page, request }) => {
    const 원본 = 텍스트_파일('회의록.txt', '올린 그대로 와야 한다');
    await 작업을_만든다(request, '파일을 받을 작업');
    await 상세를_연다(page, '파일을 받을 작업');
    await 파일을_붙인다(page, [원본]);
    await expect(page.getByRole('link', { name: 원본.name })).toBeVisible();

    const [받은것] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 원본.name }).click(),
    ]);

    expect(받은것.suggestedFilename()).toBe(원본.name);
    const 경로 = await 받은것.path();
    expect(await readFile(경로)).toEqual(원본.buffer);
  });

  test('GT-32 #4: 파일을 떼면 목록과 보관소에서 함께 사라진다', async ({ page, request }) => {
    await 작업을_만든다(request, '파일을 뗄 작업');
    await 상세를_연다(page, '파일을 뗄 작업');
    await 파일을_붙인다(page, [텍스트_파일('버릴것.txt', '지워질 내용')]);
    const 주소 = await page.getByRole('link', { name: '버릴것.txt' }).getAttribute('href');
    expect(주소).not.toBeNull();

    await page.getByRole('button', { name: '버릴것.txt 떼기' }).click();

    await expect(page.getByRole('link', { name: '버릴것.txt' })).toHaveCount(0);
    const 보관소 = await page.request.get(주소 ?? '');
    expect(보관소.status(), '보관소에 객체가 남아 있습니다').toBe(404);
  });

  for (const { 사유, 파일들, 문구 } of 거절될_붙임) {
    test(`GT-32 #2: ${사유} 그 붙임이 목록에 담기지 않는다`, async ({ page, request }) => {
      await 작업을_만든다(request, `거절될 붙임 ${사유}`);
      await 상세를_연다(page, `거절될 붙임 ${사유}`);

      await 파일을_고른다(page, 파일들);

      await expect(page.locator('.uppy-Dashboard-Item')).toHaveCount(0);
    });

    test(`GT-32 #5: ${사유} 거절 사유를 알린다`, async ({ page, request }) => {
      await 작업을_만든다(request, `사유를 알릴 붙임 ${사유}`);
      await 상세를_연다(page, `사유를 알릴 붙임 ${사유}`);

      await 파일을_고른다(page, 파일들);

      // Uppy 는 같은 알림을 대화상자와 진행 표시줄에 하나씩 그린다.
      await expect(page.getByRole('alert').filter({ hasText: 문구 }).first()).toBeVisible();
    });
  }
});
