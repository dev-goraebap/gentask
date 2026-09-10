import { lazy } from 'react';

export const LazyNoteSimpleEditor=lazy(()=>import('./NoteSimpleEditor').then(module=>({default:module.NoteSimpleEditor})));
