import { Banner, Button, Dialog, Text } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface CreateDialogProps {
  readonly title: string;
  readonly description?: string;
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
  readonly actionLabel: string;
  readonly onSubmit: () => Promise<void>;
  readonly children: ReactNode;
}

/**
 * 무언가를 세우는 자리는 모달로 연다. 목록 위에 폼을 늘 띄워 두면 그만큼 목록이 밀리고,
 * 세우는 일이 목록을 보는 일보다 앞서 보인다.
 *
 * 좁은 화면에서는 전체를 덮는다. 320px 폭에 상자를 띄우면 가장자리만 남고 입력이 좁아진다.
 */
export function CreateDialog({
  title,
  description,
  isOpen,
  onOpenChange,
  actionLabel,
  onSubmit,
  children,
}: CreateDialogProps) {
  const isNarrow = useMediaQuery('(max-width: 767px)');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onSubmit();
      onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '세우지 못했습니다');
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
      variant={isNarrow ? 'fullscreen' : 'standard'}
      width={480}
      padding={6}
    >
      <form onSubmit={submit} className="create-dialog">
        <Text as="h2" type="large">
          {title}
        </Text>
        {description ? (
          <Text as="p" type="supporting" color="secondary">
            {description}
          </Text>
        ) : null}

        {children}

        {error ? <Banner status="error" title={error} /> : null}

        <div className="dialog-actions">
          <Button label="그만두기" variant="ghost" onClick={() => onOpenChange(false)} />
          <Button type="submit" label={actionLabel} variant="primary" isLoading={pending} />
        </div>
      </form>
    </Dialog>
  );
}
