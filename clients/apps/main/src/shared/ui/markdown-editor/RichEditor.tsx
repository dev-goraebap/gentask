import { Button, HStack, VStack } from '@astryxdesign/core';
import { Editor } from '@tiptap/core';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Markdown } from 'tiptap-markdown';


export interface RichEditorHandle { focus: () => void; clear: () => void }

export function RichEditor({ initialValue = '', onChange, hasToolbar = true, label = '내용', placeholder = '무엇이든 자유롭게 적어보세요…', isDisabled = false, paragraphAfterHeading = false, onFiles, onSubmit, handleRef }: {
  initialValue?: string; onChange: (value: string) => void;
  hasToolbar?: boolean; label?: string; placeholder?: string; isDisabled?: boolean;
  paragraphAfterHeading?: boolean;
  onFiles?: (files: File[]) => void; onSubmit?: () => void; handleRef?: Ref<RichEditorHandle>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  const initial = useRef(initialValue);

  const handlers = useRef({ onFiles, onSubmit, isDisabled, hasToolbar, paragraphAfterHeading });
  handlers.current = { onFiles, onSubmit, isDisabled, hasToolbar, paragraphAfterHeading };
  const [editor, setEditor] = useState<Editor | null>(null);
  const [, refresh] = useState(0);
  useImperativeHandle(handleRef, () => ({ focus: () => { editor?.commands.focus(); }, clear: () => { editor?.commands.clearContent(); } }), [editor]);
  useEffect(() => {
    if (!host.current) return;
    const instance: Editor = new Editor({
      element: host.current,
      extensions: [StarterKit.configure({ link: { openOnClick: false }, trailingNode: paragraphAfterHeading ? false : {} }), TaskList, TaskItem.configure({ nested: true, a11y: { checkboxLabel: (node) => node.textContent || '체크 항목' } }),
        Placeholder.configure({ placeholder }),
        Markdown.configure({ html: false, tightLists: true, linkify: false, breaks: false, transformPastedText: true })],
      content: initial.current,
      editable: !handlers.current.isDisabled,
      editorProps: {
        attributes: { role: 'textbox', 'aria-label': label, 'aria-multiline': 'true', class: 'drawer-rich-content' },
        handleKeyDown: (_view, event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing && event.keyCode !== 229 && handlers.current.onSubmit) {
            event.preventDefault();
            if (!handlers.current.isDisabled) handlers.current.onSubmit();
            return true;
          }
          if (handlers.current.paragraphAfterHeading && !handlers.current.isDisabled &&
              event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey &&
              !event.isComposing && event.keyCode !== 229) {
            const { $from, $to } = instance.state.selection;
            if ($from.parent.type.name === 'heading' && $from.sameParent($to)) {
              const chain = instance.chain();
              if ($from.parent.content.size > 0) chain.splitBlock({ keepMarks: false });
              return chain.command(({ tr }) => {
                const cursor = tr.selection.$from;
                if (cursor.parent.type.name === 'heading') tr.setNodeMarkup(cursor.before(), instance.schema.nodes.paragraph);
                tr.setStoredMarks([]);
                return true;
              }).run();
            }
          }
          return false;
        },
        handlePaste: (_view, event) => {
          const files = Array.from(event.clipboardData?.files ?? []);
          if (!files.length || !handlers.current.onFiles) return false;
          event.preventDefault();
          if (!handlers.current.isDisabled) handlers.current.onFiles(files);
          return true;
        },
        handleDrop: (_view, event) => {
          const files = Array.from(event.dataTransfer?.files ?? []);
          if (!files.length || !handlers.current.onFiles) return false;
          event.preventDefault();
          if (!handlers.current.isDisabled) handlers.current.onFiles(files);
          return true;
        },
      },
      onUpdate: ({ editor: current }) => {
        const markdown = (current.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown();


        callback.current(markdown);
      },
      onTransaction: () => { if (handlers.current.hasToolbar) refresh((n) => n + 1); },
    });
    setEditor(instance);
    return () => instance.destroy();
  }, []);
  useEffect(() => {
    editor?.setEditable(!isDisabled, false);
  }, [editor, isDisabled]);
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
    {hasToolbar ? <HStack gap={1} wrap="wrap" role="group" aria-label="본문 서식">
      {actions.map((action) => <Button key={action.label} label={action.label} size="sm" variant={action.active ? 'secondary' : 'ghost'} aria-pressed={action.active}
        onMouseDown={(e) => e.preventDefault()} onClick={action.run} />)}
      <Button label="되돌리기" size="sm" variant="secondary" isDisabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()} />
    </HStack> : null}
    <VStack ref={host} className="drawer-editor" />
  </VStack>;
}
