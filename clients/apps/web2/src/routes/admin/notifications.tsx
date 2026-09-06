import { Card, EmptyState, Text } from '@astryxdesign/core';
import { createFileRoute } from '@tanstack/react-router';
import { api, type PushFailurePageView } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

export const Route = createFileRoute('/admin/notifications')({
  loader: () => api.get<PushFailurePageView>(ENDPOINTS.adminPushFailures),
  component: AdminNotificationPage,
});

function AdminNotificationPage() {
  const page = Route.useLoaderData();

  return (
    <section className="page page-wide">
      <Text as="h1" type="display-3">
        알림 문제
      </Text>
      {page.items.length === 0 ? (
        <EmptyState title="닿지 못한 알림이 없습니다" />
      ) : (
        <ul className="card-list">
          {page.items.map((failure) => (
            <li key={failure.id}>
              <Card padding={4}>
                <Text as="span">{failure.endpoint}</Text>
                <Text as="p" type="supporting">
                  {failure.occurredAt} · {failure.reason === 'GONE' ? '구독 만료' : '발송 실패'}
                </Text>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
