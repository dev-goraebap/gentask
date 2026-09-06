import { Token } from '@astryxdesign/core';
import { type ItemKind } from '../model/data';
import { KIND_COLOR, KIND_LABEL } from './issue-status';

export function KindToken({ kind }: { readonly kind: ItemKind }) {
  return <Token size="sm" color={KIND_COLOR[kind]} label={KIND_LABEL[kind]} />;
}
