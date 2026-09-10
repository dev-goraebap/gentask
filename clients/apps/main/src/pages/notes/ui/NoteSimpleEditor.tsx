import { useEffect, useRef } from 'react';
import { EditorContent, EditorContext, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from 'tiptap-markdown';
import { NoteSimpleToolbar } from './NoteSimpleToolbar';
import './note-simple-editor.scss';

interface NoteSimpleEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
}

export function NoteSimpleEditor({ initialValue, onChange, isDisabled = false }: NoteSimpleEditorProps) {
  const change = useRef(onChange);
  useEffect(() => { change.current = onChange; }, [onChange]);

  const editor: Editor | null = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false }, underline: false, trailingNode: false }),
      TaskList,
      TaskItem.configure({ nested: true, a11y: { checkboxLabel: node => node.textContent || '체크 항목' } }),
      Placeholder.configure({ placeholder: '내용을 적어보세요' }),
      Markdown.configure({ html: false, tightLists: true, linkify: false, breaks: false, transformPastedText: true }),
    ],
    content: initialValue,
    editable: !isDisabled,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': '메모 본문',
        'aria-multiline': 'true',
        class: 'drawer-rich-content simple-editor',
      },
      handleKeyDown: (view, event) => {
        if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey
          || event.isComposing || event.keyCode === 229 || !view.editable) return false;
        const { $from, $to } = view.state.selection;
        if ($from.parent.type.name !== 'heading' || !$from.sameParent($to)) return false;
        const chain = editor?.chain();
        if (!chain) return false;
        if ($from.parent.content.size > 0) chain.splitBlock({ keepMarks: false });
        return chain.command(({ tr }) => {
          const cursor = tr.selection.$from;
          if (cursor.parent.type.name === 'heading') {
            tr.setNodeMarkup(cursor.before(), view.state.schema.nodes.paragraph);
          }
          tr.setStoredMarks([]);
          return true;
        }).run();
      },
    },
    onUpdate: ({ editor: current }) => {
      const storage = current.storage as unknown as { markdown: { getMarkdown(): string } };
      change.current(storage.markdown.getMarkdown());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isDisabled, false);
    editor.view.dispatch(editor.state.tr);
  }, [editor, isDisabled]);

  return (
    <div className="gentask-simple-editor">
      <EditorContext.Provider value={{ editor }}>
        <NoteSimpleToolbar />
        <EditorContent editor={editor} className="drawer-editor" />
      </EditorContext.Provider>
    </div>
  );
}
