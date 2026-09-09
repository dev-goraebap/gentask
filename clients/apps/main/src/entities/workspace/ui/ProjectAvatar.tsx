import { useMemo } from 'react';
import { defaultProjectAvatarSource } from '../model/default-project-avatar';
import { useFilePreview } from '@/shared/lib/file-preview';
import { LoadingAvatar } from '@/shared/ui/loading-avatar';
import type { Project } from '../model/data';

export function ProjectAvatar({ project, size = 'sm' }: { project: Pick<Project, 'id' | 'name' | 'image'>; size?: 'sm' | 'md' | 'lg' }) {
  const src = useFilePreview(project.image);
  const fallback = useMemo(() => defaultProjectAvatarSource(project.id), [project.id]);
  return <LoadingAvatar name={project.name.trim() || '프로젝트'} src={src || fallback} fallbackSrc={fallback} shape="rounded" size={size} tooltip={false} />;
}
