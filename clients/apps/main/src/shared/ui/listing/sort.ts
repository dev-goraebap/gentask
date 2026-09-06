export type SortDirection = 'asc' | 'desc';
export interface SortValue { key: string; direction: SortDirection }
export interface SortOption { value: string; label: string; defaultDirection?: SortDirection; hasDirection?: boolean }
