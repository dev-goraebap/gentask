import { Banner, Button, Card, FormLayout, Text, TextInput } from '@astryxdesign/core';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { loadSession, login } from '@/entities/session';
import { ROUTES } from '@/shared/config/routes';

export const Route = createFileRoute('/login')({
  // 가드가 튕겨 보낸 자리를 받아 로그인 뒤 그리로 되돌린다.
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  // 이미 들어온 사람에게 로그인 화면을 다시 보이지 않는다.
  beforeLoad: async () => {
    // 서버가 닿지 않아도 이 화면은 보여야 한다. 이미 들어왔는지 묻는 것이 실패하면 그냥 보인다.
    const me = await loadSession().catch(() => null);
    if (me) throw redirect({ to: ROUTES.home() });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect: back } = Route.useSearch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login(email, password);
      // 가드가 보낸 자리가 있으면 그리로 되돌린다.
      await navigate({ to: back ?? ROUTES.home() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '로그인하지 못했습니다');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-page">
      <Card padding={6} maxWidth={400}>
        <Text as="h1" type="display-3">
          로그인
        </Text>
        <form onSubmit={submit} className="auth-form">
          <FormLayout>
            <TextInput
              label="이메일"
              type="email"
              value={email}
              onChange={setEmail}
              isRequired
              status={error ? { type: 'error' } : undefined}
            />
            <TextInput
              label="비밀번호"
              type="password"
              value={password}
              onChange={setPassword}
              isRequired
              status={error ? { type: 'error' } : undefined}
            />
          </FormLayout>
          {error ? <Banner status="error" title={error} /> : null}
          <Button type="submit" label="로그인" variant="primary" isLoading={pending} />
        </form>
        <nav className="auth-links">
          <Link to={ROUTES.signup()}>회원가입</Link>
          <Link to={ROUTES.passwordReset()}>비밀번호 재설정</Link>
        </nav>
      </Card>
    </main>
  );
}
