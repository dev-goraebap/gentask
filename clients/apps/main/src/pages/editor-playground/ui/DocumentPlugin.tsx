import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, $isRangeSelection, $isNodeSelection, $isRootNode, $setState, RootNode, ParagraphNode, type LexicalNode } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { TableNode } from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import { PlaygroundImageNode } from '@/shared/ui/document-editor';
import { blockId, blockIdState, type BlockInfo } from '../model/document';

export function DocumentPlugin({ onChange }: { onChange: (blocks: BlockInfo[], selected: string, json: string) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    const registrations = [ParagraphNode, HeadingNode, QuoteNode, ListNode, CodeNode, TableNode, PlaygroundImageNode].map(Node =>
      editor.registerNodeTransform<LexicalNode>(Node, node => { if (!blockId(node)) $setState(node, blockIdState, crypto.randomUUID()); }));
    return mergeRegister(...registrations, editor.registerNodeTransform(RootNode, root => {
      const seen = new Set<string>();
      for (const node of root.getChildren()) {
        let id = blockId(node);
        if (!id || seen.has(id)) { id = crypto.randomUUID(); $setState(node, blockIdState, id); }
        seen.add(id);
      }
    }), editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const blocks = $getRoot().getChildren().map(node => ({ key: node.getKey(), id: blockId(node), type: node.getType(), text: node.getTextContent() }));
        const selection = $getSelection();
        let node: LexicalNode | null = $isRangeSelection(selection) ? selection.anchor.getNode() : $isNodeSelection(selection) ? selection.getNodes()[0] ?? null : null;
        while (node?.getParent() && !$isRootNode(node.getParent())) node = node.getParent();
        const selected = node && !$isRootNode(node) ? node.getKey() : '';
        onChange(blocks, selected, JSON.stringify(editorState.toJSON(), null, 2));
      });
    }));
  }, [editor, onChange]);
  return null;
}
