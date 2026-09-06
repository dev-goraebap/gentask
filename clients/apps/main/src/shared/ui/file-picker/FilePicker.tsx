import { Text, VStack } from '@astryxdesign/core';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import koKR from '@uppy/locales/lib/ko_KR';
import { useEffect, useRef } from 'react';

export function FilePicker({ label, value, onChange, accept, multiple = false, disabled = false }: {
  label: string; value: File[]; onChange: (files: File[]) => void; accept?: string; multiple?: boolean; disabled?: boolean;
}) {
  const target = useRef<HTMLDivElement>(null);
  const instance = useRef<Uppy | null>(null);
  const syncing = useRef(false);
  const change = useRef(onChange);
  useEffect(() => { change.current = onChange; }, [onChange]);
  useEffect(() => {
    if (!target.current || disabled) return;
    const uppy = new Uppy({ locale: koKR, autoProceed: false, restrictions: { maxNumberOfFiles: multiple ? null : 1, allowedFileTypes: accept ? accept.split(',') : null } });
    instance.current = uppy;
    uppy.use(Dashboard, { target: target.current, inline: true, width: '100%', height: multiple ? '17.5rem' : '12.5rem', theme: document.body.getAttribute('data-astryx-media') === 'dark' ? 'dark' : 'light', hideUploadButton: true, proudlyDisplayPoweredByUppy: false, hideProgressDetails: true, note: multiple ? '파일을 끌어놓거나 선택하세요.' : '이미지 한 장을 선택하세요.' });
    const notify = () => { if (!syncing.current) change.current(uppy.getFiles().flatMap(file => file.data instanceof File ? [file.data] : [])); };
    uppy.on('files-added', notify);
    uppy.on('file-removed', notify);
    return () => { uppy.off('files-added', notify); uppy.off('file-removed', notify); instance.current = null; uppy.destroy(); };
  }, [accept, multiple, disabled]);
  useEffect(() => {
    const uppy = instance.current;
    if (!uppy) return;
    syncing.current = true;
    try {
      for (const file of uppy.getFiles()) if (!value.includes(file.data as File)) uppy.removeFile(file.id);
      for (const file of value) if (!uppy.getFiles().some(item => item.data === file)) uppy.addFile({ name: file.name, type: file.type, data: file });
    } finally { syncing.current = false; }
  }, [value, accept, multiple, disabled]);
  return <VStack gap={2} role="group" aria-label={label}><Text weight="medium">{label}</Text>{disabled ? <Text color="secondary">이미지를 변경할 권한이 없습니다.</Text> : <VStack ref={target} className="file-picker" />}</VStack>;
}
