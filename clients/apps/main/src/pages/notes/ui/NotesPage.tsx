import { PageLayout, PageContent, PageHeader } from '@/shared/ui/page-layout';
import { MobilePageHeader } from '@/shared/ui/mobile';
import { useNoteStore } from '@/entities/note';
import { PANEL, WIDTH } from '@/shared/config';
import { HgiNote } from '@/shared/ui/icons';
import { CreateButton, CreateDialog, MOBILE_QUERY, MobileSurface } from '@/shared/ui/mobile';
import {
    DialogHeader,
    Heading,
    HStack,
    Item,
    Layout,
    LayoutContent,
    LayoutPanel,
    List,
    Text,
    VStack
} from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useState } from 'react';

import { type NotesProps } from './notes';

export function NotesPage({ notes, selectedId, onSelect }: NotesProps) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const { addNote } = useNoteStore();
  const [creating, setCreating] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const note = notes.find((n) => n.id === selectedId) ?? notes[0] ?? null;

  return (
    <>
    <PageLayout
      padding={0}
      height="fill"
      contentWidth={WIDTH.wide}
      header={
        mobile ? <><MobilePageHeader title="메모" /><CreateButton label="새 메모" onClick={() => setCreating(true)} /></> : <PageHeader title="메모" description="아이디어와 참고할 내용을 개인 메모로 기록합니다." actions={<CreateButton label="새 메모" onClick={() => setCreating(true)} />} />
      }
      start={mobile ? undefined :
        <LayoutPanel width={PANEL.list} hasDivider isScrollable padding={3}>
          <List style={{ marginInline: 'calc(-1 * var(--spacing-2))' }}>
            {notes.map((n) => (
              <Item
                key={n.id}
                as="li"
                density="compact"
                isSelected={note?.id === n.id}
                onClick={() => onSelect(n.id)}
                startContent={<HgiNote size={14} />}
                label={n.title}
                description={n.updatedAt}
              />
            ))}
          </List>
        </LayoutPanel>
      }
    >
      <PageContent padding={mobile ? 3 : 4} style={mobile ? { paddingBottom: 'calc(var(--spacing-10) + var(--spacing-4))' } : undefined}>
        {mobile ? <VStack gap={3}><Text color="secondary">아이디어와 참고할 내용을 개인 메모로 기록합니다.</Text><List hasDividers style={{ marginInline: 'calc(-1 * var(--spacing-3))' }}>{notes.map((n) => <Item key={n.id} as="li" label={n.title} labelLines={2} description={n.updatedAt} density="spacious"
          startContent={<HgiNote />} onClick={() => { onSelect(n.id); setDetailOpen(true); }} />)}</List></VStack> : note ? (
          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={2} accessibilityLevel={1}>{note.title}</Heading>
              <Text type="supporting">{note.updatedAt}</Text>
            </VStack>
            <VStack gap={2}>
              {note.body.split('\n').map((line) => (
                <Text key={line}>{line}</Text>
              ))}
            </VStack>
          </VStack>
        ) : null}
      </PageContent>
    </PageLayout>
    <MobileSurface title="메모" presentation="fullscreen" isOpen={mobile && detailOpen} onOpenChange={setDetailOpen}>
      <Layout header={<DialogHeader title="메모" onOpenChange={setDetailOpen} />} content={<LayoutContent><VStack gap={4}>
        <Heading level={2}>{note?.title}</Heading><Text color="secondary">{note?.updatedAt}</Text>
        <Text style={{ whiteSpace: 'pre-wrap' }}>{note?.body}</Text>
      </VStack></LayoutContent>} />
    </MobileSurface>
    {creating ? <CreateDialog title="새 메모" onClose={() => setCreating(false)} onSave={(title, body) => addNote(title, body)} /> : null}
    </>
  );
}
