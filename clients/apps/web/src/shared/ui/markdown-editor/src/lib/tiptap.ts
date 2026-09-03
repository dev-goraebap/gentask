import { Editor } from '@tiptap/core';
import { TaskItem } from '@tiptap/extension-task-item';
import { Placeholder } from '@tiptap/extensions';
import { TaskList } from '@tiptap/extension-task-list';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

/**
 * TipTap 을 세우는 자리.
 *
 * 파일을 갈라 둔 것은 늦게 싣기 위해서다. 컴포넌트가 이것을 동적으로 부르므로 TipTap 과
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
      // 인수 조건 중첩 지원을 위해 nested 설정을 활성화한다.
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({
        // 목록 항목 사이에 불필요한 빈 줄이 삽입되지 않도록 설정한다.
        tightLists: true,
        // 원본 마크다운을 보존하기 위해 자동 링크 및 임의 줄바꿈 변환을 비활성화한다.
        linkify: false,
        breaks: false,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        // 뷰어와 동일한 typography 스타일을 적용한다.
        class: 'doc-body prose max-w-none outline-none',
      },
    },
    onUpdate: ({ editor: current }) => onChange(readMarkdown(current)),
    // 커서 위치 변경 시 툴바 활성 상태를 동기화한다.
    onSelectionUpdate: onStateChange,
    onTransaction: onStateChange,
  });

  return editor;
}

/**
 * 에디터 인스턴스로부터 마크다운 텍스트를 추출한다.
 */
export function readMarkdown(editor: Editor): string {
  const storage = editor.storage as unknown as { markdown: { getMarkdown(): string } };
  return storage.markdown.getMarkdown();
}

export type { Editor };
