import { useEditorPortal } from './useEditorPortal';
import { SvgIcon } from '@/shared/ui/icons';
import Link01Icon from '@hugeicons/core-free-icons/Link01Icon';
import QuoteDownIcon from '@hugeicons/core-free-icons/QuoteDownIcon';
import SourceCodeIcon from '@hugeicons/core-free-icons/SourceCodeIcon';
import CodeIcon from '@hugeicons/core-free-icons/CodeIcon';
import TextClearIcon from '@hugeicons/core-free-icons/TextClearIcon';
import LeftToRightListBulletIcon from '@hugeicons/core-free-icons/LeftToRightListBulletIcon';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@astryxdesign/core';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $createParagraphNode, $setSelection, FORMAT_TEXT_COMMAND, type RangeSelection, type TextFormatType } from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $createCodeNode } from '@lexical/code';
import { TOGGLE_LINK_COMMAND, $isLinkNode } from '@lexical/link';
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import './context-tools.css';

export function FloatingFormat() {
  const [editor] = useLexicalComposerContext();
  const portal = useEditorPortal();
  const [position, setPosition] = useState<{left: number; top: number} | null>(null);
  const [formats, setFormats] = useState<string[]>([]);
  const [menu, setMenu] = useState<'text' | 'list' | 'link' | null>(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const saved = useRef<RangeSelection | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const apply = (action: () => void) => { editor.update(() => { if (saved.current) $setSelection(saved.current.clone()); action(); }); setMenu(null); editor.focus(); };
  const block = (kind: string) => apply(() => { const selection = $getSelection(); if ($isRangeSelection(selection)) $setBlocksType(selection, () => kind === 'h1' || kind === 'h2' || kind === 'h3' ? $createHeadingNode(kind) : kind === 'quote' ? $createQuoteNode() : kind === 'code' ? $createCodeNode('text') : $createParagraphNode()); });
  const open = (next: 'text' | 'list' | 'link') => { setMenu(menu === next ? null : next); setError(''); };
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      if (menu) return;
      const root = editor.getRootElement(), selection = window.getSelection();
      if (!editor.isEditable() || editor.isComposing() || !root || !selection?.rangeCount || selection.isCollapsed || !root.contains(selection.anchorNode) || !root.contains(selection.focusNode)) { setPosition(null); return; }
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setPosition({ left: Math.max(12, Math.min(rect.left + rect.width / 2 - 200, window.innerWidth - Math.min(412, window.innerWidth - 24))), top: Math.max(8, rect.top - 46) });
      editor.getEditorState().read(() => { const s = $getSelection(); if ($isRangeSelection(s)) { saved.current = s.clone(); const node = s.anchor.getNode(); const link = $isLinkNode(node) ? node : node.getParent(); setUrl($isLinkNode(link) ? link.getURL() : ''); setFormats(['bold','italic','highlight','strikethrough','code'].filter(f => s.hasFormat(f as TextFormatType))); } });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const hide = () => { setPosition(null); setMenu(null); };
    const outside = (event: PointerEvent) => { if (!bar.current?.contains(event.target as Node)) { setMenu(null); } };
    document.addEventListener('pointerdown', outside);
    const key = (e: KeyboardEvent) => { if(e.key === 'Escape') hide(); };
    document.addEventListener('selectionchange', schedule); document.addEventListener('pointerup', schedule); document.addEventListener('keydown', key);
    window.addEventListener('scroll', hide, true);
    const unregister = editor.registerUpdateListener(schedule);
    return () => { cancelAnimationFrame(frame); unregister(); document.removeEventListener('pointerdown', outside); document.removeEventListener('selectionchange', schedule); document.removeEventListener('pointerup', schedule); document.removeEventListener('keydown', key); window.removeEventListener('scroll', hide, true); };
  }, [editor, menu]);
  return position && createPortal(<div ref={bar} className="doc-floating-format" role="toolbar" aria-label="선택한 글자 서식" style={position}>
    <div className="doc-format-row" onMouseDown={e => { if (!(e.target instanceof HTMLInputElement)) e.preventDefault(); }}>
      <Button label="텍스트 종류" tooltip="텍스트 종류" isIconOnly icon={<span>Aa⌄</span>} size="sm" variant="secondary" aria-expanded={menu === 'text'} onClick={() => open('text')} />
      {(['bold','italic','strikethrough','highlight'] as TextFormatType[]).map((format,i) => <Button key={format} label={['굵게','기울임','취소선','형광펜'][i]} tooltip={['굵게','기울임','취소선','형광펜'][i]} isIconOnly icon={<span className={`lex-format-${format}`}>{['B','I','S','H'][i]}</span>} size="sm" variant="secondary" aria-pressed={formats.includes(format)} onClick={() => apply(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format))} />)}
      <Button label="링크" tooltip="링크" isIconOnly icon={<SvgIcon data={Link01Icon} size={17} />} size="sm" variant="secondary" aria-expanded={menu === 'link'} onClick={() => open('link')} />
      <Button label="인용" tooltip="인용" isIconOnly icon={<SvgIcon data={QuoteDownIcon} size={17} />} size="sm" variant="secondary" onClick={() => block('quote')} />
      <Button label="서식 지우기" tooltip="서식 지우기" isIconOnly icon={<SvgIcon data={TextClearIcon} size={17} />} size="sm" variant="secondary" onClick={() => apply(() => { const selection = $getSelection(); if ($isRangeSelection(selection)) { for (const format of ['bold','italic','underline','strikethrough','code','highlight','subscript','superscript'] as TextFormatType[]) if (selection.hasFormat(format)) selection.formatText(format); } })} />
      <span className="doc-format-divider" />
      <Button label="인라인 코드" tooltip="인라인 코드" isIconOnly icon={<SvgIcon data={CodeIcon} size={17} />} size="sm" variant="secondary" aria-pressed={formats.includes('code')} onClick={() => apply(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code'))} />
      <Button label="코드 블록" tooltip="코드 블록" isIconOnly icon={<SvgIcon data={SourceCodeIcon} size={17} />} size="sm" variant="secondary" onClick={() => block('code')} />
      <span className="doc-format-divider" />
      <Button label="목록" tooltip="목록" isIconOnly icon={<SvgIcon data={LeftToRightListBulletIcon} size={17} />} size="sm" variant="secondary" aria-expanded={menu === 'list'} onClick={() => open('list')} />
    </div>
    {menu && <div className="doc-format-panel">
      {menu === 'text' && ['paragraph','h1','h2','h3'].map((kind,i) => <button key={kind} onMouseDown={e => e.preventDefault()} onClick={() => block(kind)}>{['본문','제목 1','제목 2','제목 3'][i]}</button>)}
      {menu === 'list' && [INSERT_UNORDERED_LIST_COMMAND,INSERT_ORDERED_LIST_COMMAND,INSERT_CHECK_LIST_COMMAND].map((command,i) => <button key={i} onMouseDown={e => e.preventDefault()} onClick={() => apply(() => editor.dispatchCommand(command, undefined))}>{['글머리 목록','번호 목록','체크리스트'][i]}</button>)}
      {menu === 'link' && <form onSubmit={e => { e.preventDefault(); if (!/^(https?:\/\/|mailto:|#|\/(?!\/))/i.test(url.trim())) { setError('https:// 등의 올바른 링크를 입력해주세요.'); return; } apply(() => editor.dispatchCommand(TOGGLE_LINK_COMMAND, url.trim())); }}><input aria-label="링크 주소" autoFocus value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" /><div><Button label="적용" size="sm" type="submit" /><Button label="링크 해제" size="sm" variant="secondary" onClick={() => apply(() => editor.dispatchCommand(TOGGLE_LINK_COMMAND, null))} /></div>{error && <p role="alert">{error}</p>}</form>}
    </div>}
  </div>, portal ?? document.body);
}
