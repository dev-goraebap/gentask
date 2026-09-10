import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import type { DocumentEditorProps } from './types';
import { exportMarkdown, serializeDocument } from './content';
import { EmptyBlockHint } from './EmptyBlockHint';
import { CodeTools } from './CodeTools';
import { SlashMenu } from './SlashMenu';
import { FloatingFormat } from './FloatingFormat';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { CodeHighlightPlugin } from './CodeHighlightPlugin';
import { TextComments } from './TextComments';

export function DocumentSurface(props: DocumentEditorProps) {
  const [editor] = useLexicalComposerContext();
  const change = useRef(props.onChange);
  change.current = props.onChange;
  const previous = useRef<string | null>(null);
  useEffect(() => { editor.setEditable(!props.readOnly && !props.disabled); }, [editor, props.readOnly, props.disabled]);
  useEffect(() => {
    previous.current = serializeDocument(editor.getEditorState().toJSON());
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
    if (!editor.isEditable() || (!dirtyElements.size && !dirtyLeaves.size)) return;
    editorState.read(() => { const data = serializeDocument(editorState.toJSON()); const before = previous.current; previous.current = data; if (before !== null && before !== data) change.current?.({ markdown: exportMarkdown(editor), editorState: data, composing: editor.isComposing() }); });
  });
  }, [editor]);
  return <div className={`document-editor ${props.readOnly ? 'is-readonly' : ''}`}>
    {!props.readOnly && !props.disabled && <><SlashMenu /><FloatingFormat /><CodeTools /><EmptyBlockHint /></>}
    <RichTextPlugin contentEditable={<ContentEditable className="lex-editable" aria-label={props.label ?? "문서 본문"} onBlur={props.onBlur} />} placeholder={null} ErrorBoundary={LexicalErrorBoundary} />
    <HistoryPlugin /><ListPlugin /><CheckListPlugin /><LinkPlugin /><TablePlugin hasCellMerge={false} hasCellBackgroundColor={false} /><MarkdownShortcutPlugin transformers={TRANSFORMERS} /><CodeHighlightPlugin />
    {props.readOnly && <TextComments {...props} />}
  </div>;
}
