import { Button } from '@astryxdesign/core';
import { useState } from 'react';
import type { BlockInfo, LocalComment } from '../model/document';

export function DocumentPanel({ mode, blocks, selected, comments, onSelect, onComment, onDelete, onClose }: { mode: 'outline' | 'comments' | 'json'; blocks: BlockInfo[]; selected?: BlockInfo; comments: LocalComment[]; onSelect: (key: string) => void; onComment: (text: string) => void; onDelete: (id: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState('');
  return <aside className="lex-panel" aria-label={mode === 'comments' ? '문서 코멘트' : '문서 구조'}>
    <div className="lex-panel-header"><strong>{mode === 'comments' ? '코멘트' : '문서 개요'}</strong><Button label="패널 닫기" icon={<span>×</span>} isIconOnly variant="secondary" size="sm" onClick={onClose} /></div>
    <div className="lex-panel-body">
      {mode === 'outline' ? <><p className="lex-muted">제목을 선택하면 본문으로 이동합니다.</p><nav aria-label="문서 목차">{blocks.filter(b => b.type === 'heading').map(b => <button key={b.key} className="lex-outline-item" onClick={() => onSelect(b.key)}>{b.text || '빈 제목'}</button>)}</nav><div className="lex-panel-note">문단에 커서를 놓으면 하단에 선택한 블록이 표시됩니다. 이동해도 블록의 식별자는 유지됩니다.</div></> : <>
        {!comments.length && <div className="lex-comment-empty"><span>“</span><strong>생각을 함께 남겨보세요</strong><p>본문의 문단에 커서를 놓고<br />그 내용에 대한 의견을 작성하세요.</p></div>}
        {comments.map(comment => { const target = blocks.find(b => b.id === comment.blockId); return <article className="lex-comment" key={comment.id}><div className="lex-comment-author"><span className="lex-avatar">나</span><strong>나</strong><Button label="코멘트 삭제" size="sm" variant="secondary" onClick={() => onDelete(comment.id)} /></div><button className="lex-comment-quote" disabled={!target} onClick={() => target && onSelect(target.key)}>{target ? target.text.slice(0, 100) : '삭제된 블록 · ' + comment.quote}</button><p>{comment.text}</p></article>; })}
      </>}
    </div>
    {mode === 'comments' && <form className="lex-comment-form" onSubmit={e => { e.preventDefault(); if (draft.trim() && selected) { onComment(draft.trim()); setDraft(''); } }}><div className="lex-comment-target">{selected ? selected.text.slice(0, 70) || '빈 블록' : '먼저 본문의 문단을 선택하세요'}</div><textarea aria-label="코멘트 내용" placeholder="이 내용에 대한 의견…" value={draft} onChange={e => setDraft(e.target.value)} rows={3} /><Button label="코멘트 남기기" size="sm" type="submit" isDisabled={!draft.trim() || !selected} /></form>}
  </aside>;
}
