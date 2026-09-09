import { Button, HStack, Spinner, Text, VStack } from '@astryxdesign/core';
import { useEffect, useState } from 'react';

export function NoteListLoading({ fetching, failed, complete, retry }: {
  fetching: boolean; failed: boolean; complete: boolean; retry: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    if (!fetching) return;
    const timer = window.setTimeout(() => setVisible(true), 200);
    return () => window.clearTimeout(timer);
  }, [fetching]);
  return <VStack align="center" justify="center" padding={3} style={{ minHeight: '4rem' }}>
    {fetching ? visible ? <Spinner size="md" shade="subtle" label="메모를 더 불러오는 중입니다" /> : null : failed ?
      <HStack align="center" justify="center" gap={2} wrap="wrap" role="status">
        <Text type="supporting" color="secondary">다음 메모를 불러오지 못했습니다.</Text>
        <Button label="다시 시도" size="sm" variant="secondary" onClick={retry} />
      </HStack> : complete ? <Text type="supporting" color="secondary" role="status">모든 메모를 불러왔습니다.</Text> : null}
  </VStack>;
}
