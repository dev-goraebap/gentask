import { Button, VStack } from '@astryxdesign/core';
import { Markdown } from '@astryxdesign/core/Markdown';
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { blockKey, type CommentBlock } from '../model/comment-blocks';
import { ArtifactCommentButton } from './ArtifactCommentButton';

export const ArtifactCommentBody = memo(function ArtifactCommentBody({ body, blocks, counts, selected, selecting, onSelect }: {
  body: string; blocks: CommentBlock[]; counts: Map<string, number>; selected?: CommentBlock;
  selecting: boolean; onSelect: (block: CommentBlock | null) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const renderedBody = useMemo(() => <Markdown ref={root} contentWidth="52rem">{body}</Markdown>, [body]);
  const [boxes, setBoxes] = useState<{ index: number; top: number; height: number }[]>([]);
  useLayoutEffect(() => {
    if (!selected) return;
    const frame = requestAnimationFrame(() => root.current?.children[selected.index]?.scrollIntoView({ block: 'center' }));
    return () => cancelAnimationFrame(frame);
  }, [selected]);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const children = Array.from(element.children);
        if (children.length !== blocks.length) { setBoxes([]); return; }
        const origin = element.getBoundingClientRect();
        const next = children.map((child, index) => {
          const rect = child.getBoundingClientRect();
          return { index, top: rect.top - origin.top, height: rect.height };
        });
        setBoxes(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [body, blocks]);

  return <VStack style={{ position: 'relative', cursor: selecting ? 'crosshair' : undefined }} onPointerLeave={() => setHovered(null)}>
    {renderedBody}
    {boxes.map(box => {
      const block = blocks[box.index];
      const count = counts.get(blockKey(block.start, block.end)) ?? 0;
      const active = selected?.start === block.start && selected.end === block.end;
      if (!selecting && !active && !count) return null;
      const highlighted = active || (selecting && (hovered === box.index || focused === box.index));
      return <VStack key={block.start} style={{ position: 'absolute', top: box.top, height: box.height, insetInlineStart: 0, insetInlineEnd: 0, pointerEvents: 'none', outline: highlighted ? 'var(--border-width) solid var(--color-border-blue)' : undefined, borderRadius: 'var(--radius-container)' }}>
        {selecting ? <Button label={`${block.label}에 코멘트 남기기`} variant="ghost" onClick={() => onSelect(block)}
          onPointerEnter={() => setHovered(box.index)} onFocus={() => setFocused(box.index)} onBlur={() => setFocused(null)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'crosshair', pointerEvents: 'auto' }}>{' '}</Button> : null}
        {count || active ? <VStack style={{ position: 'absolute', insetInlineEnd: 0, top: 0, transform: 'translateY(-50%)', pointerEvents: 'auto', zIndex: active ? 2 : 1 }}>
          <ArtifactCommentButton label={`${block.label} 코멘트 ${count}개`} count={count} onClick={() => onSelect(block)} />
        </VStack> : null}
      </VStack>;
    })}
  </VStack>;
});
