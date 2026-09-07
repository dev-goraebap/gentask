import { PageLayout, PageContent } from '@/shared/ui/page-layout';
import { BackButton } from '@/shared/ui/navigation';
import { MobilePageHeader } from '@/shared/ui/mobile';
import { DOCS } from '@/entities/document';
import { CriteriaBadge, KindToken, StateDot } from '@/entities/issue';
import { PANEL, TITLE_PAD_TOP, TITLE_ROW, WIDTH } from '@/shared/config';
import { HgiFile } from '@/shared/ui/icons';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import {
    Button,
    Divider,
    Heading,
    HStack,
    Item,
    LayoutHeader,
    LayoutPanel,
    List,
    Section,
    Text,
    VStack
} from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { MetaRail } from './MetaRail';
import { type IssueDetailProps } from './issue-detail';

export function IssueDetailPage({
  item,
  parent,
  children,
  onBack,
  onOpenItem,
  onOpenDoc,
  onToggleCriterion,
  onStateChange,
}: IssueDetailProps) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const linked = DOCS.filter((d) => item.docIds.includes(d.id));

  return (
    <PageLayout
      padding={0}
      height="fill"
      contentWidth={WIDTH.wide}
      header={
        mobile ? <MobilePageHeader title={item.id} onBack={onBack} actions={<KindToken kind={item.kind} />} /> : <LayoutHeader hasDivider padding={mobile ? 0 : undefined}>
          <HStack align="center" width="100%" height={mobile ? undefined : TITLE_ROW} paddingBlock={mobile ? 2 : undefined} paddingBlockStart={mobile ? 2 : TITLE_PAD_TOP} paddingInline={mobile ? 3 : 4} gap={1}>
            <BackButton onClick={onBack} />
            <HStack gap={2} align="center" wrap="wrap">
              <KindToken kind={item.kind} />
              <Text type="supporting">{item.id}</Text>
              {parent ? (
                <Button
                  label={`상위 ${parent.id}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenItem(parent.id)}
                />
              ) : null}
            </HStack>
          </HStack>
        </LayoutHeader>
      }
      end={mobile ? undefined :
        <LayoutPanel width={PANEL.meta} hasDivider isScrollable padding={4}>
          <MetaRail
            item={item}
            onToggleCriterion={onToggleCriterion}
            onStateChange={onStateChange}
          />
        </LayoutPanel>
      }
    >
      <PageContent contentWidth={mobile ? WIDTH.wide : `calc(${WIDTH.wide} - ${PANEL.meta})`} padding={mobile ? 3 : 4}>
        <VStack gap={5}>
          {mobile ? <MetaRail item={item} onToggleCriterion={onToggleCriterion} onStateChange={onStateChange} /> : null}
          <Heading level={2} accessibilityLevel={1}>{item.title}</Heading>
          {mobile && parent ? <Button label={`상위 ${parent.id}`} variant="ghost" onClick={() => onOpenItem(parent.id)} /> : null}

          {item.body ? (
            <VStack gap={2}>
              {item.body.split('\n').map((line) => (
                <Text key={line}>{line}</Text>
              ))}
            </VStack>
          ) : (
            <Text type="supporting">본문이 비어 있습니다.</Text>
          )}

          {linked.length > 0 ? (
            <>
              <Divider />
              <Section>
                <VStack gap={2}>
                  <Text type="supporting">근거 문서</Text>
                  <List hasDividers>
                    {linked.map((doc) => (
                      <Item
                        key={doc.id}
                        as="li"
                        onClick={() => onOpenDoc(doc.id)}
                        startContent={<HgiFile size={14} />}
                        label={doc.title}
                        description={`${doc.updatedBy} · ${doc.updatedAt}`}
                      />
                    ))}
                  </List>
                </VStack>
              </Section>
            </>
          ) : null}

          {children.length > 0 ? (
            <>
              <Divider />
              <Section>
                <VStack gap={2}>
                  <Text type="supporting">하위 항목 {children.length}건</Text>
                  <List hasDividers>
                    {children.map((child) => (
                      <Item
                        key={child.id}
                        as="li"
                        onClick={() => onOpenItem(child.id)}
                        startContent={<KindToken kind={child.kind} />}
                        label={child.title}
                        description={child.id}
                        endContent={
                          <HStack gap={2} align="center">
                            <CriteriaBadge item={child} />
                            <StateDot state={child.state} />
                          </HStack>
                        }
                      />
                    ))}
                  </List>
                </VStack>
              </Section>
            </>
          ) : null}

          <Divider />
          <HStack gap={2}>
            <Button label="코멘트" variant="secondary" size="sm" />
            <Button label="담당자 지정" variant="ghost" size="sm" />
          </HStack>
        </VStack>
      </PageContent>
    </PageLayout>
  );
}
