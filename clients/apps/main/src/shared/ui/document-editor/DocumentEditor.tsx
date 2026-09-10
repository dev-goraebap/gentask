import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useState } from 'react';
import type { DocumentEditorProps } from './types';
import { nodes, documentTheme } from './config';
import { importMarkdown } from './content';
import { DocumentSurface } from './DocumentSurface';
import './editor.css';
import './document-typography.css';

export function DocumentEditor(props: DocumentEditorProps) {
  const [config] = useState(() => ({ namespace: 'GentaskDocument', nodes, theme: documentTheme,
    editable: !props.readOnly && !props.disabled,
    onError: (error: Error) => { throw error; },
    editorState: props.initialEditorState || ((editor: import('lexical').LexicalEditor) => importMarkdown(editor, props.initialMarkdown)),
  }));
  return <LexicalComposer initialConfig={config}><DocumentSurface {...props} /></LexicalComposer>;
}
