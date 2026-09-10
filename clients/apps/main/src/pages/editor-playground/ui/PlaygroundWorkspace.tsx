import { DocumentSurface, type TextComment } from '@/shared/ui/document-editor';
import { useCallback, useEffect, useState } from 'react';
import { Button, DropdownMenu } from '@astryxdesign/core';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, $isElementNode } from 'lexical';
import type { BlockInfo, LocalComment } from '../model/document';
import { DocumentPlugin } from './DocumentPlugin';
import { DocumentPanel } from './DocumentPanel';

export function PlaygroundWorkspace() {
  const [editor] = useLexicalComposerContext();
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [json, setJson] = useState('');
  const [mode, setMode] = useState<'outline' | 'comments' | 'json' | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [inlineComments, setInlineComments] = useState<TextComment[]>([]);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [message, setMessage] = useState('이 페이지에서만 편집됩니다. 새로고침하면 예제로 돌아갑니다.');
  const selected = blocks.find(b => b.key === selectedKey);
  const handleChange = useCallback((next: BlockInfo[], key: string, data: string) => { setBlocks(next); if (key) setSelectedKey(key); setJson(data); }, []);
  useEffect(() => { editor.setEditable(!readOnly); }, [editor, readOnly]);
  const select = (key: string) => {
    setSelectedKey(key);
    editor.getElementByKey(key)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (!readOnly) editor.update(() => { const node = $getNodeByKey(key); if ($isElementNode(node)) node.selectStart(); });
  };
  const move = (direction: 'up' | 'down') => editor.update(() => { const node = $getNodeByKey(selectedKey); if (!node) return; const sibling = direction === 'up' ? node.getPreviousSibling() : node.getNextSibling(); if (sibling) { if (direction === 'up') sibling.insertBefore(node); else sibling.insertAfter(node); } });
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ editorState: JSON.parse(json), comments }, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'gentask-playground.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('문서와 코멘트를 JSON으로 내려받았습니다.');
  };
  return <div className="lex-playground document-editor">
    <header className="lex-page-header"><div className="lex-brand"><a href="/notes" aria-label="Gentask로 돌아가기">Gentask</a><span>/</span><strong>에디터 랩</strong><span className="lex-lab-label">PLAYGROUND</span></div><div className="lex-header-actions"><Button label={readOnly ? '편집하기' : '미리보기'} variant="secondary" size="sm" onClick={() => setReadOnly(!readOnly)} /><DropdownMenu className="lex-editor-menu" button={{ label: '문서', variant: 'secondary', size: 'sm' }} items={[{ label: '문서 개요', onClick: () => setMode(mode === 'outline' ? null : 'outline') }, { label: 'JSON 보기', onClick: () => setMode(mode === 'json' ? null : 'json') }, { label: 'JSON 내려받기', onClick: download }]} /></div></header>
    <div className="lex-main">
      <main className="lex-document-scroll"><div className="lex-paper"><div className="lex-document-eyebrow">GENTASK / DOCUMENTS</div><div className="lex-editor-body"><DocumentSurface initialMarkdown="" readOnly={readOnly} label="문서 본문" comments={inlineComments}
        onComment={async (anchor, body) => setInlineComments(previous => [...previous, { id: crypto.randomUUID(), body, author: '나', own: true, anchor }])}
        onEditComment={async (id, body) => setInlineComments(previous => previous.map(c => c.id === id ? { ...c, body } : c))}
        onDeleteComment={async id => setInlineComments(previous => previous.filter(c => c.id !== id))} /></div><div className="lex-paper-end">/ 블록 추가 · 글자 선택으로 서식 변경</div></div></main>
      {mode === 'json' ? <aside className="lex-panel lex-json-panel"><div className="lex-panel-header"><strong>문서 데이터</strong><Button label="패널 닫기" isIconOnly icon={<span>×</span>} size="sm" variant="secondary" onClick={() => setMode(null)} /></div><pre aria-label="문서 JSON">{json}</pre></aside> : mode && <DocumentPanel mode={mode} blocks={blocks} selected={selected} comments={comments} onSelect={select} onClose={() => setMode(null)} onDelete={id => setComments(comments.filter(c => c.id !== id))} onComment={text => { if (selected) setComments([...comments, { id: crypto.randomUUID(), blockId: selected.id, quote: selected.text.slice(0, 100), text }]); }} />}
    </div>
    <footer className="lex-status"><div className="lex-block-actions"><span>{selected ? `${selected.type} · ${selected.text.slice(0, 22) || '빈 블록'}` : '본문을 선택해 보세요'}</span><Button label="블록 위로 이동" icon={<span>↑</span>} isIconOnly variant="secondary" size="sm" isDisabled={readOnly || !selected || blocks[0]?.key === selectedKey} onMouseDown={e => e.preventDefault()} onClick={() => move('up')} /><Button label="블록 아래로 이동" icon={<span>↓</span>} isIconOnly variant="secondary" size="sm" isDisabled={readOnly || !selected || blocks.at(-1)?.key === selectedKey} onMouseDown={e => e.preventDefault()} onClick={() => move('down')} /></div><span className="lex-status-message" role="status">{message}</span><span>{blocks.reduce((n, b) => n + b.text.length, 0).toLocaleString()}자</span></footer>
    <DocumentPlugin onChange={handleChange} />
  </div>;
}
