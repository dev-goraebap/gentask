export function projectItems<T extends { id: string }>(projectId: string, items: readonly T[], projects: readonly { id: string; prefix: string }[]): readonly T[] {
  const prefix = projects.find((p) => p.id === projectId)?.prefix;
  return items.filter((item) => item.id.startsWith(`${prefix}-`));
}
