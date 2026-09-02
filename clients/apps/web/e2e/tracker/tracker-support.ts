import { type APIRequestContext, type Page, expect } from '@playwright/test';

// 트래커의 Story 넷(TG-042 · TG-043 · TG-044 · TG-055)이 함께 쓴다.
//
// 준비 데이터는 화면 조작이 아니라 API 로 만든다(결정-0008). 세울 수 있음을 확인하는 것은 그
// Story 의 시나리오 하나가 하고, 나머지 시나리오는 이미 서 있는 것을 놓고 시작한다.

/**
 * 프로젝트를 세우고 그 접두어를 낸다.
 *
 * <p>접두어는 이름에서 뽑히므로 부르는 쪽이 정하지 못한다. 겹치면 뒤에 숫자가 붙는데(PRJ-001 A2)
 * 그 규칙을 시험이 다시 흉내 내면 규칙이 두 곳에 생긴다. 세운 뒤 돌려받은 것을 쓴다.
 */
export async function 프로젝트를_만든다(
  request: APIRequestContext,
  name: string,
): Promise<string> {
  const response = await request.post('/api/v1/projects', { data: { name } });
  expect(response.status(), `프로젝트를 만들지 못했습니다: ${name}`).toBe(201);
  return 꼬리(response.headers()['location'] ?? '');
}

/** 작업 아이템을 세우고 사람이 부르는 이름(`AB-001`)을 낸다. */
export async function 작업_아이템을_만든다(
  request: APIRequestContext,
  projectKey: string,
  title: string,
  extra: Record<string, unknown> = {},
): Promise<string> {
  const response = await request.post(`/api/v1/projects/${projectKey}/issues`, {
    data: { title, ...extra },
  });
  expect(response.status(), `작업 아이템을 만들지 못했습니다: ${title}`).toBe(201);
  return 이름(projectKey, Number(꼬리(response.headers()['location'] ?? '')));
}

/** 서버가 내는 상세. 화면이 날짜까지만 그리는 값을 견줄 때 이쪽을 읽는다. */
export async function 작업_아이템을_읽는다(
  request: APIRequestContext,
  key: string,
): Promise<{ summary: { state: string; closedAt: string | null }; body: string }> {
  const projectKey = key.slice(0, key.lastIndexOf('-'));
  const response = await request.get(
    `/api/v1/projects/${projectKey}/issues/${번호(key)}`,
  );
  expect(response.status(), `작업 아이템을 읽지 못했습니다: ${key}`).toBe(200);
  return response.json();
}

/** 접두어와 번호를 사람이 부르는 이름으로 잇는다. 붙이는 규칙은 서버가 갖는다. */
export function 이름(projectKey: string, number: number): string {
  return `${projectKey}-${String(number).padStart(3, '0')}`;
}

export function 번호(key: string): number {
  return Number(key.slice(key.lastIndexOf('-') + 1));
}

/**
 * 마크다운을 적는 자리.
 *
 * <p>브라우저에서는 편집기가 `inputId` 를 쓰지 않는다. 그 값은 스크립트가 서기 전의 textarea 가
 * 받는 것이고, 선 뒤에는 이 자리가 대신한다.
 */
export function 본문칸(page: Page) {
  return page.locator('#markdown-editor-body [contenteditable="true"]');
}

/** 적혀 있던 것을 지우고 새로 적는다. */
export async function 본문을_적는다(page: Page, 내용: string): Promise<void> {
  const 칸 = 본문칸(page);
  await expect(칸).toBeVisible();
  await 칸.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  if (내용 !== '') await page.keyboard.type(내용);
}

/**
 * 인수 조건 한 줄을 적는다.
 *
 * <p>`- [ ] ` 를 손으로 치지 않는다. 편집기가 입력 규칙으로 그것을 체크 항목으로 바꾸는지가 이
 * 시나리오가 보려는 것이 아니며, 도구 단추를 쓰면 무엇을 눌렀는지가 시험에 남는다.
 */
export async function 인수_조건을_적는다(page: Page, 문장: string): Promise<void> {
  await 본문을_적는다(page, '');
  await page.getByRole('button', { name: '체크 항목' }).click();
  await page.keyboard.type(문장);
}

function 꼬리(location: string): string {
  return location.slice(location.lastIndexOf('/') + 1);
}
