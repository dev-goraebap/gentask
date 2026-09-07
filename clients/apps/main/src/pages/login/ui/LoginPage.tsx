import { login, sessionOptions } from '@/entities/session';
import { WIDTH } from '@/shared/config';
import { Button, Heading, Layout, LayoutContent, Text, TextInput, VStack } from '@astryxdesign/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => Promise<unknown> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => login({ email: email.trim(), password }),
    meta: { login: true },
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
      await client.fetchQuery(sessionOptions());
      await onLoggedIn();
    },
  });
  const submit = () => { if (!mutation.isPending && email.trim() && password) mutation.mutate(); };
  return <Layout height="fill" contentWidth={WIDTH.narrow} content={<LayoutContent padding={6}>
    <VStack as="form" gap={4} onSubmit={(event: React.FormEvent) => { event.preventDefault(); submit(); }}>
      <Heading level={1}>Gentask 로그인</Heading>
      <Text color="secondary">계정으로 로그인해 프로젝트를 확인하세요.</Text>
      <TextInput label="이메일" type="email" value={email} onChange={setEmail} isRequired hasAutoFocus />
      <TextInput label="비밀번호" type="password" value={password} onChange={setPassword} isRequired onEnter={submit} />
      {mutation.error ? <Text role="alert">{mutation.error.message}</Text> : null}
      <Button label="로그인" variant="primary" isLoading={mutation.isPending} isDisabled={!email.trim() || !password || mutation.isPending} onClick={submit} />
    </VStack>
  </LayoutContent>} />;
}
