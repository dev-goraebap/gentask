export type DocumentValue = { markdown: string; editorState: string; composing?: boolean };
export type TextAnchor = { start: number; end: number; quote: string };
export type TextComment = { id: string; body: string; author: string; own: boolean; anchor: TextAnchor };
export type DocumentEditorProps = {
  initialMarkdown: string;
  label?: string;
  onBlur?: () => void;
  initialEditorState?: string | null;
  readOnly?: boolean;
  disabled?: boolean;
  onChange?: (value: DocumentValue) => void;
  comments?: TextComment[];
  onComment?: (anchor: TextAnchor, body: string) => Promise<void>;
  onEditComment?: (id: string, body: string) => Promise<void>;
  onDeleteComment?: (id: string) => Promise<void>;
};
