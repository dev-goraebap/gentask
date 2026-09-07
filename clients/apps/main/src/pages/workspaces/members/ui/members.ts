import { type ProjectMember } from '@/entities/workspace';

export const ROLE_OPTIONS = [
  { value: 'editor', label: '편집자', description: '아티팩트를 작성하고 수정합니다.' },
  { value: 'viewer', label: '열람자', description: '아티팩트를 읽고 코멘트를 남깁니다.' },
];

export interface MembersProps {
  readonly projectId: string;
  readonly onPreview: (id?: string) => void;
}

export type MemberRow = ProjectMember & Record<string, unknown>;
