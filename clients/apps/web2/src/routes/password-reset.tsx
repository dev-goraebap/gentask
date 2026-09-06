import { Banner, Button, Card, FormLayout, Text, TextInput } from '@astryxdesign/core';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { ROUTES } from '@/shared/config/routes';

export const Route = createFileRoute('/password-reset')({
  component: PasswordResetPage,
});

/**
 * 비밀번호를 모르는 채 지나는 자리라 가드를 두지 않는다. 신원은 일회용 코드가 판정한다.
 */
function PasswordResetPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const run = async (task: () => Promise<void>) => {
    setPending(true);
    setError(null);
    try {
      await task();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '요청이 실패했습니다');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-page">
      <Card padding={6} maxWidth={400}>
        <Text as="h1" type="display-3">
          비밀번호 재설정
        </Text>

        {step === 'request' ? (
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await api.post(ENDPOINTS.passwordReset, { email });
                setStep('confirm');
              });
            }}
          >
            <TextInput label="이메일" type="email" value={email} onChange={setEmail} isRequired />
            {error ? <Banner status="error" title={error} /> : null}
            <Button type="submit" label="코드 받기" variant="primary" isLoading={pending} />
          </form>
        ) : (
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await api.post(ENDPOINTS.passwordResetConfirm, { email, code, password });
                await navigate({ to: ROUTES.login() });
              });
            }}
          >
            <FormLayout>
              <TextInput
                label="확인 코드"
                value={code}
                onChange={setCode}
                isRequired
                description={`${email} 으로 보낸 여섯 자리입니다`}
              />
              <TextInput
                label="새 비밀번호"
                type="password"
                value={password}
                onChange={setPassword}
                isRequired
              />
            </FormLayout>
            {error ? <Banner status="error" title={error} /> : null}
            <Button type="submit" label="재설정" variant="primary" isLoading={pending} />
          </form>
        )}

        <nav className="auth-links">
          <Link to={ROUTES.login()}>로그인으로</Link>
        </nav>
      </Card>
    </main>
  );
}
