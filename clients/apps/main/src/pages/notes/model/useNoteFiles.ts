import Uppy from '@uppy/core';
import koKR from '@uppy/locales/lib/ko_KR';
import { useEffect, useRef, useState } from 'react';

export function useNoteFiles() {
  const uppy = useRef<Uppy | null>(null);
  const [files, setFiles] = useState<{ id: string; file: File }[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const queue = new Uppy({ locale: koKR, autoProceed: false,
      restrictions: { maxNumberOfFiles: 5, maxFileSize: 10 * 1024 * 1024, minFileSize: 1 } });
    uppy.current = queue;
    const sync = () => setFiles(queue.getFiles().flatMap(file => file.data instanceof File ? [{ id: file.id, file: file.data }] : []));
    queue.on('files-added', sync);
    queue.on('file-removed', sync);
    queue.on('restriction-failed', (_file, failure) => setError(failure.message));
    return () => { uppy.current = null; queue.destroy(); };
  }, []);
  const add = (incoming: File[]) => {
    setError('');
    try { uppy.current?.addFiles(incoming.map(file => ({ name: file.name, type: file.type, data: file }))); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '파일을 추가하지 못했습니다.'); }
  };
  const remove = (id: string) => { uppy.current?.removeFile(id); setError(''); };
  const clear = () => { uppy.current?.clear(); setFiles([]); setError(''); };
  return { files, error, add, remove, clear };
}
