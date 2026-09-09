import { ApiError } from '@/shared/api';
import { PageState } from '@/shared/ui/page-state';
import { useEffect, useState } from 'react';
import { Button, Heading, VStack } from '@astryxdesign/core';

export function RequestState({ error, retry }: { error?: Error | null; retry?: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    if (error) return;
    const timer = window.setTimeout(() => setVisible(true), 200);
    return () => window.clearTimeout(timer);
  }, [error]);
  if (!error && !visible) return null;
  if (error) {
    const missing = error instanceof ApiError && error.status === 404;
    return <VStack role="alert" style={{ width: '100%' }}><PageState kind={missing ? 'not-found' : 'error'}
      title={missing ? '찾을 수 없습니다' : '불러오지 못했습니다'}
      description={missing ? '삭제되었거나 접근할 수 없는 항목입니다.' : error instanceof ApiError && error.status >= 500 ? '잠시 후 다시 시도해 주세요.' : error.message}
      actions={retry ? <Button label="다시 시도" onClick={retry} /> : undefined} /></VStack>;
  }
  return <VStack padding={4} gap={3} role="status"><Heading level={2}>불러오는 중입니다</Heading></VStack>;
}
