import { Selector } from '@astryxdesign/core';
import type { ComponentProps } from 'react';

export function PageSize({ value, onChange, isLabelHidden = false, placement }: {
  value: number; onChange: (value: number) => void; isLabelHidden?: boolean;
  placement?: ComponentProps<typeof Selector>['placement'];
}) {
  return <Selector label="페이지당 개수" isLabelHidden={isLabelHidden} placement={placement} value={String(value)} onChange={(v) => onChange(Number(v))}
    options={[25, 50, 100].map((v) => ({ value: String(v), label: `${v}개` }))} />;
}
