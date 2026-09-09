export type ResourceScope = { projectId?: string; scope?: 'personal' };
export function parseResourceScope(search: Record<string, unknown>): ResourceScope {
  const projectId = typeof search.projectId === 'string' && search.projectId ? search.projectId : undefined;
  if (projectId) return { projectId };
  return search.scope === 'personal' ? { scope: 'personal' } : {};
}
export function resourceSearch(projectId: string | null, personal = false) {
  return projectId ? '?projectId=' + encodeURIComponent(projectId) : personal ? '?scope=personal' : '';
}
