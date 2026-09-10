import { taskFilesOptions, uploadTaskFile, removeTaskFile } from '../api/tasks';
import { useQuery } from '@tanstack/react-query';
import { Button, Text, VStack, HStack } from '@astryxdesign/core';
import { useRef, useState } from 'react';
import { HgiAttachment } from '@/shared/ui/icons';
import { useTaskAction } from '../model/useTaskAction';
import { RequestState } from '@/shared/ui/request-state';
import { TaskFileItem } from './TaskFileItem';

export function TaskFiles({ taskId, writable }: { taskId: string; writable: boolean }) {
  const query = useQuery(taskFilesOptions(taskId));
  const action = useTaskAction();
  const input = useRef<HTMLInputElement>(null);
  const [validation, setValidation] = useState('');
  const [uploading, setUploading] = useState('');
  const upload = (files: File[]) => {
    if (!files.length || action.isPending || !query.data) return;
    if (files.length + query.data.length > 5) { setValidation('첨부파일은 최대 5개까지 추가할 수 있습니다.'); return; }
    if (files.some(file => file.size > 10 * 1024 * 1024)) { setValidation('파일당 10 MB 이하로 선택해 주세요.'); return; }
    setValidation('');
    action.mutate(async () => {
      try {
        for (const file of files) {
          setUploading(file.name);
          await uploadTaskFile(taskId, file);
        }
      } finally {
        setUploading('');
        await query.refetch();
      }
    });
  };
  return <VStack gap={3} className="task-attachments">
    <HStack justify="between" align="center" gap={2}>
      <Text type="supporting" weight="medium" color="secondary">첨부파일{query.data?.length ? ` · ${query.data.length}` : ''}</Text>
      {writable ? <Button label="파일 첨부" icon={<HgiAttachment size={16} />} variant="ghost" size="sm" isLoading={!!uploading} isDisabled={action.isPending || !query.data || query.data.length >= 5} onClick={() => input.current?.click()} /> : null}
    </HStack>
    <input ref={input} type="file" multiple hidden aria-label="첨부할 파일 선택" disabled={!writable || action.isPending} onChange={event => { upload(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
    {query.isPending || query.error ? <RequestState error={query.error} retry={() => void query.refetch()} /> :
      <VStack gap={2} className="task-files-grid">{query.data.map(file => <TaskFileItem key={file.id} file={file} busy={action.isPending}
        onRemove={writable ? () => { if (window.confirm(`${file.fileName} 파일을 삭제할까요?`)) action.mutate(() => removeTaskFile(taskId, file.id)); } : undefined} />)}</VStack>}
    {uploading ? <Text role="status" type="supporting" color="secondary">{uploading} 업로드 중…</Text> : null}
    {query.data?.length === 0 && !uploading ? <Text type="supporting" color="secondary">참고할 이미지나 파일을 첨부하세요.</Text> : null}
    {writable ? <Text type="supporting" color="secondary">최대 5개 · 파일당 10 MB</Text> : null}
    {validation || action.error ? <Text role="alert" type="supporting">{validation || action.error?.message}</Text> : null}
  </VStack>;
}
