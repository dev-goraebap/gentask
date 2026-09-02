import { Editor } from '@tiptap/core';
import { TaskItem } from '@tiptap/extension-task-item';
import { Placeholder } from '@tiptap/extensions';
import { TaskList } from '@tiptap/extension-task-list';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

/**
 * TipTap 을 세우는 자리.
 *
 * <p>파일을 갈라 둔 것은 <b>늦게 싣기 위해서다.</b> 컴포넌트가 이것을 동적으로 부르므로 TipTap 과
 * ProseMirror 가 첫 묶음에서 빠지고, 적는 자리를 여는 사람만 그 값을 치른다.
 */
export function createEditor(
  host: HTMLElement,
  content: string,
  placeholder: string,
  onChange: (markdown: string) => void,
  onStateChange: () => void,
): Editor {
  const editor = new Editor({
    element: host,
    extensions: [
      StarterKit,
      TaskList,
      // 인수 조건이 중첩되는 자리는 아직 없으나, 중첩을 막으면 붙여넣은 것이 조용히 평평해진다.
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({
        // 목록 항목 사이에 빈 줄을 넣지 않는다. 넣으면 손대지 않은 항목까지 저장할 때마다 다시 쓰인다.
        tightLists: true,
        // 적은 그대로 담는다. 마크다운이 원본이므로 편집기가 임의로 다듬지 않는다.
        linkify: false,
        breaks: false,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        // 읽는 자리와 같은 서식을 입는다. 쓰는 화면과 읽는 화면이 달라 보이면 적으면서 결과를
        // 가늠하지 못한다.
        class: 'doc-body prose max-w-none outline-none',
      },
    },
    onUpdate: ({ editor: current }) => onChange(readMarkdown(current)),
    // 무엇이 켜져 있는지가 커서 자리마다 다르다. 단추의 눌린 모습이 그것을 따라가야 한다.
    onSelectionUpdate: onStateChange,
    onTransaction: onStateChange,
  });

  return editor;
}

/**
 * 편집기가 담고 있는 마크다운.
 *
 * <p>`tiptap-markdown` 이 TipTap 3 의 저장소 타입을 넓히지 않아 여기서 한 번만 좁힌다. 손대는 자리를
 * 하나로 모아 두면 그 패키지가 타입을 갖추는 날 이 줄만 걷으면 된다.
 */
export function readMarkdown(editor: Editor): string {
  const storage = editor.storage as unknown as { markdown: { getMarkdown(): string } };
  return storage.markdown.getMarkdown();
}

export type { Editor };
