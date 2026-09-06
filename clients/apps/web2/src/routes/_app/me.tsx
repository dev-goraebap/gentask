import {
  Avatar,
  Banner,
  Button,
  Card,
  FileInput,
  FormLayout,
  Text,
  TextInput,
} from '@astryxdesign/core';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { clearSession } from '@/entities/session';
import {
  api,
  type IssuedApiToken,
  type MeView,
  type PresignedUpload,
} from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { PushToggle } from '@/shared/ui/push-toggle';

export const Route = createFileRoute('/_app/me')({
  loader: () => api.get<MeView>(ENDPOINTS.me),
  component: AccountPage,
});

function AccountPage() {
  const router = useRouter();
  const me = Route.useLoaderData();
  const [nickname, setNickname] = useState(me.nickname);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [issued, setIssued] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const run = async (task: () => Promise<void>, done: string) => {
    setNotice(null);
    try {
      await task();
      setNotice({ kind: 'success', text: done });
    } catch (cause) {
      setNotice({ kind: 'error', text: cause instanceof Error ? cause.message : '요청이 실패했습니다' });
    }
  };

  const rename = (event: React.FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await api.patch(ENDPOINTS.me, { nickname });
      clearSession();
      await router.invalidate();
    }, '별명을 바꿨습니다');
  };

  const changePassword = (event: React.FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await api.patch(ENDPOINTS.password, { currentPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
    }, '비밀번호를 바꿨습니다');
  };

  /*
   * 프로필 이미지는 서버를 거치지 않고 보관소로 바로 올린다. 서버는 올릴 자리를 발급하고,
   * 올린 뒤에 그 키를 확인받는다. 파일이 서버 메모리를 지나지 않는다.
   */
  const uploadImage = (file: File) =>
    void run(async () => {
      const slot = await api.post<PresignedUpload>(ENDPOINTS.attachmentPresign, {
        slot: 'USER_PROFILE_IMAGE',
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      });
      const put = await fetch(slot.url, {
        method: 'PUT',
        body: file,
        headers: { 'content-type': file.type },
      });
      if (!put.ok) throw new Error('보관소에 올리지 못했습니다');
      await api.post(ENDPOINTS.profileImage, { objectKey: slot.objectKey });
      clearSession();
      await router.invalidate();
    }, '프로필 이미지를 바꿨습니다');

  const issueToken = () =>
    void run(async () => {
      const token = await api.post<IssuedApiToken>(ENDPOINTS.apiToken);
      setIssued(token.token);
      await router.invalidate();
    }, '토큰을 발급했습니다');

  return (
    <section className="page">
      <Text as="h1" type="display-3">
        계정
      </Text>

      {notice ? <Banner status={notice.kind} title={notice.text} /> : null}

      <Card padding={4}>
        <div className="row-head">
          <Avatar name={me.nickname} src={me.profileImageUrl ?? undefined} />
          <div>
            <Text as="p" type="large">
              {me.nickname}
            </Text>
            <Text as="p" type="supporting" color="secondary">
              {me.email} · {me.role === 'ADMIN' ? '관리자' : '사용자'}
            </Text>
          </div>
        </div>
        <form onSubmit={rename} className="inline-form">
          <TextInput label="별명" isLabelHidden value={nickname} onChange={setNickname} />
          <Button type="submit" label="별명 바꾸기" variant="secondary" />
        </form>

        <FileInput
          label="프로필 이미지"
          accept="image/*"
          value={[]}
          onChange={(files) => {
            // 한 장만 받는다. 배열로 오는 경우와 하나로 오는 경우를 모두 받는다.
            const file = Array.isArray(files) ? files[0] : files;
            if (file instanceof File) uploadImage(file);
          }}
        />
      </Card>

      <Card padding={4}>
        <Text as="h2" type="large">
          비밀번호
        </Text>
        <form onSubmit={changePassword} className="auth-form">
          <FormLayout>
            <TextInput
              label="현재 비밀번호"
              type="password"
              value={current}
              onChange={setCurrent}
              isRequired
            />
            <TextInput
              label="새 비밀번호"
              type="password"
              value={next}
              onChange={setNext}
              isRequired
            />
          </FormLayout>
          <Button type="submit" label="비밀번호 바꾸기" variant="secondary" />
        </form>
      </Card>

      <Card padding={4}>
        <Text as="h2" type="large">
          알림
        </Text>
        <PushToggle />
      </Card>

      <Card padding={4}>
        <Text as="h2" type="large">
          에이전트 토큰
        </Text>
        <Text as="p" type="supporting" color="secondary">
          {me.apiTokenIssuedAt
            ? `${me.apiTokenIssuedAt.slice(0, 10)} 에 발급했습니다. 다시 발급하면 이전 토큰은 쓸 수 없습니다.`
            : '아직 발급하지 않았습니다.'}
        </Text>
        <Button label="토큰 발급" variant="primary" onClick={issueToken} />
        {issued ? (
          <>
            <Text as="p" type="supporting" color="accent">
              이 값은 지금 한 번만 보입니다.
            </Text>
            <code className="token">{issued}</code>
            <Text as="p" type="supporting" color="secondary">
              CLI 에서 gentask auth login 을 실행해 표준입력으로 넣습니다.
            </Text>
          </>
        ) : null}
      </Card>
    </section>
  );
}
