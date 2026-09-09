import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextInput, VStack } from '@astryxdesign/core';
import { sessionOptions, useSession } from '@/entities/session';
import { request } from '@/shared/api';
import type { components } from 'api-types';
import { McpSetupGuide } from './McpSetupGuide';
import { SettingsGroup } from './SettingsGroup';
import { SettingsRow } from './SettingsRow';
import { HgiSettings, HgiFile, HgiBook } from '@/shared/ui/icons';

export function ApiTokenSettings() {
  const { data: me } = useSession();
  const client = useQueryClient();
  const [token, setToken] = useState('');
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const issued = Boolean(me?.apiTokenIssuedAt);
  const serverUrl = import.meta.env.DEV ? 'http://localhost:8080/api/mcp' : `${window.location.origin}/api/mcp`;
  const action = useMutation({
    mutationFn: async (mode: 'issue' | 'revoke') => {
      setMessage('');
      if (mode === 'issue') {
        const { data } = await request<components['schemas']['IssuedApiToken']>('/me/api-token', { method: 'POST' });
        setToken(data.token);
        setVisible(false);
        client.setQueryData(sessionOptions().queryKey, current => current ? { ...current, apiTokenIssuedAt: data.issuedAt } : current);
      } else {
        await request('/me/api-token', { method: 'DELETE' });
        setToken('');
        client.setQueryData(sessionOptions().queryKey, current => current ? { ...current, apiTokenIssuedAt: null } : current);
        setMessage('토큰을 폐기했습니다.');
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: sessionOptions().queryKey }),
  });
  const copy = async () => {
    try { await navigator.clipboard.writeText(token); setMessage('토큰을 복사했습니다.'); }
    catch { setVisible(true); setMessage('복사하지 못했습니다. 토큰을 직접 선택해 복사해주세요.'); }
  };
  return <VStack gap={5}>
    <SettingsGroup title="MCP 연결">
      <SettingsRow title="API 토큰" icon={<HgiSettings />}
        description={me?.apiTokenIssuedAt ? '발급일 · ' + new Date(me.apiTokenIssuedAt).toLocaleString('ko-KR') : '에이전트가 내 계정으로 Gentask를 사용하도록 토큰을 발급합니다.'}
        control={<>
          <Button label={issued ? '토큰 재발급' : '토큰 발급'} variant="primary" size="sm" isDisabled={!me || action.isPending}
            onClick={() => { if (!issued || window.confirm('재발급하면 기존 토큰을 사용하는 모든 MCP 연결이 중단됩니다. 재발급할까요?')) action.mutate('issue'); }} />
          {issued ? <Button label="토큰 폐기" variant="secondary" size="sm" isDisabled={action.isPending}
            onClick={() => { if (window.confirm('이 토큰을 사용하는 모든 MCP 연결이 중단됩니다. 폐기할까요?')) action.mutate('revoke'); }} /> : null}
        </>}>
        {message ? <Text role="status" type="supporting">{message}</Text> : null}
        {action.error ? <Text role="alert">{action.error.message}</Text> : null}
      </SettingsRow>
      {token ? <SettingsRow title="발급한 토큰" description="화면을 떠나면 다시 볼 수 없습니다. 지금 복사해 보관해주세요." icon={<HgiFile />}
        control={<><Button label="토큰 복사" variant="secondary" size="sm" onClick={() => void copy()} />
          <Button label={visible ? '토큰 숨기기' : '토큰 보기'} variant="secondary" size="sm" onClick={() => setVisible(value => !value)} /></>}>
        <TextInput label="API 토큰" isLabelHidden type={visible ? 'text' : 'password'} value={token} isReadOnly width="100%" />
      </SettingsRow> : null}
      <SettingsRow title="서버 주소" description="Streamable HTTP 방식으로 연결합니다." icon={<HgiBook />}
        control={<TextInput label="MCP 서버 주소" isLabelHidden value={serverUrl} isReadOnly size="sm" width="100%" />} />
    </SettingsGroup>
    <McpSetupGuide url={serverUrl} />
  </VStack>;
}
