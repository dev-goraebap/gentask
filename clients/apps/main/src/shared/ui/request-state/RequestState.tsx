import { Button, Heading, Text, VStack } from '@astryxdesign/core';

export function RequestState({ error, retry }: { error?: Error | null; retry?: () => void }) {
  return <VStack padding={4} gap={3} role={error ? 'alert' : 'status'}>
    <Heading level={2}>{error ? '불러오지 못했습니다' : '불러오는 중입니다'}</Heading>
    {error ? <Text>{error.message}</Text> : null}
    {error && retry ? <Button label="다시 시도" onClick={retry} /> : null}
  </VStack>;
}
