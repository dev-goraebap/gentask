import { Button, HStack, LayoutFooter, Pagination, Text, VStack } from '@astryxdesign/core';
import { PageSize } from './PageSize';

export function ListingFooter({ total, page, size, mobile, onPage, onSize, shown, onLoadMore, unit = '개' }: {
  total: number; page: number; size: number; mobile: boolean;
  shown: number; onLoadMore: () => void; unit?: string;
  onPage: (page: number) => void; onSize: (size: number) => void;
}) {
  if (mobile) return total > 0 ? <VStack gap={2} paddingBlock={4}>
    <Text type="supporting" aria-live="polite">전체 {total}{unit} 중 {shown}{unit} 표시</Text>
    {shown < total ? <Button label="더 보기" size="lg" width="100%" onClick={onLoadMore} /> : <Text type="supporting">모든 항목을 표시했습니다.</Text>}
  </VStack> : null;
  return <LayoutFooter hasDivider><VStack gap={2} paddingInline={4} paddingBlock={2}>
    <HStack justify="between" align="center" gap={3}>
      <Text type="supporting" aria-live="polite">전체 {total}{unit} · {total ? (page - 1) * size + 1 : 0}–{Math.min(page * size, total)}{unit} 표시</Text>
      <Text type="supporting">페이지당 개수</Text>
    </HStack>
    <HStack justify="between" align="center" gap={3} wrap="wrap">
      <Pagination label="목록 페이지" page={page} totalItems={total} pageSize={size} onChange={onPage} />
      <PageSize value={size} onChange={onSize} isLabelHidden placement="above" />
    </HStack>
  </VStack></LayoutFooter>;
}
