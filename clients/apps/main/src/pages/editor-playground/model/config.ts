import { nodes, documentTheme, importMarkdown } from '@/shared/ui/document-editor';
import { sample } from './document';
export const editorConfig = { namespace: 'GentaskPlayground', nodes, theme: documentTheme, onError: (error: Error) => { throw error; }, editorState: (editor: import('lexical').LexicalEditor) => importMarkdown(editor, sample) };
