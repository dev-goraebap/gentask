import { Button, HStack, Text, Thumbnail, VStack } from '@astryxdesign/core';
import { HgiFile, HgiTrash } from '@/shared/ui/icons';
import type { TaskFile } from '../api/tasks';

export function TaskFileItem({ file, onRemove, busy }: { file: Pick<TaskFile, 'id' | 'fileName' | 'size' | 'url' | 'contentType' | 'dominantColor'>; onRemove?: () => void; busy: boolean }) {
  const image = file.contentType.startsWith('image/');
  const size = file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.ceil(file.size / 1024))} KB`;
  return <HStack gap={3} align="center" className="task-file-item">
    <a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={`${file.fileName} 열기`} className="task-file-preview" style={image && file.dominantColor ? {backgroundColor:file.dominantColor} : undefined}>
      {image ? <Thumbnail src={file.url} alt={file.fileName} label={file.fileName} /> : <HgiFile size={24} />}
    </a>
    <VStack gap={0.5} style={{ flex: 1, minWidth: 0 }}>
      <a href={file.url} target="_blank" rel="noopener noreferrer" title={file.fileName} className="task-file-name">{file.fileName}</a>
      <Text type="supporting" color="secondary">{size}</Text>
    </VStack>
    {onRemove ? <Button label={`${file.fileName} 삭제`} icon={<HgiTrash size={16} />} isIconOnly variant="ghost" size="sm" className="task-file-remove" isDisabled={busy} onClick={onRemove} /> : null}
  </HStack>;
}
