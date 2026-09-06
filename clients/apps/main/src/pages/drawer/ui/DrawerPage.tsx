import { MobilePageHeader } from '@/shared/ui/mobile';
import { noteLabel, noteMarkdown, useNoteStore, type Note } from '@/entities/note';
import { TITLE_PAD_TOP, TITLE_ROW, WIDTH } from '@/shared/config';
import { HgiSearch } from '@/shared/ui/icons';
import { CreateButton, MOBILE_QUERY } from '@/shared/ui/mobile';
import { AlertDialog, Button, Card, EmptyState, Heading, HStack, Layout, LayoutContent, LayoutHeader, Markdown, Text, TextInput, Toolbar, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useRef, useState } from 'react';
import { Attachment } from './Attachment';
import { NoteEditor } from './NoteEditor';


export function DrawerPage() {
  const { notes, saveNote, moveNote, removeNote } = useNoteStore();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const narrow = useMediaQuery('(max-width: 600px)');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Note | 'new' | null>(null);
  const [removing, setRemoving] = useState<Note | null>(null);
  const dragging = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const filtered = notes.filter((n) => `${noteMarkdown(n)} ${(n.files ?? []).map((f) => f.name).join(' ')}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const move = (id: string, target: string) => { moveNote(id, target); setAnnouncement('서랍의 순서를 변경했습니다.'); };
  return <>
    <Layout padding={0} height="fill" contentWidth={WIDTH.wide} header={<>
      {mobile ? <><MobilePageHeader title="서랍" /><CreateButton label="서랍에 추가" onClick={() => setEditing('new')} /></> : <LayoutHeader hasDivider padding={mobile ? 0 : undefined}><VStack gap={2}>
        <HStack justify="between" align="center" width="100%" height={mobile ? undefined : TITLE_ROW} paddingBlock={mobile ? 2 : undefined} paddingBlockStart={mobile ? 2 : TITLE_PAD_TOP} paddingInline={mobile ? 3 : 4} gap={3}>
          <Heading level={1}>서랍</Heading><CreateButton label="서랍에 추가" onClick={() => setEditing('new')} />
        </HStack>
        {!mobile ? <VStack paddingInline={mobile ? 3 : 4}><Text color="secondary">생각과 자료를 자유롭게 모아두세요.</Text></VStack> : null}
      </VStack></LayoutHeader>}
      <Toolbar className={mobile ? undefined : "page-filter-toolbar"} label="서랍 검색" size={mobile ? 'lg' : 'sm'} startContent={
          <TextInput label="서랍 검색" isLabelHidden placeholder="내용이나 파일 이름으로 검색" value={query} onChange={setQuery} startIcon={<HgiSearch />} hasClear width={mobile ? 'calc(100vw - 60px)' : 220} />
        } />
    </>} content={<LayoutContent padding={mobile ? 3 : 4} style={{ paddingBottom: 'calc(var(--spacing-10) + var(--spacing-10))' }}>
      <VStack gap={4}>
        <Text type="supporting" aria-live="polite">{announcement || (query ? `${filtered.length}개 검색됨` : '카드를 끌어 순서를 바꾸거나 이동 버튼을 사용하세요.')}</Text>
        {filtered.length ? <VStack as="section" aria-label="서랍 내용" style={{ display: 'block', columnCount: narrow ? 1 : mobile ? 2 : 3, columnGap: 'var(--spacing-4)' }}>
          {filtered.map((note, index) => <Card key={note.id} padding={4} draggable={!mobile && !query} aria-label={noteLabel(note)}
            onDragStart={(e) => { dragging.current = note.id; e.dataTransfer.setData('text/plain', note.id); e.dataTransfer.effectAllowed = 'move'; }}
            onDragEnd={() => { dragging.current = null; }} onDragOver={(e) => { if (dragging.current && !query) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); if (dragging.current && !query) move(dragging.current, note.id); dragging.current = null; }}
            style={{ breakInside: 'avoid', marginBottom: 'var(--spacing-4)', overflowWrap: 'anywhere' }}>
            <VStack gap={3}>
              {noteMarkdown(note) ? <VStack className="drawer-markdown" style={{ maxHeight: 'calc(var(--spacing-10) * 6)', overflow: 'hidden' }}>
                <Markdown headingLevelStart={2} density="compact" contentWidth="100%">{noteMarkdown(note)}</Markdown>
              </VStack> : null}
              {(note.files ?? []).map((file, i) => <Attachment key={i} file={file} />)}
              <HStack gap={1} wrap="wrap" justify="between">
                <Button label="열기" aria-label={`${noteLabel(note)} 열기`} size="sm" variant="ghost" onClick={() => setEditing(note)} />
                <HStack gap={1}><Button label="앞으로" aria-label={`${noteLabel(note)} 앞으로 이동`} size="sm" variant="ghost" isDisabled={Boolean(query) || index === 0} onClick={() => move(note.id, filtered[index - 1].id)} />
                  <Button label="뒤로" aria-label={`${noteLabel(note)} 뒤로 이동`} size="sm" variant="ghost" isDisabled={Boolean(query) || index === filtered.length - 1} onClick={() => move(note.id, filtered[index + 1].id)} /></HStack>
              </HStack>
            </VStack>
          </Card>)}
        </VStack> : <EmptyState title={query ? '검색 결과가 없습니다' : '서랍이 비어 있습니다'} description="짧은 생각을 적거나 파일을 추가해 보세요." />}
      </VStack>
    </LayoutContent>} />
    {editing ? <NoteEditor key={editing === 'new' ? 'new' : editing.id} note={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)}
      onSave={(body, files) => saveNote(editing === 'new' ? null : editing.id, body, files)}
      onRemove={editing === 'new' ? undefined : () => { setRemoving(editing); setEditing(null); }} /> : null}
    <AlertDialog isOpen={Boolean(removing)} onOpenChange={(open) => { if (!open) setRemoving(null); }} title="서랍에서 삭제하시겠습니까?"
      description="이 기록과 첨부파일을 서랍에서 삭제합니다." actionLabel="삭제" cancelLabel="취소" onAction={() => { if (removing) removeNote(removing.id); setRemoving(null); }} />
  </>;
}
