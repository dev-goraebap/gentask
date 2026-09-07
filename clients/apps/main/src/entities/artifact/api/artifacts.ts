import { createdId, get, request } from '@/shared/api';
import { queryOptions } from '@tanstack/react-query';
import type { components } from 'api-types';

export type ArtifactView = components['schemas']['ArtifactView'];
const base = (projectId: string) => '/projects/' + encodeURIComponent(projectId);
export const artifactKeys = {
  all: (projectId: string) => ['artifacts', projectId] as const,
  list: (projectId: string) => ['artifacts', projectId, 'list'] as const,
  detail: (projectId: string, id: string) => ['artifacts', projectId, 'detail', id] as const,
  folders: (projectId: string) => ['artifact-folders', projectId] as const,
};
export const artifactsOptions = (projectId: string) => queryOptions({
  queryKey: artifactKeys.list(projectId),
  queryFn: ({ signal }) => get<components['schemas']['ArtifactSummary'][]>(base(projectId) + '/artifacts', signal),
});
export const artifactOptions = (projectId: string, id: string) => queryOptions({
  queryKey: artifactKeys.detail(projectId, id),
  queryFn: ({ signal }) => get<ArtifactView>(base(projectId) + '/artifacts/' + encodeURIComponent(id), signal),
});
export const foldersOptions = (projectId: string) => queryOptions({
  queryKey: artifactKeys.folders(projectId),
  queryFn: ({ signal }) => get<components['schemas']['ArtifactFolderSummary'][]>(base(projectId) + '/artifact-folders', signal),
});
export async function createArtifact(projectId: string, input: components['schemas']['CreateArtifact']) {
  const result = await request(base(projectId) + '/artifacts', { method: 'POST', body: JSON.stringify(input) });
  return createdId(result.location);
}
export const editArtifact = (projectId: string, id: string, input: components['schemas']['EditArtifact']) =>
  request(base(projectId) + '/artifacts/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(input) });
export async function createFolder(projectId: string, input: components['schemas']['CreateFolder']) {
  const result = await request(base(projectId) + '/artifact-folders', { method: 'POST', body: JSON.stringify(input) });
  return createdId(result.location);
}
