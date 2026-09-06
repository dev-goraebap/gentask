import { StatusDot } from '@astryxdesign/core';
import { type ItemState } from '../model/data';
import { STATE_VARIANT } from './issue-status';

export function StateDot({ state }: { readonly state: ItemState }) {
  return <StatusDot variant={STATE_VARIANT[state]} label={state} />;
}
