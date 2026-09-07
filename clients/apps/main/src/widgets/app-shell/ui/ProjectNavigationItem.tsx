import { ProjectAvatar, type Project } from '@/entities/workspace';
import { HgiDrag } from '@/shared/ui/icons';
import { Button, HStack, SideNavItem, Token, VStack } from '@astryxdesign/core';
import { useState } from 'react';

export function ProjectNavigationItem({ project, onOpen, onMove, onStep }: {
  project: Project; onOpen: () => void; onMove: (source: string, target: string) => void; onStep: (direction: number) => void;
}) {
  const [over, setOver] = useState(false);
  return <VStack role="listitem" onDragOver={event => {
    if (!event.dataTransfer.types.includes('application/x-gentask-project')) return;
    event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setOver(true);
  }} onDragLeave={() => setOver(false)} onDrop={event => {
    event.preventDefault(); setOver(false);
    onMove(event.dataTransfer.getData('application/x-gentask-project'), project.id);
  }} style={over ? { outline: 'var(--border-width) solid var(--color-border-emphasized)', borderRadius: 'var(--radius-element)' } : undefined}>
    <SideNavItem label={project.name} icon={<HStack aria-hidden="true"><ProjectAvatar project={project} /></HStack>} onClick={onOpen}
      endContent={project.archived ? <Token label="보관" /> : undefined}
      actions={<Button label={`${project.name} 순서 변경`} isIconOnly icon={<HgiDrag />} variant="ghost" style={{ cursor: 'grab' }} draggable
        aria-describedby="project-order-help"
        onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-gentask-project', project.id); }}
        onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); onStep(event.key === 'ArrowUp' ? -1 : 1); } }} />} />
  </VStack>;
}
