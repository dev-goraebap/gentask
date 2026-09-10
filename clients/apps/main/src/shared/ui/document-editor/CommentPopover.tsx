import { useState } from 'react';
import { Button } from '@astryxdesign/core';
import type { TextAnchor, TextComment } from './types';
export function CommentPopover({ anchor, comment, onSave, onDelete, onClose, writable }: {
  anchor: TextAnchor; comment?: TextComment; onSave: (body: string) => Promise<void>; onDelete?: () => Promise<void>; onClose: () => void; writable: boolean;
}) {
  const [editing, setEditing] = useState(!comment);
  const [body, setBody] = useState(comment?.body || '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const run = async (action: () => Promise<void>) => { setPending(true); setError(''); try { await action(); onClose(); } catch (e) { setError(e instanceof Error ? e.message : '처리하지 못했습니다. 다시 시도해 주세요.'); } finally { setPending(false); } };
  return <div role="dialog" aria-label="구절 코멘트" className="doc-comment-box" onKeyDown={e => { if (e.key === 'Escape' && !pending) { e.stopPropagation(); onClose(); } }}>
    <div className="doc-comment-heading"><strong>{comment?.author || '코멘트 작성'}</strong><Button label="닫기" size="sm" variant="secondary" isDisabled={pending} onClick={onClose} /></div>
    <blockquote>{anchor.quote}</blockquote>
    {editing ? <form onSubmit={e => { e.preventDefault(); if (body.trim()) void run(() => onSave(body.trim())); }}><textarea aria-label="코멘트 내용" autoFocus rows={4} maxLength={5000} value={body} onChange={e => setBody(e.target.value)} disabled={pending} /><Button label="저장" size="sm" type="submit" isDisabled={!body.trim() || pending} /></form> : <><p className="doc-comment-text">{comment?.body}</p>{writable && comment?.own && <div className="doc-comment-actions"><Button label="수정" size="sm" variant="secondary" onClick={() => setEditing(true)} isDisabled={pending} />{onDelete && <Button label="삭제" size="sm" variant="secondary" isDisabled={pending} onClick={() => void run(onDelete)} />}</div>}</>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
