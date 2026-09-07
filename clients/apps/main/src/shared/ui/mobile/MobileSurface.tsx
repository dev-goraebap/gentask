import { BottomSheet, Dialog, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { cloneElement, isValidElement, type ComponentProps, type ReactElement } from 'react';
import { MOBILE_QUERY } from './helpers';

export function MobileSurface({ title, presentation = 'sheet', ...props }: ComponentProps<typeof Dialog> & { title: string; presentation?: 'sheet' | 'fullscreen' }) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  if (mobile && presentation === 'sheet') return <BottomSheet isOpen={props.isOpen} onOpenChange={props.onOpenChange}
    label={title} purpose={props.purpose} height="capped">
    <VStack padding={4} style={{ paddingBottom: 'max(var(--spacing-4), env(safe-area-inset-bottom))' }}>
      {isValidElement(props.children) ? cloneElement(props.children as ReactElement<{ height: string }>, { height: 'auto' }) : props.children}
    </VStack>
  </BottomSheet>;
  return <Dialog {...props} variant={mobile ? 'fullscreen' : props.variant} style={mobile ? { ...props.style, paddingBottom: 'max(var(--spacing-4), env(safe-area-inset-bottom))' } : props.style} />;
}
