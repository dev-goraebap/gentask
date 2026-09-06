import { Button, HStack, LayoutFooter, Pagination, Text, VStack } from '@astryxdesign/core';
import { PageSize } from './PageSize';

export function ListingFooter({ total, page, size, mobile, onPage, onSize }: {
  total: number; page: number; size: number; mobile: boolean;
  onPage: (page: number) => void; onSize: (size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return <LayoutFooter hasDivider><VStack gap={2} paddingInline={4} paddingBlock={2}>
    <HStack justify="between" align="center" gap={3}>
      <Text type="supporting" aria-live="polite">전체 {total}개 · {total ? (page - 1) * size + 1 : 0}–{Math.min(page * size, total)}개 표시</Text>
      {!mobile ? <Text type="supporting">페이지당 개수</Text> : null}
    </HStack>
    {mobile ? <HStack justify="between" align="center" gap={2}>
      <Button label="이전" size="lg" isDisabled={page <= 1} onClick={() => onPage(page - 1)} />
      <Text aria-live="polite">{page} / {pages}</Text>
      <Button label="다음" size="lg" isDisabled={page >= pages} onClick={() => onPage(page + 1)} />
    </HStack> : <HStack justify="between" align="center" gap={3} wrap="wrap">
      <Pagination label="목록 페이지" page={page} totalItems={total} pageSize={size} onChange={onPage} />
      <PageSize value={size} onChange={onSize} isLabelHidden placement="above" />
    </HStack>}
  </VStack></LayoutFooter>;
}
