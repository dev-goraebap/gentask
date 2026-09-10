import { lazy } from 'react';
export const EditorPlaygroundLazy = lazy(() => import('@/pages/editor-playground').then(module => ({ default: module.EditorPlaygroundPage })));
