import { useFilePreview } from '@/shared/lib/file-preview';
import { Avatar } from '@astryxdesign/core';
import type { Project } from '../model/data';

export function ProjectAvatar({ project, size = 'sm' }: { project: Pick<Project, 'name' | 'image'>; size?: 'sm' | 'md' | 'lg' }) {
  const src = useFilePreview(project.image);
  return <Avatar name={project.name.trim() || '프로젝트'} src={src} shape="rounded" size={size} tooltip={false} />;
}
