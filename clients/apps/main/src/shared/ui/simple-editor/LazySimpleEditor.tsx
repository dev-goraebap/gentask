import { lazy } from 'react';

export const LazySimpleEditor=lazy(()=>import('./SimpleEditor').then(module=>({default:module.SimpleEditor})));
