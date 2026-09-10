import { Suspense } from 'react';
import { EditorPlaygroundLazy } from './EditorPlaygroundLazy';

export function EditorPlaygroundRoute() {
  return <Suspense fallback={<div role="status" style={{ padding: 32 }}>편집기를 준비하고 있습니다…</div>}><EditorPlaygroundLazy /></Suspense>;
}
