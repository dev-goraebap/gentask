import { createdId, get, request } from '@/shared/api';
import { queryOptions } from '@tanstack/react-query';
import type { components } from 'api-types';

export type ArtifactView = components['schemas']['ArtifactView'];
export type ArtifactCommentView = components['schemas']['ArtifactCommentView'];
const base = (projectId: string | null) => projectId === null ? '/me' : '/projects/' + encodeURIComponent(projectId);
export const artifactKeys = {
  all: (projectId: string | null) => ['artifacts', projectId] as const,
  list: (projectId: string | null) => ['artifacts', projectId, 'list'] as const,
  detail: (projectId: string | null, id: string) => ['artifacts', projectId, 'detail', id] as const,
  folders: (projectId: string | null) => ['artifact-folders', projectId] as const,
};
export const artifactsOptions = (projectId: string | null) => queryOptions({
  queryKey: artifactKeys.list(projectId),
  queryFn: ({ signal }) => get<components['schemas']['ArtifactSummary'][]>(base(projectId) + '/artifacts', signal),
});
export const artifactOptions = (projectId: string | null, id: string) => queryOptions({
  queryKey: artifactKeys.detail(projectId, id),
  queryFn: ({ signal }) => get<ArtifactView>(base(projectId) + '/artifacts/' + encodeURIComponent(id), signal),
});
export const foldersOptions = (projectId: string | null) => queryOptions({
  queryKey: artifactKeys.folders(projectId),
  queryFn: ({ signal }) => get<components['schemas']['ArtifactFolderSummary'][]>(base(projectId) + '/artifact-folders', signal),
});
export async function createArtifact(projectId: string | null, input: components['schemas']['CreateArtifact']) {
  const result = await request(base(projectId) + '/artifacts', { method: 'POST', body: JSON.stringify(input) });
  return createdId(result.location);
}
export const editArtifact = (projectId: string | null, id: string, input: components['schemas']['EditArtifact']) =>
  request(base(projectId) + '/artifacts/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(input) });
export async function createFolder(projectId: string | null, input: components['schemas']['CreateFolder']) {
  const result = await request(base(projectId) + '/artifact-folders', { method: 'POST', body: JSON.stringify(input) });
  return createdId(result.location);
}

export const versionsOptions = (projectId: string | null, artifactId: string, page = 0) => queryOptions({
  queryKey: [...artifactKeys.all(projectId), 'history', artifactId, page],
  queryFn: ({ signal }) => get<components['schemas']['VersionPageView']>(base(projectId) + '/artifacts/' + encodeURIComponent(artifactId) + '/versions?page=' + page + '&size=20', signal),
});
export const versionOptions = (projectId: string | null, artifactId: string, versionNo: number) => queryOptions({
  queryKey: [...artifactKeys.all(projectId), 'version', artifactId, versionNo],
  queryFn: ({ signal }) => get<components['schemas']['VersionView']>(base(projectId) + '/artifacts/' + encodeURIComponent(artifactId) + '/versions/' + versionNo, signal),
});

export const commentsOptions = (projectId: string | null, artifactId: string, versionNo: number) => queryOptions({
  queryKey: [...artifactKeys.all(projectId), 'comments', artifactId, versionNo],
  queryFn: ({ signal }) => get<ArtifactCommentView[]>(base(projectId) + '/artifacts/' + encodeURIComponent(artifactId) + '/versions/' + versionNo + '/comments', signal),
});
export const createArtifactComment = (projectId: string | null, artifactId: string, versionNo: number, input: components['schemas']['CreateArtifactComment']) =>
  request(base(projectId) + '/artifacts/' + encodeURIComponent(artifactId) + '/versions/' + versionNo + '/comments', { method: 'POST', body: JSON.stringify(input) });

export const deleteArtifactComment = (projectId: string | null, artifactId: string, versionNo: number, commentId: string) =>
  request(base(projectId) + '/artifacts/' + encodeURIComponent(artifactId) + '/versions/' + versionNo + '/comments/' + encodeURIComponent(commentId), { method: 'DELETE' });
