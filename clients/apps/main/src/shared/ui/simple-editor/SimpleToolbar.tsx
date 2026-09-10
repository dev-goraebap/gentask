import { Toolbar, ToolbarGroup, ToolbarSeparator } from '@gentask/tiptap-ui/tiptap-ui-primitive/toolbar';
import { HeadingDropdownMenu } from '@gentask/tiptap-ui/tiptap-ui/heading-dropdown-menu';
import { ListDropdownMenu } from '@gentask/tiptap-ui/tiptap-ui/list-dropdown-menu';
import { BlockquoteButton } from '@gentask/tiptap-ui/tiptap-ui/blockquote-button';
import { CodeBlockButton } from '@gentask/tiptap-ui/tiptap-ui/code-block-button';
import { LinkPopover } from '@gentask/tiptap-ui/tiptap-ui/link-popover';
import { MarkButton } from '@gentask/tiptap-ui/tiptap-ui/mark-button';
import { UndoRedoButton } from '@gentask/tiptap-ui/tiptap-ui/undo-redo-button';

export function SimpleToolbar() {
  return <Toolbar aria-label="본문 서식">
    <ToolbarGroup>
      <UndoRedoButton action="undo" aria-label="실행 취소" />
      <UndoRedoButton action="redo" aria-label="다시 실행" />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <HeadingDropdownMenu modal={false} levels={[1,2,3,4]} aria-label="제목 서식" />
      <ListDropdownMenu modal={false} types={['bulletList','orderedList','taskList']} aria-label="목록 서식" />
      <BlockquoteButton aria-label="인용" />
      <CodeBlockButton aria-label="코드 블록" />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <MarkButton type="bold" aria-label="굵게" />
      <MarkButton type="italic" aria-label="기울임" />
      <MarkButton type="strike" aria-label="취소선" />
      <MarkButton type="code" aria-label="인라인 코드" />
      <LinkPopover />
    </ToolbarGroup>
  </Toolbar>;
}
