import { useProjectList } from '@/features/project-list';
import { HgiPlus } from '@/shared/ui/icons';
import { Button, Text, VStack } from '@astryxdesign/core';
import { useState } from 'react';
import { ProjectNavigationItem } from './ProjectNavigationItem';

export function ProjectNavigation({ onOpen, onCreate }: { onOpen: (id: string, archived?: boolean) => void; onCreate: () => void }) {
  const { projects, moveProject } = useProjectList();
  const [announcement, setAnnouncement] = useState('');
  const move = (source: string, target: string) => {
    if (!source || source === target) return;
    moveProject(source, target);
    setAnnouncement(`${projects.find(project => project.id === source)?.name ?? '프로젝트'} 순서를 변경했습니다.`);
  };
  return <VStack gap={0} paddingBlockStart={2}>
    <VStack paddingBlockEnd={1}><Text weight="semibold">프로젝트</Text></VStack>
    <Text id="project-order-help" className="project-order-status">순서 변경 버튼을 끌거나 위·아래 방향키로 이동하세요.</Text>
    <VStack role="list" aria-label="참여 중인 프로젝트" gap={0}>
      {projects.map((project, index) => <ProjectNavigationItem key={project.id} project={project}
        onOpen={() => onOpen(project.id, project.archived)} onMove={move}
        onStep={direction => { const target = projects[index + direction]; if (target) move(project.id, target.id); }} />)}
    </VStack>
    {!projects.length ? <Text color="secondary">참여 중인 프로젝트가 없습니다.</Text> : null}
    <Button label="프로젝트 만들기" icon={<HgiPlus />} variant="secondary" onClick={onCreate} />
    <Text role="status" className="project-order-status">{announcement}</Text>
  </VStack>;
}
