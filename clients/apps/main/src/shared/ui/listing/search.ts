export interface ListingSearch {
  q: string;
  sort: string;
  direction: 'asc' | 'desc';
  page: number;
  size: number;
}

export function parseListingSearch(search: Record<string, unknown>, sorts: readonly string[], defaultSort: string): ListingSearch {
  const page = Number(search.page);
  const size = Number(search.size);
  return {
    q: typeof search.q === 'string' ? search.q : '',
    sort: typeof search.sort === 'string' && sorts.includes(search.sort) ? search.sort : defaultSort,
    direction: search.direction === 'desc' ? 'desc' : 'asc',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    size: [10, 25, 50, 100].includes(size) ? size : 25,
  };
}
