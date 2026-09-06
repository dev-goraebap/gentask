import { createContext, useContext } from 'react';
import { type ItemState, type WorkItem } from './data';

export interface IssueStore {
  readonly items: readonly WorkItem[];
  readonly addItem: (prefix: string, title: string, body: string) => void;
  readonly toggleCriterion: (itemId: string, n: number) => void;
  readonly changeItemState: (itemId: string, state: ItemState) => void;
  readonly removeProjectItems: (prefix: string) => void;
}

export const Context = createContext<IssueStore | null>(null);

export function useIssueStore(): IssueStore {
  const value = useContext(Context);
  if (!value) throw new Error('IssueProvider 안에서만 사용합니다.');
  return value;
}
