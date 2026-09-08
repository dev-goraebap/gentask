import { lazy } from 'react';
export const LazyRichEditor = lazy(() => import('./RichEditor').then(module => ({ default: module.RichEditor })));
