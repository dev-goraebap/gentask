import { commentsOptions } from '@/entities/artifact';
import { AppAsideContent, useAppAside } from '@/shared/ui/app-aside';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import { RequestState } from '@/shared/ui/request-state';
import { Text, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { blockKey, commentBlocks, type CommentBlock } from '../model/comment-blocks';
import { ArtifactCommentBody } from './ArtifactCommentBody';
import { ArtifactCommentPanel } from './ArtifactCommentPanel';

export function ArtifactComments({ projectId, artifactId, versionNo, body, writable, panelKey }: {
  projectId: string; artifactId: string; versionNo: number; body: string; writable: boolean; panelKey: string;
}) {
  const query = useQuery(commentsOptions(projectId, artifactId, versionNo));
  const blocks = useMemo(() => commentBlocks(body), [body]);
  const [selection, setSelection] = useState<CommentBlock | null>(null);
  const [selecting, setSelecting] = useState(false);
  const { open, close, active } = useAppAside();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const show = useCallback(() => open({ key: panelKey, title: '코멘트' }), [open, panelKey]);
  const select = useCallback((block: CommentBlock | null) => { setSelection(block); setSelecting(false); show(); }, [show]);
  const reveal = useCallback((block: CommentBlock) => {
    setSelection({ ...block });
    setSelecting(false);
    if (mobile) close();
  }, [mobile, close]);
  const cancel = useCallback(() => { setSelecting(false); show(); }, [show]);
  useEffect(() => {
    if (!selecting) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [selecting, cancel]);
  useEffect(() => { if ((active && active.key !== panelKey) || (!active && !mobile)) setSelecting(false); }, [active, panelKey, mobile]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const comment of query.data ?? []) { const key = blockKey(comment.blockStart, comment.blockEnd); map.set(key, (map.get(key) ?? 0) + 1); }
    return map;
  }, [query.data]);
  return <VStack gap={3}>
    {query.error ? <RequestState error={query.error} retry={() => { void query.refetch(); }} /> : null}
    {body ? <ArtifactCommentBody body={body} blocks={blocks} counts={counts} selecting={selecting && writable} selected={selection ?? undefined} onSelect={select} /> : <Text color="secondary">아직 내용이 없습니다.</Text>}
    <AppAsideContent panelKey={panelKey}>
      <ArtifactCommentPanel projectId={projectId} artifactId={artifactId} versionNo={versionNo} block={selection} blocks={blocks}
        comments={query.data ?? []} writable={writable && !!query.data} loading={query.isPending} error={query.error}
        onSelect={select} onReveal={reveal} selecting={selecting} onPick={() => { setSelecting(true); if (mobile) close(); }} onCancel={cancel} />
    </AppAsideContent>
  </VStack>;
}
