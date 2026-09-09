import { useNoteFiles } from '../model/useNoteFiles';
import { NoteAttachment } from './NoteAttachment';
import { useWorkspaceStore } from "@/entities/workspace";
import { HgiAttachment } from "@/shared/ui/icons";
import { MOBILE_QUERY } from "@/shared/ui/mobile";
import { LazyRichEditor, type RichEditorHandle } from '@/shared/ui/markdown-editor';
import { Button, HStack, Selector, Text, VStack } from "@astryxdesign/core";
import {
  ChatComposer,
  ChatComposerDrawer,
} from "@astryxdesign/core/Chat";
import { useMediaQuery } from "@astryxdesign/core/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Suspense, useRef, useState } from "react";
import { createNote, prepareNoteFile } from "../api/notes";

export function NoteComposer({ onCreated, initialProjectId }: { onCreated: () => void; initialProjectId?: string }) {
  const { projects } = useWorkspaceStore();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const client = useQueryClient();
  const [body, setBody] = useState("");
  const [projectId, setProjectId] = useState(initialProjectId ?? "");
  const attachments = useNoteFiles();
  const files = attachments.files.map(item => item.file);
  const [error, setError] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const input = useRef<RichEditorHandle>(null);
  const uploaded = useRef(new Map<File, string>());
  const addFiles = (incoming: File[]) => { if (!saving.isPending) { setError(''); saving.reset(); attachments.add(incoming); } };
  const saving = useMutation({
    mutationFn: async () => {
      const keys: string[] = [];
      for (const file of files) {
        let key = uploaded.current.get(file);
        if (!key) {
          key = await prepareNoteFile(file);
          uploaded.current.set(file, key);
        }
        keys.push(key);
      }
      return createNote(body, projectId || null, keys);
    },
    onSuccess: async () => {
      input.current?.clear();
      setBody("");
      attachments.clear();
      uploaded.current.clear();
      setError("");
      onCreated();
      await client.invalidateQueries({ queryKey: ["notes", "list"] });
      input.current?.focus();
    },
  });
  const submit = () => {
    if (!saving.isPending && (body.trim() || files.length)) {
      setError("");
      saving.mutate();
    }
  };
  return (
    <VStack gap={1} className="note-composer">
      <input
        ref={picker}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <ChatComposer
        value={body}
        onChange={setBody}
        onSubmit={submit}
        isDisabled={saving.isPending}
        elevation="none"
        input={
          <Suspense fallback={<Text color="secondary">편집기를 불러오는 중…</Text>}>
          <LazyRichEditor
            handleRef={input}
            initialValue={body}
            onChange={setBody}
            label="메모 내용"
            placeholder="떠오른 생각을 남겨보세요"
            hasToolbar={false}
            paragraphAfterHeading
            isDisabled={saving.isPending}
            onSubmit={submit}
            onFiles={addFiles}
          />
          </Suspense>
        }
        drawer={
          files.length ? (
            <ChatComposerDrawer label="첨부파일">
              <div className="note-attachment-tray">
                {attachments.files.map(({id, file}) => <NoteAttachment key={id} file={file}
                  name={file.name} type={file.type} size={file.size} busy={saving.isPending}
                  onRemove={() => { uploaded.current.delete(file); attachments.remove(id); setError(''); saving.reset(); }} />)}
              </div>
            </ChatComposerDrawer>
          ) : undefined
        }
        footerActions={
          <HStack gap={0.5} align="center" style={{ minWidth: 0 }}>
            <Button
              label="파일 첨부"
              isIconOnly
              variant="ghost"
              size="sm"
              icon={<HgiAttachment />}
              isDisabled={saving.isPending || files.length >= 5}
              onClick={() => picker.current?.click()}
            />
            <Selector
              label="연결 프로젝트"
              isLabelHidden
              variant="ghost"
              size="sm"
              value={projectId}
              onChange={setProjectId}
              options={[
                { value: "", label: "프로젝트 없음" },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
              hasSearch
              isDisabled={saving.isPending}
              width={mobile ? 132 : 180}
            />
            {!mobile ? (
              <Text type="supporting" color="secondary">
                나만 보기
              </Text>
            ) : null}
          </HStack>
        }
        sendButton={
          <Button
            label="메모 등록"
            size="sm"
            variant="primary"
            isLoading={saving.isPending}
            isDisabled={saving.isPending || (!body.trim() && !files.length)}
            onClick={submit}
          />
        }
        status={
          error || attachments.error || saving.error
            ? { type: "error", message: error || attachments.error || saving.error?.message }
            : undefined
        }
      />
      <Text
        type="supporting"
        color="secondary"
        style={{ paddingInline: "var(--spacing-2)" }}
      >
        {mobile
          ? "등록한 메모는 나만 볼 수 있어요."
          : "등록한 메모는 나만 볼 수 있어요. · Ctrl / ⌘ + Enter로 등록"}
      </Text>
    </VStack>
  );
}
