import { resourceSearch } from '@/shared/config';
import { createdId, get, request } from '@/shared/api';
import { queryOptions } from '@tanstack/react-query';
import type { components } from 'api-types';

export type ArtifactView = components['schemas']['ArtifactView'];
export type ArtifactCommentView = components['schemas']['ArtifactCommentView'];

export const artifactKeys = {
  all: (projectId: string | null) => ['artifacts', projectId] as const,
  list: (projectId: string | null) => ['artifacts', projectId, 'list'] as const,
  detail: (projectId: string | null, id: string) => ['artifacts', 'detail', id] as const,
  folders: (projectId: string | null) => ['artifact-folders', projectId] as const,
};
export const artifactsOptions = (projectId: string | null, personal = true) => queryOptions({
  queryKey: [...artifactKeys.list(projectId), personal],
  queryFn: ({ signal }) => get<components['schemas']['ArtifactSummary'][]>('/artifacts' + resourceSearch(projectId, personal), signal),
});
export const artifactOptions = (projectId: string | null, id: string) => queryOptions({
  queryKey: artifactKeys.detail(projectId, id),
  queryFn: ({ signal }) => get<ArtifactView>('/artifacts/' + encodeURIComponent(id), signal),
});
export const foldersOptions = (projectId: string | null, personal = true) => queryOptions({
  queryKey: [...artifactKeys.folders(projectId), personal],
  queryFn: ({ signal }) => get<components['schemas']['ArtifactFolderSummary'][]>('/artifact-folders' + resourceSearch(projectId, personal), signal),
});
export async function createArtifact(projectId: string | null, input: components['schemas']['CreateArtifact']) {
  const result = await request('/artifacts', { method: 'POST', body: JSON.stringify({ ...input, projectId }) });
  return createdId(result.location);
}
export const editArtifact = (projectId: string | null, id: string, input: components['schemas']['EditArtifact']) =>
  request('/artifacts/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(input) });
export async function createFolder(projectId: string | null, input: components['schemas']['CreateFolder']) {
  const result = await request('/artifact-folders', { method: 'POST', body: JSON.stringify({ ...input, projectId }) });
  return createdId(result.location);
}

export const versionsOptions = (projectId: string | null, artifactId: string, page = 0) => queryOptions({
  queryKey: [...artifactKeys.all(projectId), 'history', artifactId, page],
  queryFn: ({ signal }) => get<components['schemas']['VersionPageView']>('/artifacts/' + encodeURIComponent(artifactId) + '/versions?page=' + page + '&size=20', signal),
});
export const versionOptions = (projectId: string | null, artifactId: string, versionNo: number) => queryOptions({
  queryKey: [...artifactKeys.all(projectId), 'version', artifactId, versionNo],
  queryFn: ({ signal }) => get<components['schemas']['VersionView']>('/artifacts/' + encodeURIComponent(artifactId) + '/versions/' + versionNo, signal),
});

export const commentsOptions = (projectId: string | null, artifactId: string, versionNo: number) => queryOptions({
  queryKey: [...artifactKeys.all(projectId), 'comments', artifactId, versionNo],
  queryFn: ({ signal }) => get<ArtifactCommentView[]>('/artifacts/' + encodeURIComponent(artifactId) + '/versions/' + versionNo + '/comments', signal),
});
export const createArtifactComment = (projectId: string | null, artifactId: string, versionNo: number, input: components['schemas']['CreateArtifactComment']) =>
  request('/artifacts/' + encodeURIComponent(artifactId) + '/versions/' + versionNo + '/comments', { method: 'POST', body: JSON.stringify({ ...input, projectId }) });

export const deleteArtifactComment = (projectId: string | null, artifactId: string, versionNo: number, commentId: string) =>
  request('/artifacts/' + encodeURIComponent(artifactId) + '/versions/' + versionNo + '/comments/' + encodeURIComponent(commentId), { method: 'DELETE' });
