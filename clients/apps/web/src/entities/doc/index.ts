export {
  buildCrumbs,
  docsIn,
  foldersIn,
  type Doc,
  type DocAttachment,
  type DocCrumb,
  type DocFolder,
  type DocLinkedIssue,
  type DocSummary,
} from './model/doc';

export { DocService, type DocDetail, type DocRevision, type DocRevisions } from './api/doc-service';

export { diffLines, type DiffLine, type DiffMark, type DiffResult } from './lib/diff-lines';
