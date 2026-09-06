import { BackButton } from '@/shared/ui/navigation';
import { MobilePageHeader } from '@/shared/ui/mobile';
import { DOC_FOLDERS } from '@/entities/document';
import { CriteriaBadge, KindToken, StateDot } from '@/entities/issue';
import { PANEL, TITLE_PAD_TOP, TITLE_ROW, WIDTH } from '@/shared/config';
import { HgiEdit } from '@/shared/ui/icons';
import {
    Button,
    Divider,
    Heading,
    HStack,
    Item,
    Layout,
    LayoutContent,
    LayoutHeader,
    LayoutPanel,
    List,
    Text,
    VStack,
} from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { DocBlock } from './DocBlock';
import { type DocDetailProps } from './document-detail';

export function DocumentDetailPage({ doc, items, onBack, onOpenItem }: DocDetailProps) {
  const mobile = useMediaQuery('(max-width: 1024px)');
  const folder = DOC_FOLDERS.find((f) => f.id === doc.folderId);
  const derived = items.filter((i) => i.docIds.includes(doc.id));

  return (
    <Layout
      padding={0}
      height="fill"
      contentWidth={WIDTH.wide}
      header={
        mobile ? <MobilePageHeader title={doc.title} onBack={onBack} actions={<Button label="편집" variant="secondary" size="lg" icon={<HgiEdit />} />} /> : <LayoutHeader hasDivider padding={mobile ? 0 : undefined}>
          <HStack justify="between" align="center" width="100%" height={mobile ? undefined : TITLE_ROW} paddingBlock={mobile ? 2 : undefined} paddingBlockStart={mobile ? 2 : TITLE_PAD_TOP} paddingInline={mobile ? 3 : 4} gap={3}>
            <HStack align="center" gap={1} style={{ flex: 1, minWidth: 0 }}>
              <BackButton onClick={onBack} />
              <Text weight={mobile ? 'semibold' : undefined} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mobile ? doc.title : folder?.title}</Text>
            </HStack>
            <Button label="편집" variant="secondary" size="sm" icon={<HgiEdit />} />
          </HStack>
        </LayoutHeader>
      }
      end={mobile ? undefined :
        <LayoutPanel width={PANEL.meta} hasDivider isScrollable padding={4}>
          <VStack gap={4}>
            <VStack gap={1}>
              <Text type="supporting">마지막 개정</Text>
              <Text>
                {doc.updatedBy} · {doc.updatedAt}
              </Text>
            </VStack>

            <Divider />

            <VStack gap={2}>
              <Text type="supporting">이 문서를 근거로 삼는 작업 항목 {derived.length}건</Text>
              {derived.length === 0 ? (
                <Text type="supporting">아직 연결된 작업 항목이 없습니다.</Text>
              ) : (
                <List hasDividers style={{ marginInline: 'calc(-1 * var(--spacing-2))' }}>
                  {derived.map((item) => (
                    <Item
                      key={item.id}
                      as="li"
                      onClick={() => onOpenItem(item.id)}
                      startContent={<KindToken kind={item.kind} />}
                      label={item.title}
                      /* 패널이 좁으므로 진행도를 제목 옆이 아니라 아래 줄에 둔다. */
                      description={
                        <HStack gap={2} align="center" wrap="wrap">
                          <Text type="supporting">{item.id}</Text>
                          <CriteriaBadge item={item} />
                        </HStack>
                      }
                      endContent={<StateDot state={item.state} />}
                    />
                  ))}
                </List>
              )}
            </VStack>
          </VStack>
        </LayoutPanel>
      }
    >
      <LayoutContent padding={mobile ? 3 : 4}>
        <VStack gap={5}>
          <Heading level={2} accessibilityLevel={1}>{doc.title}</Heading>
          {mobile ? <VStack gap={2}>
            <Text type="supporting">마지막 개정 · {doc.updatedBy} · {doc.updatedAt}</Text>
            {derived.length ? <List hasDividers style={{ marginInline: 'calc(-1 * var(--spacing-3))' }}>{derived.map((item) => <Item key={item.id} as="li" label={item.title}
              description={item.id} density="spacious" onClick={() => onOpenItem(item.id)} />)}</List> : null}
          </VStack> : null}
          <VStack gap={3}>
            {doc.body.split('\n\n').map((block) => (
              <DocBlock key={block} block={block} />
            ))}
          </VStack>
        </VStack>
      </LayoutContent>
    </Layout>
  );
}
