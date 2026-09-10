import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $isParagraphNode } from 'lexical';

export function EmptyBlockHint() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    let marked: HTMLElement | null = null;
    const update = () => editor.getEditorState().read(() => {
      marked?.removeAttribute('data-empty-block-hint'); marked = null;
      if (!editor.isEditable()) return;
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) return;
      const node = selection.anchor.getNode();
      const paragraph = $isParagraphNode(node) ? node : node.getParent();
      if (!$isParagraphNode(paragraph) || paragraph.getTextContentSize() > 0) return;
      marked = editor.getElementByKey(paragraph.getKey());
      marked?.setAttribute('data-empty-block-hint', '내용을 입력하거나 / 로 블록을 추가하세요');
    });
    const unregister = editor.registerUpdateListener(update);
    update();
    return () => { unregister(); marked?.removeAttribute('data-empty-block-hint'); };
  }, [editor]);
  return null;
}
