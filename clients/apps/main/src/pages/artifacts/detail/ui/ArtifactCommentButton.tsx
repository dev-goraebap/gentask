import { HgiComment } from '@/shared/ui/icons';
import { Button, Text, VStack } from '@astryxdesign/core';

export function ArtifactCommentButton({ label, count, onClick, onFocus, onBlur, onPointerEnter, isDisabled = false }: {
  label: string; count: number; onClick: () => void; onFocus?: () => void; onBlur?: () => void; onPointerEnter?: () => void; isDisabled?: boolean;
}) {
  return <Button label={label} tooltip={label} variant="ghost" size="sm" isDisabled={isDisabled}
    style={{ width: 'var(--spacing-10)', height: 'var(--spacing-10)', padding: 0, flexShrink: 0 }} onClick={onClick} onFocus={onFocus} onBlur={onBlur} onPointerEnter={onPointerEnter}>
    <VStack gap={0} align="center" style={{ color: 'var(--color-icon-accent)' }}><HgiComment size={20} />{count > 0 ? <Text type="supporting" style={{ lineHeight: 1, color: 'var(--color-text-accent)' }}>{count > 99 ? '99+' : count}</Text> : null}</VStack>
  </Button>;
}
