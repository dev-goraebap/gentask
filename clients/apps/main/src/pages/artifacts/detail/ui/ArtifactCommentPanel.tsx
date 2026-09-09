import { UserAvatar } from '@/shared/ui/user-avatar';
import { commentsOptions, createArtifactComment, deleteArtifactComment, type ArtifactCommentView } from '@/entities/artifact';
import { useSession } from '@/entities/session';
import { HgiTrash } from '@/shared/ui/icons';
import { Button, HStack, Layout, LayoutContent, LayoutFooter, List, ListItem, Text, TextArea, VStack } from '@astryxdesign/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { blockKey, type CommentBlock } from '../model/comment-blocks';
import { formatArtifactDate } from './document-detail';

export function ArtifactCommentPanel({ projectId, artifactId, versionNo, block, blocks, comments, writable, loading, error, onSelect, onReveal, selecting, onPick, onCancel }: {
  projectId: string | null; artifactId: string; versionNo: number; block: CommentBlock | null; blocks: CommentBlock[];
  comments: ArtifactCommentView[]; writable: boolean; loading: boolean; error: Error | null;
  onSelect: (block: CommentBlock | null) => void; onReveal: (block: CommentBlock) => void; selecting: boolean; onPick: () => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState('');
  const client = useQueryClient();
  const session = useSession();
  const refresh = () => client.invalidateQueries({ queryKey: commentsOptions(projectId, artifactId, versionNo).queryKey });
  const save = useMutation({
    mutationFn: () => createArtifactComment(projectId, artifactId, versionNo, { body: draft.trim(), blockStart: block?.start, blockEnd: block?.end }),
    onSuccess: async () => { setDraft(''); await refresh(); },
  });
  const remove = useMutation({ mutationFn: (id: string) => deleteArtifactComment(projectId, artifactId, versionNo, id), onSuccess: refresh });
  const busy = save.isPending || remove.isPending;
  return <Layout padding={0} height="fill"
    content={<LayoutContent padding={3}><VStack gap={3}>
      <Text type="supporting">v{versionNo} · 코멘트 {comments.length}개</Text>
      {loading ? <Text>불러오는 중…</Text> : error ? <Text role="alert">{error.message}</Text> : comments.length ? <List hasDividers>{comments.map(comment => {
        const target = blocks.find(item => blockKey(item.start, item.end) === blockKey(comment.blockStart, comment.blockEnd));
        return <ListItem key={comment.id} style={{ paddingInline: 0 }} isSelected={!!block && target?.start === block.start && target.end === block.end}
          label={<HStack gap={2} align="center" justify="between"><HStack gap={2} align="center" style={{ minWidth: 0 }}>
            <UserAvatar userId={comment.authorId} name={comment.authorName || '알 수 없는 사용자'} size="sm" tooltip={false} /><Text size="sm" weight="medium" maxLines={1}>{comment.authorName || '알 수 없는 사용자'}</Text>
          </HStack>{writable && comment.authorId === session.data?.id ? <Button label="내 코멘트 삭제" icon={<HgiTrash size={16} />} isIconOnly size="sm" variant="ghost" isDisabled={busy} isLoading={remove.isPending && remove.variables === comment.id} onClick={() => remove.mutate(comment.id)} /> : null}</HStack>}
          description={<VStack gap={2}><Text type="supporting">{formatArtifactDate(comment.createdAt)}</Text>
            {target ? <Button label={`${target.label.replace(/^\d+\.\s*/, '')}에 남긴 코멘트`} tooltip="본문에서 위치 보기" size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} isDisabled={busy} onClick={() => onReveal(target)} /> :
              <Text type="supporting">{comment.blockStart == null ? '문서 전체에 남긴 코멘트' : '블록에 남긴 코멘트'}</Text>}
            <Text style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{comment.body}</Text>
          </VStack>} />;
      })}</List> : <Text color="secondary">아직 코멘트가 없습니다.</Text>}
      {remove.error ? <Text role="alert">{remove.error.message}</Text> : null}
    </VStack></LayoutContent>}
    footer={<LayoutFooter hasDivider padding={3}><VStack gap={2} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {writable ? <>
        <HStack gap={2} align="center" justify="between"><Text size="sm">{block?.label ?? '문서 전체'}에 작성</Text><HStack gap={1}>
          {block ? <Button label="전체로" size="sm" variant="secondary" isDisabled={busy} onClick={() => onSelect(null)} /> : null}
          <Button label={selecting ? '선택 취소' : '블록 지정'} size="sm" variant="secondary" isDisabled={busy || !blocks.length} onClick={selecting ? onCancel : onPick} />
        </HStack></HStack>
        <TextArea label="코멘트" value={draft} onChange={setDraft} maxLength={5000} rows={3} isDisabled={busy} />
        <HStack justify="end"><Button label="등록" variant="primary" size="sm" isDisabled={!draft.trim() || busy || selecting} isLoading={save.isPending} onClick={() => save.mutate()} /></HStack>
        {save.error ? <Text role="alert">{save.error.message}</Text> : null}
      </> : <Text type="supporting">{loading || error ? '코멘트를 불러온 뒤 작성할 수 있습니다.' : '이전 버전입니다. 코멘트 작성은 최신 문서에서 가능합니다.'}</Text>}
    </VStack></LayoutFooter>} />;
}
