import { ITEM_STATES } from '@/entities/issue';
import {
    HStack
} from '@astryxdesign/core';
import { BoardColumn } from './BoardColumn';
import { type ViewProps } from './issues';

export function BoardView({ items, onOpen }: ViewProps) {
  return (
    <HStack gap={3} align="start" isScrollable>
      {ITEM_STATES.map((state) => (
        <BoardColumn
          key={state}
          state={state}
          items={items.filter((i) => i.state === state)}
          onOpen={onOpen}
        />
      ))}
    </HStack>
  );
}
