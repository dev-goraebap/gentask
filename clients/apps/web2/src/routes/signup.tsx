import { Banner, Button, Card, FormLayout, Text, TextInput } from '@astryxdesign/core';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { ROUTES } from '@/shared/config/routes';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

/**
 * 가입은 두 단계다. 먼저 계정을 만들고, 메일로 온 일회용 코드로 소유를 확인한다.
 */
function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
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
          회원가입
        </Text>

        {step === 'form' ? (
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await api.post(ENDPOINTS.signup, { email, password, nickname });
                setStep('confirm');
              });
            }}
          >
            <FormLayout>
              <TextInput label="이메일" type="email" value={email} onChange={setEmail} isRequired />
              <TextInput label="별명" value={nickname} onChange={setNickname} isRequired />
              <TextInput
                label="비밀번호"
                type="password"
                value={password}
                onChange={setPassword}
                isRequired
                description="32자 이상을 권장합니다"
              />
            </FormLayout>
            {error ? <Banner status="error" title={error} /> : null}
            <Button type="submit" label="가입하기" variant="primary" isLoading={pending} />
          </form>
        ) : (
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await api.post(ENDPOINTS.signupConfirm, { email, code });
                await navigate({ to: ROUTES.login() });
              });
            }}
          >
            <TextInput
              label="확인 코드"
              value={code}
              onChange={setCode}
              isRequired
              description={`${email} 으로 보낸 여섯 자리입니다`}
            />
            {error ? <Banner status="error" title={error} /> : null}
            <Button type="submit" label="확인" variant="primary" isLoading={pending} />
            <Button
              label="코드 다시 받기"
              variant="ghost"
              onClick={() =>
                void run(async () => {
                  await api.post(ENDPOINTS.signupResend, { email });
                })
              }
            />
          </form>
        )}

        <nav className="auth-links">
          <Link to={ROUTES.login()}>로그인으로</Link>
        </nav>
      </Card>
    </main>
  );
}
