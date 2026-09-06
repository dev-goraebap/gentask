import { Button, Card, Text } from '@astryxdesign/core';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ROUTES } from '@/shared/config/routes';

/** 실패한 자리는 로그인하지 않아도 보여야 하므로 껍데기 밖에 둔다. */
export const Route = createFileRoute('/$')({
  component: NotFoundPage,
});

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="auth-page">
      <Card padding={6} maxWidth={400}>
        <Text as="h1" type="display-3">
          찾지 못했습니다
        </Text>
        <Text as="p">주소가 가리키는 자리가 없습니다.</Text>
        <Button label="처음으로" variant="primary" onClick={() => void navigate({ to: ROUTES.home() })} />
      </Card>
    </main>
  );
}
