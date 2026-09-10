import { useEditorPortal } from './useEditorPortal';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalTypeaheadMenuPlugin, MenuOption, useBasicTypeaheadTriggerMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $createParagraphNode, $getSelection, $isRangeSelection, KEY_DOWN_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { $setBlocksType } from '@lexical/selection';
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import './context-tools.css';

class BlockOption extends MenuOption {
  constructor(public label: string, public symbol: string, public words: string, public apply: () => void, public group = 'structure', public shortcut = '') { super(label); }
}
export function SlashMenu() {
  const [editor] = useLexicalComposerContext();
  const portal = useEditorPortal();
  const [query, setQuery] = useState<string | null>(null);
  const match = useBasicTypeaheadTriggerMatch('/', { minLength: 0 });
  const options = useMemo(() => {
    const block = (kind: string) => { const selection = $getSelection(); if ($isRangeSelection(selection)) $setBlocksType(selection, () => kind === 'h1' || kind === 'h2' || kind === 'h3' ? $createHeadingNode(kind) : kind === 'quote' ? $createQuoteNode() : kind === 'code' ? $createCodeNode('typescript') : $createParagraphNode()); };
    return [new BlockOption('본문', 'T', 'text paragraph', () => block('paragraph'), 'text'),
      ...(['h1','h2','h3'] as const).map((h,i) => new BlockOption(`제목 ${i+1}`, `H${i+1}`, `heading ${h}`, () => block(h), 'text', `Ctrl Alt ${i+1}`)),
      new BlockOption('글머리 목록', '•', 'bullet list', () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined), 'list'),
      new BlockOption('번호 목록', '1.', 'number list', () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined), 'list'),
      new BlockOption('체크리스트', '☑', 'todo checklist', () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined), 'list'),
      new BlockOption('인용', '❞', 'quote', () => block('quote')),
      new BlockOption('코드 블록', '‹›', 'code', () => block('code')),
      new BlockOption('표', '▦', 'table', () => editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: '3', columns: '3', includeHeaders: true }))];
  }, [editor]);
  useEffect(() => editor.registerCommand(KEY_DOWN_COMMAND, event => {
    if (!editor.isEditable() || event.isComposing || !event.ctrlKey || !event.altKey || event.shiftKey || !['1','2','3'].includes(event.key)) return false;
    event.preventDefault(); options[Number(event.key)].apply(); return true;
  }, COMMAND_PRIORITY_LOW), [editor, options]);
  const filtered = options.filter(o => `${o.label} ${o.words}`.includes((query || '').toLowerCase()));
  return <LexicalTypeaheadMenuPlugin parent={portal} options={filtered} onQueryChange={setQuery} triggerFn={text => editor.isEditable() && !editor.isComposing() ? match(text, editor) : null}
    onSelectOption={(option, node, close) => { editor.update(() => { node?.remove(); option.apply(); }); close(); }}
    menuRenderFn={(anchor, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => anchor.current ? createPortal(<div className="doc-slash-menu" role="listbox" aria-label="블록 선택">
      {filtered.length ? filtered.map((o,i) => <div role="option" id={`typeahead-item-${i}`} aria-selected={selectedIndex === i} key={o.key} ref={o.setRefElement} className={`doc-slash-option ${i > 0 && filtered[i-1].group !== o.group ? 'doc-slash-group-start' : ''}`}  onMouseEnter={() => setHighlightedIndex(i)} onMouseDown={e => e.preventDefault()} onClick={() => selectOptionAndCleanUp(o)}><span aria-hidden="true">{o.symbol}</span><span className="doc-slash-label">{o.label}</span>{o.shortcut && <kbd>{o.shortcut}</kbd>}</div>) : <div className="doc-menu-caption">일치하는 블록이 없습니다</div>}
    </div>, anchor.current) : null} />;
}
