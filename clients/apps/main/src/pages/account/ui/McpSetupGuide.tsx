import { useState } from 'react';
import { Button, HStack, Selector, Text, TextArea } from '@astryxdesign/core';
import { mcpSetup } from '../model/mcpSetup';
import { SettingsGroup } from './SettingsGroup';
import { SettingsRow } from './SettingsRow';
import { HgiSettings, HgiComment, HgiFile } from '@/shared/ui/icons';

export function McpSetupGuide({ url }: { url: string }) {
  const [client, setClient] = useState<'codex' | 'claude'>('codex');
  const [message, setMessage] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const setup = mcpSetup(client, url);
  const copy = async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); setMessage(`${label}를 복사했습니다.`); }
    catch { setShowPrompt(true); setMessage('복사하지 못했습니다. 아래 내용을 직접 선택해 복사해주세요.'); }
  };
  return <SettingsGroup title="에이전트 설정">
    <SettingsRow title="사용할 에이전트" description="모든 프로젝트에서 사용할 수 있는 전역 설정을 안내합니다." icon={<HgiSettings />}
      control={<Selector label="사용할 에이전트" isLabelHidden size="sm" width="100%" value={client} options={[{ value: 'codex', label: 'Codex' }, { value: 'claude', label: 'Claude Code' }]}
        onChange={value => { setClient(value as 'codex' | 'claude'); setMessage(''); }} />} />
    <SettingsRow title="에이전트에게 설정 맡기기" description="프롬프트를 전달하면 환경 설정부터 연결 확인까지 안내합니다. 실제 토큰은 포함되지 않습니다." icon={<HgiComment />}
      control={<HStack gap={1} width="100%" className="account-settings-actions">
        <Button label="에이전트용 설정 프롬프트 복사" aria-label="에이전트용 설정 프롬프트 복사" variant="secondary" size="sm" onClick={() => void copy(setup.prompt, '설정 프롬프트')}>프롬프트 복사</Button>
        <Button label={showPrompt ? '프롬프트 접기' : '프롬프트 내용 보기'} aria-label={showPrompt ? '프롬프트 접기' : '프롬프트 내용 보기'} variant="secondary" size="sm" onClick={() => setShowPrompt(value => !value)}>{showPrompt ? '접기' : '내용 보기'}</Button>
      </HStack>}>
      {showPrompt ? <TextArea label="설정 프롬프트" isLabelHidden value={setup.prompt} isReadOnly rows={10} /> : null}
      {message ? <Text role="status" type="supporting">{message}</Text> : null}
    </SettingsRow>
    <SettingsRow title="직접 연결하기" description={'토큰을 ' + setup.variable + ' 환경변수에 저장한 뒤 등록 명령을 실행하세요.'} icon={<HgiFile />}
      control={<HStack gap={1} width="100%" className="account-settings-actions">
        <Button label="등록 명령 복사" aria-label="등록 명령 복사" variant="secondary" size="sm" onClick={() => void copy(setup.command, '등록 명령')}>명령 복사</Button>
        <Button label="공식 문서" variant="secondary" size="sm" href={client === 'codex' ? 'https://developers.openai.com/codex/mcp/' : 'https://code.claude.com/docs/en/mcp'} target="_blank" />
      </HStack>}>
      <TextArea label="전역 등록 명령 · PowerShell / Bash" value={setup.command} isReadOnly rows={3} />
      <Text type="supporting" color="secondary">데스크톱 앱과 IDE에서도 환경변수를 읽을 수 있어야 합니다. 설정 후 앱을 다시 실행해주세요.</Text>
    </SettingsRow>
  </SettingsGroup>;
}
