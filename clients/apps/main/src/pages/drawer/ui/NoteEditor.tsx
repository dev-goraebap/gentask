import { FilePicker } from '@/shared/ui/file-picker';
import { noteMarkdown, type Note } from '@/entities/note';
import { LazyMarkdownEditor as MarkdownEditor } from '@/shared/ui/markdown-editor';
import { MobileSurface } from '@/shared/ui/mobile';
import { Button, DialogHeader, HStack, Layout, LayoutContent, LayoutFooter, TextArea, VStack } from '@astryxdesign/core';
import { Suspense, useState } from 'react';


export function NoteEditor({ note, onClose, onSave, onRemove }: { note?: Note; onClose: () => void; onSave: (body: string, files: File[]) => void; onRemove?: () => void }) {
  const [body, setBody] = useState(() => noteMarkdown(note));
  const [files, setFiles] = useState<File[]>([...(note?.files ?? [])]);
  return <MobileSurface title="서랍 기록" presentation="fullscreen" isOpen onOpenChange={(open) => { if (!open) onClose(); }} purpose="form" width="40rem">
    <Layout header={<DialogHeader title={note ? '기록 편집' : '서랍에 추가'} onOpenChange={onClose} />}
      content={<LayoutContent><VStack gap={4}>
        <Suspense fallback={<TextArea label="내용" value={body} onChange={setBody} rows={10} />}>
          <MarkdownEditor value={body} onChange={setBody} />
        </Suspense>
        <FilePicker label="첨부파일" value={files} onChange={setFiles} multiple />
      </VStack></LayoutContent>}
      footer={<LayoutFooter hasDivider><HStack gap={2} paddingBlock={3} wrap="wrap">
        {onRemove ? <Button label="삭제" variant="destructive" onClick={onRemove} /> : null}
        <Button label="취소" onClick={onClose} /><Button label="저장" variant="primary" isDisabled={!body.trim() && !files.length}
          onClick={() => { onSave(body, files); onClose(); }} />
      </HStack></LayoutFooter>} />
  </MobileSurface>;
}
