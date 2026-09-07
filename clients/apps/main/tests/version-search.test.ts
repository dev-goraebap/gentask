import assert from 'node:assert/strict';
import test from 'node:test';
import { parseVersionSearch } from '../src/entities/artifact/model/version-search.ts';

test('버전이 없는 주소는 최신 문서를 조회한다', () => {
  assert.equal(parseVersionSearch(undefined), undefined);
});

test('주소의 버전 번호를 숫자로 변환한다', () => {
  assert.equal(parseVersionSearch('3'), 3);
  assert.equal(parseVersionSearch(3), 3);
});

test('잘못된 버전을 최신 문서로 대체하지 않는다', () => {
  for (const value of ['', 'v3', '0', '-1', '1.5', '1e2', '03', true, null, [], '2147483648']) {
    assert.throws(() => parseVersionSearch(value));
  }
});
