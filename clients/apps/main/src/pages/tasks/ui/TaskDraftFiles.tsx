import { Button, HStack, Text, VStack } from '@astryxdesign/core';
import { useEffect, useRef, useState } from 'react';
import { HgiAttachment } from '@/shared/ui/icons';
import { TaskFileItem } from './TaskFileItem';

export function TaskDraftFiles({ files, onChange, disabled }: { files: File[]; onChange: (files: File[]) => void; disabled: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  useEffect(() => {
    const next = files.map(file => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(next);
    return () => next.forEach(item => URL.revokeObjectURL(item.url));
  }, [files]);
  return <VStack className="task-attachments" gap={3}>
    <HStack align="center" justify="between"><Text type="supporting" color="secondary">첨부파일 · {files.length}</Text>
      <Button label="파일 첨부" icon={<HgiAttachment size={16} />} variant="ghost" size="sm" isDisabled={disabled || files.length >= 5} onClick={() => input.current?.click()} />
    </HStack>
    <input ref={input} type="file" multiple hidden disabled={disabled} aria-label="첨부할 파일 선택" onChange={event => {
      const next = [...files, ...Array.from(event.target.files ?? [])]; event.target.value = '';
      if (next.length > 5 || next.some(file => file.size > 10 * 1024 * 1024)) { setError('최대 5개, 파일당 10 MB 이하로 선택해 주세요.'); return; }
      setError(''); onChange(next);
    }} />
    <VStack gap={2} className="task-files-grid">{previews.map(({ file, url }, index) => <TaskFileItem key={url} file={{ id: url, fileName: file.name, contentType: file.type, size: file.size, url }} busy={disabled} onRemove={disabled ? undefined : () => onChange(files.filter((_, i) => i !== index))} />)}</VStack>
    <Text type="supporting" color="secondary">작업을 만들 때 업로드됩니다. 최대 5개 · 파일당 10 MB</Text>
    {error ? <Text role="alert">{error}</Text> : null}
  </VStack>;
}
