import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QueryClient, QueryObserver, isCancelledError } from '@tanstack/react-query';
import { sessionOptions } from '../src/entities/session/api/session';

test('화면이 사라져도 라우터가 기다리는 로그인 확인은 완료된다', async context => {
  let respond!: (response: Response) => void;
  const response = new Promise<Response>(resolve => { respond = resolve; });
  const fetch = context.mock.method(globalThis, 'fetch', () => response);
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  try {
    const observer = new QueryObserver(client, sessionOptions());
    const unsubscribe = observer.subscribe(() => {});
    const navigation = client.fetchQuery(sessionOptions()).then(
      data => ({ data, error: undefined }),
      error => ({ data: undefined, error }),
    );
    unsubscribe();
    respond(new Response(JSON.stringify({ id: 'existing-user', nickname: '소유자' })));
    const result = await navigation;
    assert.equal(result.error, undefined);
    assert.equal(result.data?.id, 'existing-user');
    assert.equal(fetch.mock.callCount(), 1);
  } finally { client.clear(); }
});

test('로그아웃으로 명시적으로 취소하면 로그인 확인도 취소된다', async context => {
  let respond!: (response: Response) => void;
  const response = new Promise<Response>(resolve => { respond = resolve; });
  context.mock.method(globalThis, 'fetch', () => response);
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  try {
    const navigation = client.fetchQuery(sessionOptions()).then(() => undefined, error => error);
    await client.cancelQueries();
    respond(new Response(JSON.stringify({ id: 'old-user' })));
    assert.ok(isCancelledError(await navigation));
    assert.equal(client.getQueryData(sessionOptions().queryKey), undefined);
  } finally { client.clear(); }
});
