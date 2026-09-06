import { Card, Text } from '@astryxdesign/core';
import { createFileRoute } from '@tanstack/react-router';

/** 아직 자리만 잡아 둔 시안이다. 규격이 서면 서술서와 인수 조건이 먼저 생긴다. */
export const Route = createFileRoute('/_app/pets')({
  component: () => (
    <Card padding={6}>
      <Text as="h1" type="display-3">
        팻 관리
      </Text>
      <Text as="p">규격이 정해지지 않은 시안입니다.</Text>
    </Card>
  ),
});
