export function orderedProjectIds(available: readonly string[], saved: readonly string[]) {
  return [...new Set([...saved.filter(id => available.includes(id)), ...available])];
}

export function moveProjectId(available: readonly string[], saved: readonly string[], source: string, target: string) {
  const order = orderedProjectIds(available, saved);
  const from = order.indexOf(source), to = order.indexOf(target);
  if (from < 0 || to < 0 || from === to) return order;
  order.splice(to, 0, order.splice(from, 1)[0]);
  return order;
}
