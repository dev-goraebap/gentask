import { NoteTags } from './NoteTags';
import { NoteIdentity } from './NoteIdentity';
import { NoteAttachment } from './NoteAttachment';
import { HgiCancel, HgiAttachment, HgiTrash } from '@/shared/ui/icons';
import { useSession } from "@/entities/session";
import { useWorkspaceStore } from "@/entities/workspace";
import { MobileSurface, MOBILE_QUERY } from "@/shared/ui/mobile";
import { RequestState } from "@/shared/ui/request-state";
import { LazyDocumentEditor } from '@/shared/ui/lazy-document-editor';
import {
  Button,
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  MoreMenu,
  Selector,
  Text,
  VStack,
} from "@astryxdesign/core";
import { useMediaQuery } from "@astryxdesign/core/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useRef, useState } from "react";
import {
  archiveNote,
  attachNoteFile,
  connectNote,
  deleteNote,
  detachNoteFile,
  editNote,
  noteOptions,
  shareNote,
} from "../api/notes";
export function NoteDetail({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const query = useQuery(noteOptions(id)),
    client = useQueryClient();
  const { data: me } = useSession();
  const { projects } = useWorkspaceStore();
  const picker = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [editorReset, setEditorReset] = useState(0);
  const note = query.data,
    own = note?.ownerId === me?.id;
  const action = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: async () => {
      await Promise.all([client.invalidateQueries({ queryKey: ["notes"] }),client.invalidateQueries({queryKey:["tasks"]})]);
    },
  });
  const project = projects.find((p) => p.id === note?.projectId);
  const writable =
    own &&
    (!note?.shared || project?.role === "owner" || project?.role === "editor");
  return (
    <MobileSurface
      title="메모"
      aria-label="메모"
      isOpen
      onOpenChange={(open) => {
        if (!open && !action.isPending) {
          if (
            draft !== null &&
            draft !== note?.body &&
            !window.confirm("작성 중인 변경을 버리고 닫을까요?")
          )
            return;
          onClose();
        }
      }}
      presentation="fullscreen"
      width={720}
      maxHeight="85dvh"
      style={{ height: mobile ? '100dvh' : 'min(48rem, 85dvh)' }}
      padding={0}
      purpose={writable ? "form" : "info"}
    >
      <Layout
        padding={3}
        height="fill"
        header={
          <LayoutHeader hasDivider={false} padding={3}>
          <HStack justify="between" align="center" gap={2}>
            {note ? <HStack align="center" gap={2} style={{ flex: 1, minWidth: 0 }}>
              <VStack gap={0.5} style={{ minWidth: 0 }}>
                <Text weight="semibold" maxLines={1}>{note.authorName}</Text>
                <NoteIdentity id={id} archived={note.archived} />
                <Text type="supporting" color="secondary" maxLines={1}>{new Date(note.createdAt).toLocaleString("ko-KR")}</Text>
              </VStack>
              <Text type="supporting" color="secondary">{note.shared ? "프로젝트 공유" : "나만 보기"}</Text>
            </HStack> : null}
          {writable && note && draft !== null && draft !== note.body ? (
            <HStack gap={1} style={{ flexShrink: 0 }}>
              <Button label="수정 취소" aria-label="수정 취소" variant="secondary" size="sm" isDisabled={action.isPending}
                onClick={() => { setDraft(null); setEditorReset(value => value + 1); }}>취소</Button>
              <Button label="수정 저장" aria-label="수정 저장" variant="primary" size="sm"
                isDisabled={action.isPending || (!draft.trim() && !note.files.length)}
                onClick={() => action.mutate(async () => {
                  await editNote(id, draft);
                  client.setQueryData(noteOptions(id).queryKey, { ...note, body: draft });
                  setDraft(null);
                })}>저장</Button>
            </HStack>
          ) : <Button label="닫기" icon={<HgiCancel />} isIconOnly variant="ghost"
            onClick={() => {
              if (!action.isPending) {
                if (
                  draft !== null &&
                  draft !== note?.body &&
                  !window.confirm("작성 중인 변경을 버리고 닫을까요?")
                )
                  return;
                onClose();
              }
            }}
          />}
          </HStack>
          </LayoutHeader>
        }
        footer={note ? <LayoutFooter hasDivider={false} padding={0} label="메모 기능">
                  {note.files.length ? <div className="note-attachment-tray note-attachment-tray-detail">
                    {note.files.map(file => <NoteAttachment key={file.id} name={file.fileName} type={file.contentType} dominantColor={file.dominantColor}
                      size={file.size} url={file.url} busy={action.isPending} removeLabel="첨부 삭제"
                      onRemove={writable ? () => { if (window.confirm('이 첨부파일을 삭제할까요?')) action.mutate(() => detachNoteFile(id, file.id)); } : undefined} />)}
                  </div> : null}
          <VStack padding={3} style={{ borderTop: "var(--border-width) solid var(--color-border)" }}>
                  {own ? (
                    <VStack gap={2}>
                      <HStack gap={1} wrap="wrap" align="center">
                        {writable ? <>
                          <input ref={picker} type="file" hidden onChange={event => {
                            const file = event.target.files?.[0];
                            event.target.value = '';
                            if (file) action.mutate(() => {
                              if (file.size === 0 || file.size > 10 * 1024 * 1024) throw new Error('파일은 0바이트보다 크고 10 MB 이하여야 합니다.');
                              return attachNoteFile(id, file);
                            });
                          }} />
                          <Button label="첨부파일 추가" icon={<HgiAttachment />} isIconOnly variant="ghost" size="sm"
                            isDisabled={action.isPending || note.files.length >= 5} onClick={() => picker.current?.click()} />
                        </> : null}
                        <Selector
                          label="연결 프로젝트"
                          size="sm"
                          width={170}
                          isLabelHidden
                          value={note.projectId ?? ""}
                          options={[
                            { value: "", label: "프로젝트 없음" },
                            ...projects.map((p) => ({
                              value: p.id,
                              label: p.name,
                            })),
                          ]}
                          isDisabled={action.isPending}
                          onChange={(value) => {
                            if (
                              note.shared &&
                              !window.confirm(
                                "프로젝트를 변경하면 나만 보기로 전환됩니다. 변경할까요?",
                              )
                            )
                              return;
                            action.mutate(() => connectNote(id, value || null));
                          }}
                        />
                        <Button
                          label={
                            note.shared ? "공유 해제" : "공유"
                          }
                          variant="secondary"
                          size="sm"
                          isDisabled={
                            action.isPending ||
                            (!note.shared &&
                              (!project || project.role === "viewer"))
                          }
                          onClick={() => {
                            if (
                              !note.shared &&
                              !window.confirm(
                                project?.name +
                                  " 프로젝트 멤버에게 이 메모와 첨부파일을 공유할까요?",
                              )
                            )
                              return;
                            action.mutate(() => shareNote(id, !note.shared));
                          }}
                        />
                        <MoreMenu label="메모 더보기" size="sm" placement="above" alignment="end"
                          isDisabled={action.isPending} items={[{label:note.archived?'보관 해제':'메모 보관',onClick:()=>action.mutate(()=>archiveNote(id,!note.archived))},{
                            label: '메모 삭제', icon: <HgiTrash />, variant: 'destructive',
                            onClick: () => {
                              if (window.confirm('메모와 첨부파일을 삭제할까요?'))
                                action.mutate(async () => { await deleteNote(id); onClose(); });
                            },
                          }]} />
                      </HStack>


                    </VStack>
                  ) : (
                    <Text color="secondary">
                      {note.projectName}에 공유된 메모입니다.
                    </Text>
                  )}
          </VStack>
        </LayoutFooter> : undefined}
        content={
          <LayoutContent isScrollable role="region" label="메모 본문 영역" padding={3} style={{ paddingBottom: 'var(--spacing-4)' }}>
            <VStack gap={3}>
              {query.isPending || query.error ? (
                <RequestState
                  error={query.error}
                  retry={() => void query.refetch()}
                />
              ) : note ? (
                <>

                  {writable ? (
                    <VStack className="note-detail-editor">
                      <Suspense fallback={<Text color="secondary">편집기를 불러오는 중…</Text>}>
                        <LazyDocumentEditor key={`${id}:${editorReset}`} initialMarkdown={note.body} label="메모 본문" onChange={value => setDraft(value.markdown)} disabled={action.isPending} />
                      </Suspense>
                    </VStack>
                  ) : note.body ? (
                    <Suspense fallback={<Text>문서를 불러오는 중…</Text>}><LazyDocumentEditor key={id} initialMarkdown={note.body} label="메모 본문" readOnly /></Suspense>
                  ) : null}


                </>
              ) : null}
              {note ? <NoteTags id={id} tags={note.tags} writable={Boolean(writable)} /> : null}
              {action.error ? (
                <Text role="alert">{action.error.message}</Text>
              ) : null}
            </VStack>
          </LayoutContent>
        }
      />
    </MobileSurface>
  );
}
