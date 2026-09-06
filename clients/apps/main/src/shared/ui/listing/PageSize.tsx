import { Selector } from '@astryxdesign/core';

export function PageSize({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <Selector label="페이지당 개수" value={String(value)} onChange={(v) => onChange(Number(v))}
    options={[25, 50, 100].map((v) => ({ value: String(v), label: `${v}개` }))} />;
}
