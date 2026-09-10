import { useEditorPortal } from './useEditorPortal';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Button } from '@astryxdesign/core';
import type { DocumentEditorProps, TextAnchor } from './types';
import { anchorFromSelection, rangeFromAnchor } from './text-range';
import { CommentPopover } from './CommentPopover';
import './comments.css';

export function TextComments(props: DocumentEditorProps) {
  const [editor] = useLexicalComposerContext();
  const portal = useEditorPortal();
  const [selected, setSelected] = useState<TextAnchor | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [rects, setRects] = useState<{ id: string; left: number; top: number; width: number; height: number }[]>([]);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const comments = props.comments || [];
  const active = comments.find(c => c.id === opened);
  useEffect(() => {
    const root = editor.getRootElement(); if (!root) return;
    const measure = () => {
      const bounds = root.getBoundingClientRect();
      let top = Math.max(0, bounds.top), bottom = Math.min(window.innerHeight, bounds.bottom);
      let left = Math.max(0, bounds.left), right = Math.min(window.innerWidth, bounds.right);
      for (let parent = root.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        const rect = parent.getBoundingClientRect();
        if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) { top = Math.max(top, rect.top); bottom = Math.min(bottom, rect.bottom); }
        if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) { left = Math.max(left, rect.left); right = Math.min(right, rect.right); }
      }
      const next = comments.flatMap(c => Array.from(rangeFromAnchor(root, c.anchor)?.getClientRects() || []).filter(r => r.bottom > top && r.top < bottom && r.right > left && r.left < right).map(r => ({ id: c.id, left: Math.max(left, r.left), top: Math.max(top, r.top), width: Math.min(right, r.right) - Math.max(left, r.left), height: Math.min(bottom, r.bottom) - Math.max(top, r.top) })));
      setRects(next);
      const target = active?.anchor || selected;
      const rect = target && rangeFromAnchor(root, target)?.getBoundingClientRect();
      if (rect) setPosition({ left: Math.max(12, Math.min(rect.left, window.innerWidth - 348)), top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 330)) });
    };
    let frame = 0;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const select = () => { if (opened) return; setSelected(props.onComment ? anchorFromSelection(root) : null); };
    root.addEventListener('pointerup', select); root.addEventListener('keyup', select);
    window.addEventListener('scroll', schedule, true); window.addEventListener('resize', schedule);
    const observer = new MutationObserver(schedule); observer.observe(root, { subtree: true, childList: true, characterData: true });
    measure();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); root.removeEventListener('pointerup', select); root.removeEventListener('keyup', select); window.removeEventListener('scroll', schedule, true); window.removeEventListener('resize', schedule); };
  }, [editor, props.comments, props.onComment, opened, active, selected]);
  const close = () => { setOpened(null); setSelected(null); };
  return createPortal(<div className="doc-comments">
    {rects.map((r, i) => <button key={`${r.id}:${i}`} className="doc-comment-highlight" aria-label={`코멘트 보기: ${comments.find(c => c.id === r.id)?.anchor.quote}`} style={{ position: 'fixed', left: r.left, top: r.top, width: r.width, height: r.height }} onClick={() => { setSelected(null); setOpened(r.id); }} />)}
    {selected && !opened && <div className="doc-comment-position" style={position}><Button label="코멘트" size="sm" onMouseDown={e => e.preventDefault()} onClick={() => setOpened('new')} /></div>}
    {opened && (active || selected) && <div className="doc-comment-position" style={position}><CommentPopover key={opened} anchor={active?.anchor || selected!} comment={active} writable={!!props.onComment} onClose={close} onSave={body => active ? props.onEditComment!(active.id, body) : props.onComment!(selected!, body)} onDelete={active && props.onDeleteComment ? () => props.onDeleteComment!(active.id) : undefined} /></div>}
  </div>, portal ?? document.body);
}
