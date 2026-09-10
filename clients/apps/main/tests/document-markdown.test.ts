import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
for (const name of ['window','document','DOMParser','HTMLElement','HTMLInputElement','HTMLTableElement','Element','Node','Text','DocumentFragment','MutationObserver']) Object.defineProperty(globalThis, name, {value: name === 'window' ? dom.window : dom.window[name as keyof typeof dom.window], configurable:true});
const { createEditor } = await import('lexical');
const { nodes } = await import('../src/shared/ui/document-editor/config');
const { importMarkdown, exportMarkdown } = await import('../src/shared/ui/document-editor/content');

function roundTrip(source: string) {
  const editor = createEditor({nodes, onError:error => {throw error;}});
  editor.update(() => importMarkdown(editor, source), {discrete:true});
  return editor.getEditorState().read(() => exportMarkdown(editor));
}

test('문서 서식과 첨부 주소를 Markdown 왕복 변환에서 보존한다', () => {
  const source = '# 제목\n\n**굵게** *기울임* ~~취소선~~ ==형광펜== [문서](./other.md)\n\n![그림](/image.png)\n\n> 인용\n\n- [x] 완료\n- [ ] 대기\n\n```typescript\nconst value = 1;\n```\n\n| 항목 | 값 |\n| --- | --- |\n| 이름 | Gentask |';
  const output = roundTrip(source);
  for (const fragment of ['# 제목','**굵게**','~취소선~','==형광펜==','[문서](./other.md)','![그림](/image.png)','[x] 완료','[ ] 대기','```typescript','const value = 1;','Gentask']) assert.ok(output.includes(fragment), fragment + '\n' + output);
  assert.match(output, /\|.*항목.*\|/);
  assert.equal(roundTrip(output), output);
});
test('빈 문서는 저장 가능한 빈 문단으로 불러온다', () => assert.equal(roundTrip(''), ''));
