import { lazy } from 'react';
export const LazyDocumentEditor = lazy(() => import('@/shared/ui/document-editor').then(module => ({ default: module.DocumentEditor })));
