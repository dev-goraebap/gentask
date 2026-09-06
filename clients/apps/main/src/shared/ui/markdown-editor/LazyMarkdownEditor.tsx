import { lazy } from 'react';
export const LazyMarkdownEditor = lazy(() => import('./MarkdownEditor').then(module => ({default:module.MarkdownEditor})));
