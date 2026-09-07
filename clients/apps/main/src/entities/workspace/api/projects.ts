import { createdId, get, request } from '@/shared/api';
import { queryOptions } from '@tanstack/react-query';
import type { components } from 'api-types';

export const projectsOptions = () => queryOptions({
  queryKey: ['projects', 'list'],
  queryFn: ({ signal }) => get<components['schemas']['ProjectView'][]>('/projects', signal),
});
export async function createProject(input: components['schemas']['CreateProject']) {
  const result = await request('/projects', { method: 'POST', body: JSON.stringify(input) });
  return createdId(result.location);
}
export const editProject = (id: string, input: components['schemas']['EditProject']) =>
  request('/projects/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(input) });
