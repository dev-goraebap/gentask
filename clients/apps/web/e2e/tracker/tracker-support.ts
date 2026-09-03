import { type APIRequestContext, type Page, expect } from '@playwright/test';

// 트래커 E2E 테스트 공통 헬퍼 함수 모음이다.
// 테스트 준비 데이터는 화면 조작 대신 백엔드 API로 생성한다(결정-0008).

/**
 * 프로젝트를 생성하고 공개 식별자를 반환한다.
 * URL 경로는 시스템이 생성한 공개 식별자(NanoID)를 사용한다.
 */
export async function 프로젝트를_만든다(
  request: APIRequestContext,
  name: string,
  key = 'TS',
): Promise<string> {
  const response = await request.post('/api/v1/projects', { data: { name, key } });
  expect(response.status(), `프로젝트를 만들지 못했습니다: ${name}`).toBe(201);
  return 꼬리(response.headers()['location'] ?? '');
}

/** 회원 가입 시 기본 생성되는 프로젝트(PRJ-001 A3)의 공개 식별자를 조회한다. */
export async function 기본_프로젝트(request: APIRequestContext): Promise<string> {
  const response = await request.get('/api/v1/projects');
  expect(response.status(), '프로젝트 목록을 읽지 못했습니다').toBe(200);
  const [first] = (await response.json()) as { id: string }[];
  expect(first, '기본 프로젝트가 없습니다').toBeDefined();
  return first.id;
}

/** 작업 항목을 생성하고 표시 키(예: AB-1)를 반환한다. */
export async function 작업_아이템을_만든다(
  request: APIRequestContext,
  projectId: string,
  title: string,
  extra: Record<string, unknown> = {},
): Promise<string> {
  const response = await request.post(`/api/v1/projects/${projectId}/issues`, {
    data: { title, ...extra },
  });
  expect(response.status(), `작업 아이템을 만들지 못했습니다: ${title}`).toBe(201);
  // 프로젝트의 작업 키 접두어를 사용하여 작업 표시 키를 구성한다.
  const number = Number(꼬리(response.headers()['location'] ?? ''));
  const detail = await request.get(`/api/v1/projects/${projectId}/issues/${number}`);
  expect(detail.status(), `작업 아이템을 조회하지 못했습니다: ${title}`).toBe(200);
  return ((await detail.json()) as { summary: { key: string } }).summary.key;
}

/**
 * 서버가 내는 상세. 화면이 날짜까지만 그리는 값을 견줄 때 이쪽을 읽는다.
 *
 * 이름의 접두어로는 주소를 만들 수 없다. 접두어는 이슈 이름에만 쓰이고 주소가 담는 것은 프로젝트의
 * 식별자이므로, 부르는 쪽이 둘을 함께 넘긴다.
 */
export async function 작업_아이템을_읽는다(
  request: APIRequestContext,
  projectId: string,
  key: string,
): Promise<{ summary: { state: string; closedAt: string | null }; body: string }> {
  const response = await request.get(`/api/v1/projects/${projectId}/issues/${번호(key)}`);
  expect(response.status(), `작업 아이템을 읽지 못했습니다: ${key}`).toBe(200);
  return response.json();
}

/** URL 경로에서 마지막 세그먼트를 추출한다. */
function 꼬리(url: string): string {
  const normalized = url.replace(/\/+$/, '');
  const slash = normalized.lastIndexOf('/');
  return slash === -1 ? normalized : normalized.slice(slash + 1);
}

/** 작업 항목 키에서 일련번호를 파싱한다. */
export function 번호(key: string): number {
  const hyphen = key.lastIndexOf('-');
  return Number.parseInt(hyphen === -1 ? key : key.slice(hyphen + 1), 10);
}

/** 접두어와 일련번호를 조합하여 작업 표시 키를 생성한다. */
export function 이름(prefix: string, number: number): string {
  return `${prefix}-${number}`;
}

/**
 * 마크다운 에디터 요소다.
 * 에디터 컨테이너가 DOM에 마운트된 후 활성화된다.
 */
export function 본문칸(page: Page) {
  return page.locator('#markdown-editor-body [contenteditable="true"]');
}

/** 본문 영역의 기존 내용을 지우고 새 내용을 입력한다. */
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
