import { Avatar, Button, Card, EmptyState, Text, TextInput } from '@astryxdesign/core';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { api, type AdminUserPageView } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

const PAGE_SIZE = 20;

export const Route = createFileRoute('/admin/users')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : '',
    page: Number(search.page ?? 0) || 0,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => {
    const params = new URLSearchParams({ page: String(deps.page), size: String(PAGE_SIZE) });
    if (deps.q) params.set('q', deps.q);
    return api.get<AdminUserPageView>(`${ENDPOINTS.adminUsers}?${params}`);
  },
  component: AdminUserPage,
});

function AdminUserPage() {
  const router = useRouter();
  const page = Route.useLoaderData();
  const { q, page: pageNo } = Route.useSearch();
  const [query, setQuery] = useState(q);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    await router.navigate({ to: '/admin/users', search: { q: query, page: 0 } });
  };

  const goto = (next: number) =>
    void router.navigate({ to: '/admin/users', search: { q, page: next } });

  const last = Math.max(0, Math.ceil(page.total / PAGE_SIZE) - 1);

  return (
    <section className="page page-wide">
      <Text as="h1" type="display-3">
        사용자 관리
      </Text>

      <form onSubmit={search} className="inline-form">
        <TextInput
          label="찾기"
          isLabelHidden
          value={query}
          onChange={setQuery}
          placeholder="이메일 또는 별명"
        />
        <Button type="submit" label="찾기" variant="primary" />
      </form>

      <Text as="p" type="supporting" color="secondary">
        모두 {page.total} 명입니다.
      </Text>

      {page.items.length === 0 ? (
        <EmptyState title="찾은 사용자가 없습니다" description="다른 이메일이나 별명으로 찾습니다." />
      ) : (
        <ul className="card-list">
          {page.items.map((user) => (
            <li key={user.id}>
              <Card padding={4}>
                <div className="row-head">
                  <Avatar name={user.nickname} size="sm" />
                  <Text as="span" type="large">
                    {user.nickname}
                  </Text>
                  {user.role === 'ADMIN' ? (
                    <Text as="span" type="supporting" color="accent">
                      관리자
                    </Text>
                  ) : null}
                </div>
                <div className="row-meta">
                  <Text as="span" type="supporting" color="secondary">
                    {user.email}
                  </Text>
                  <Text as="span" type="supporting" color="secondary">
                    가입 {user.createdAt.slice(0, 10)}
                  </Text>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {last > 0 ? (
        <div className="state-row">
          <Button label="이전" variant="ghost" isDisabled={pageNo <= 0} onClick={() => goto(pageNo - 1)} />
          <Text as="span" type="supporting" color="secondary">
            {pageNo + 1} / {last + 1}
          </Text>
          <Button label="다음" variant="ghost" isDisabled={pageNo >= last} onClick={() => goto(pageNo + 1)} />
        </div>
      ) : null}
    </section>
  );
}
