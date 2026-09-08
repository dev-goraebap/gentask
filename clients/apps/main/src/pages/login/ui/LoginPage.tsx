import { PageLayout, PageContent } from '@/shared/ui/page-layout';
import { login, requestLoginCode, sessionOptions } from '@/entities/session';
import { WIDTH } from '@/shared/config';
import { BrandMark } from '@/shared/ui/brand';
import { Button, Heading, Text, TextInput, VStack, HStack } from '@astryxdesign/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => Promise<unknown> }) {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState(0);
  const client = useQueryClient();
  useEffect(() => {
    if (!remaining) return;
    const timer = window.setTimeout(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);
  const send = useMutation({
    mutationFn: () => requestLoginCode(sentTo || email.trim()), meta: { login: true },
    onSuccess: () => { setSentTo(sentTo || email.trim()); setCode(''); setRemaining(60); },
  });
  const confirm = useMutation({
    mutationFn: () => login({ email: sentTo, code }), meta: { login: true },
    onSuccess: async () => {
      await client.cancelQueries(); client.clear();
      await client.fetchQuery(sessionOptions()); await onLoggedIn();
    },
  });
  const busy = send.isPending || confirm.isPending;
  const submit = () => { if (busy) return; if (sentTo ? code.trim() : email.trim()) (sentTo ? confirm : send).mutate(); };
  return <PageLayout height="fill" contentWidth={WIDTH.narrow} content={<PageContent padding={6}>
    <VStack as="form" gap={4} onSubmit={(event: React.FormEvent) => { event.preventDefault(); submit(); }}>
      <BrandMark size={64} />
      <Heading level={1}>로그인</Heading>
      <Text color="secondary">이메일 인증번호로 시작하세요. 처음이라면 계정이 자동으로 만들어집니다.</Text>
      {sentTo ? <>
        <Text>{sentTo}로 인증번호를 보냈습니다.</Text>
        <TextInput label="인증번호" value={code} onChange={setCode} isRequired isDisabled={busy} hasAutoFocus />
      </> : <TextInput label="이메일" type="email" value={email} onChange={setEmail} isRequired isDisabled={busy} hasAutoFocus />}
      {send.error || confirm.error ? <Text role="alert">{(send.error ?? confirm.error)?.message}</Text> : null}
      <Button label={sentTo ? '로그인' : '인증번호 받기'} variant="primary" isLoading={busy} isDisabled={busy || !(sentTo ? code.trim() : email.trim())} onClick={submit} />
      {sentTo ? <HStack gap={2} wrap="wrap">
        <Button label={remaining ? `${remaining}초 후 재전송` : '인증번호 다시 받기'} variant="ghost" isDisabled={busy || remaining > 0} onClick={() => { confirm.reset(); send.mutate(); }} />
        <Button label="이메일 변경" variant="ghost" isDisabled={busy} onClick={() => { setSentTo(''); setCode(''); send.reset(); confirm.reset(); }} />
      </HStack> : null}
    </VStack>
  </PageContent>} />;
}
