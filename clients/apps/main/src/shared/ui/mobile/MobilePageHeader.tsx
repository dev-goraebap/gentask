import { PageHeader } from '@/shared/ui/page-layout';
import type { ReactNode } from 'react';

export function MobilePageHeader({ title, onBack, backLabel = '목록으로', actions }: {
  title: string; onBack?: () => void; backLabel?: string; actions?: ReactNode;
}) {
  return <PageHeader title={title} onBack={onBack} backLabel={backLabel} actions={actions} compact />;
}
