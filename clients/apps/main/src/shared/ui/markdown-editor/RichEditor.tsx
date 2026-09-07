import { Button, HStack, VStack } from '@astryxdesign/core';
import { Editor } from '@tiptap/core';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';
import { Markdown } from 'tiptap-markdown';


export function RichEditor({ initialValue, onChange }: { initialValue: string; onChange: (value: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  const initial = useRef(initialValue);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [, refresh] = useState(0);
  useEffect(() => {
    if (!host.current) return;
    const instance = new Editor({
      element: host.current,
      extensions: [StarterKit.configure({ link: { openOnClick: false } }), TaskList, TaskItem.configure({ nested: true, a11y: { checkboxLabel: (node) => node.textContent || '체크 항목' } }),
        Placeholder.configure({ placeholder: '무엇이든 자유롭게 적어보세요…' }),
        Markdown.configure({ html: false, tightLists: true, linkify: false, breaks: false, transformPastedText: true })],
      content: initial.current,
      editorProps: { attributes: { role: 'textbox', 'aria-label': '내용', 'aria-multiline': 'true', class: 'drawer-rich-content' } },
      onUpdate: ({ editor: current }) => callback.current((current.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown()),
      onTransaction: () => refresh((n) => n + 1),
    });
    setEditor(instance);
    return () => instance.destroy();
  }, []);
  const actions = editor ? [
    { label: '제목', active: editor.isActive('heading'), run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: '굵게', active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
    { label: '기울임', active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run() },
    { label: '목록', active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: '체크 목록', active: editor.isActive('taskList'), run: () => editor.chain().focus().toggleTaskList().run() },
    { label: '인용', active: editor.isActive('blockquote'), run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: '코드', active: editor.isActive('codeBlock'), run: () => editor.chain().focus().toggleCodeBlock().run() },
  ] : [];
  return <VStack gap={3}>
    <HStack gap={1} wrap="wrap" role="group" aria-label="본문 서식">
      {actions.map((action) => <Button key={action.label} label={action.label} size="sm" variant={action.active ? 'secondary' : 'ghost'} aria-pressed={action.active}
        onMouseDown={(e) => e.preventDefault()} onClick={action.run} />)}
      <Button label="되돌리기" size="sm" variant="ghost" isDisabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()} />
    </HStack>
    <VStack ref={host} className="drawer-editor" />
  </VStack>;
}
