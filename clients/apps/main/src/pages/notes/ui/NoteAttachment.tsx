import { Button, Text, Thumbnail, VStack } from '@astryxdesign/core';
import { HgiCancel, HgiFile } from '@/shared/ui/icons';
import { useEffect, useState } from 'react';

export function NoteAttachment({ name, type, size, file, url, onRemove, busy = false, removeLabel = '첨부 취소' }: {
  name: string; type: string; size: number; file?: File; url?: string;
  onRemove?: () => void; busy?: boolean; removeLabel?: string;
}) {
  const [preview, setPreview] = useState<string>();
  const image = /^image\/(png|jpeg|webp|gif|avif|bmp|svg\+xml)$/.test(type);
  useEffect(() => {
    if (!file || !image) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, image]);
  const extension = name.includes('.') ? name.split('.').at(-1)?.slice(0, 8).toUpperCase() : 'FILE';
  const sizeLabel = size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.ceil(size / 1024))} KB`;
  const fileIcon = <VStack align="center" gap={1}><HgiFile size={30} /><Text type="supporting">{extension}</Text></VStack>;
  return <VStack gap={0.5} className="note-attachment" role="group" aria-label={name}>
    <div className="note-attachment-preview">
      {image ? <Thumbnail src={preview ?? url} alt={name} label={name} style={{ width: '100%' }}
        onClick={url ? () => window.open(url, '_blank', 'noopener,noreferrer') : undefined} /> :
        url ? <Button label={`${name} 다운로드`} href={url} target="_blank"
          variant="ghost" className="note-attachment-file">{fileIcon}</Button> : <div className="note-attachment-file">{fileIcon}</div>}
      {onRemove ? <Button label={`${name} ${removeLabel}`} icon={<HgiCancel size={14} />} isIconOnly size="sm"
        variant="secondary" className="note-attachment-remove" isDisabled={busy} onClick={onRemove} /> : null}
    </div>
    <div title={name}><Text type="supporting" maxLines={1}>{name}</Text></div>
    <Text type="supporting" color="secondary">{busy ? '처리 중…' : sizeLabel}</Text>
  </VStack>;
}
