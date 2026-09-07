import assert from 'node:assert/strict';
import test from 'node:test';
import { blockKey, commentBlocks } from '../src/pages/artifacts/detail/model/comment-blocks.ts';

test('반복된 문단과 이미지 표 코드의 원문 위치를 구분한다', () => {
  const body = '같은 문단\n\n같은 문단\n\n![이미지](https://example.test/a.png)\n\n| 열 |\n| --- |\n| 값 |\n\n```js\nconst x = 1;\n```';
  const blocks = commentBlocks(body);
  assert.equal(blocks.length, 5);
  assert.equal(body.slice(blocks[0].start, blocks[0].end), '같은 문단');
  assert.equal(body.slice(blocks[1].start, blocks[1].end), '같은 문단');
  assert.notEqual(blockKey(blocks[0].start, blocks[0].end), blockKey(blocks[1].start, blocks[1].end));
  assert.match(body.slice(blocks[2].start, blocks[2].end), /^!\[/);
  assert.match(body.slice(blocks[3].start, blocks[3].end), /^\| 열/);
  assert.match(body.slice(blocks[4].start, blocks[4].end), /^```js/);
});

test('CRLF와 이모지가 있어도 원문 범위를 유지하고 목록은 한 블록으로 선택한다', () => {
  const body = '😀 설명\r\n\r\n- 첫 항목\r\n- 두 번째 항목\r\n';
  const blocks = commentBlocks(body);
  assert.equal(blocks.length, 2);
  assert.equal(body.slice(blocks[0].start, blocks[0].end), '😀 설명');
  assert.equal(body.slice(blocks[1].start, blocks[1].end), '- 첫 항목\r\n- 두 번째 항목');
  assert.equal(commentBlocks('').length, 0);
});
