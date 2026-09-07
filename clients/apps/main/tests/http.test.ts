import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { ApiError, createdId, get, request } from '../src/shared/api/http.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('204 응답에 JSON 본문을 요구하지 않고 쿠키와 AbortSignal을 전달한다', async () => {
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/auth/logout');
    assert.equal(options?.credentials, 'same-origin');
    assert.equal(options?.signal, controller.signal);
    return new Response(null, { status: 204 });
  };
  assert.equal((await request('/auth/logout', { method: 'POST', signal: controller.signal })).data, undefined);
});

test('본문 없는 201 응답의 Location에서 식별자를 읽는다', async () => {
  globalThis.fetch = async () => new Response(null, { status: 201, headers: { Location: '/api/v1/projects/project-id' } });
  const response = await request('/projects', { method: 'POST', body: JSON.stringify({ name: '검증', key: 'TEST' }) });
  assert.equal(createdId(response.location), 'project-id');
});

test('권한 오류의 상태와 RFC 9457 메시지를 보존한다', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: '접근 권한이 없습니다', code: 'FORBIDDEN' }), { status: 403 });
  await assert.rejects(get('/projects/private'), error => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 403);
    assert.equal(error.code, 'FORBIDDEN');
    assert.equal(error.message, '접근 권한이 없습니다');
    return true;
  });
});

test('프록시의 HTML 오류 응답도 API 오류로 처리한다', async () => {
  globalThis.fetch = async () => new Response('<html>Bad Gateway</html>', { status: 502 });
  await assert.rejects(get('/projects'), error => error instanceof ApiError && error.status === 502);
});

test('취소된 조회를 빈 결과나 API 오류로 변환하지 않는다', async () => {
  const controller = new AbortController();
  controller.abort();
  globalThis.fetch = async (_url, options) => { options?.signal?.throwIfAborted(); return new Response('[]'); };
  await assert.rejects(get('/projects', controller.signal), error => error instanceof DOMException && error.name === 'AbortError');
});
